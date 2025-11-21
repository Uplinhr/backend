import prisma from '../../database/prisma.js';
import { sendEmail, renderTemplate } from '../../services/resend.service.js';
import mercadopago from 'mercadopago';
import paypal from '@paypal/checkout-server-sdk';

export async function subscribe(userId, planCode, provider = 'MP') {
  const plan = await prisma.membershipPlan.findUnique({ where: { code: planCode } });
  if (!plan || !plan.isActive) throw new Error('Plan inválido');

  const now = new Date();
  const nextBillingAt = addMonthsUTC(now, 1);

  let external = { customerId: null, subscriptionId: null };
  try {
    if (provider === 'MP') external = await createMercadoPagoPreapproval(userId, plan);
    if (provider === 'PAYPAL') external = await createPayPalSubscription(userId, plan);
  } catch (e) {
    // No bloquear suscripción local si la creación externa falla; se reintenta por UI/admin
  }

  const sub = await prisma.membershipSubscription.create({
    data: {
      userId,
      planId: plan.id,
      status: 'ACTIVE',
      nextBillingAt,
      externalCustomerId: external.customerId,
      externalSubscriptionId: external.subscriptionId,
      maxRetryAttempts: parseInt(process.env.BILLING_MAX_RETRIES || '3', 10),
      retryIntervalHrs: parseInt(process.env.BILLING_RETRY_INTERVAL_HRS || '24', 10),
      graceDays: parseInt(process.env.BILLING_GRACE_DAYS || '7', 10),
    },
    include: { plan: true },
  });

  await notify(userId, 'PLAN_PURCHASE', { plan: plan.code, type: 'subscription_start' });
  return sub;
}

export async function cancel(userId) {
  const sub = await getActiveSubscription(userId);
  if (!sub) return null;
  return prisma.membershipSubscription.update({
    where: { id: sub.id },
    data: { status: 'CANCELED', canceledAt: new Date() },
  });
}

export async function resume(userId) {
  const sub = await prisma.membershipSubscription.findFirst({
    where: { userId, status: { in: ['CANCELED', 'SUSPENDED'] } },
    orderBy: { startedAt: 'desc' },
    include: { plan: true },
  });
  if (!sub) throw new Error('No hay suscripción para reanudar');
  return prisma.membershipSubscription.update({
    where: { id: sub.id },
    data: { status: 'ACTIVE', suspendedAt: null, nextBillingAt: addMinutesUTC(new Date(), 1) },
  });
}

export async function getActiveSubscription(userId) {
  return prisma.membershipSubscription.findFirst({ where: { userId, status: 'ACTIVE' }, include: { plan: true } });
}

export async function processDueSubscriptions(now = new Date()) {
  const due = await prisma.membershipSubscription.findMany({
    where: { status: { in: ['ACTIVE', 'PAST_DUE'] }, nextBillingAt: { lte: now } },
    include: { plan: true, user: true },
  });

  const results = [];
  for (const sub of due) {
    const attempt = await attemptCharge(sub);
    if (attempt.success) {
      // marcar cobro
      await prisma.membershipSubscription.update({
        where: { id: sub.id },
        data: {
          lastChargedAt: now,
          lastChargeResult: 'SUCCESS',
          retryAttempts: 0,
          status: 'ACTIVE',
          nextBillingAt: addMonthsUTC(now, 1),
        },
      });
      // asignar créditos mensuales
      await grantMonthlyCredits(sub.userId, sub.plan.creditsPerMonth, sub.plan.rolloverMonths);
      await notify(sub.userId, 'PLAN_PURCHASE', { plan: sub.plan.code, type: 'subscription_charge_success' });
      results.push({ id: sub.id, ok: true });
    } else {
      const retryAttempts = sub.retryAttempts + 1;
      const max = sub.maxRetryAttempts;
      const nextTry = addHoursUTC(now, sub.retryIntervalHrs || 24);
      let status = 'PAST_DUE';
      if (retryAttempts > max) {
        // excedió reintentos
        status = 'SUSPENDED';
      }
      await prisma.membershipSubscription.update({
        where: { id: sub.id },
        data: {
          lastChargedAt: now,
          lastChargeResult: 'FAILED',
          retryAttempts,
          status,
          nextBillingAt: nextTry,
          suspendedAt: status === 'SUSPENDED' ? now : null,
        },
      });
      await notify(sub.userId, 'PLAN_PURCHASE', { plan: sub.plan.code, type: 'subscription_charge_failed', attempt: retryAttempts });
      results.push({ id: sub.id, ok: false });
    }
  }
  return results;
}

async function attemptCharge(subscription) {
  // Stub de cobro: aquí integrarías MP/PayPal. Por ahora, simular SUCCESS.
  return { success: true };
}

async function grantMonthlyCredits(userId, credits, rolloverMonths) {
  if (!credits || credits <= 0) return;
  await prisma.credit.create({
    data: {
      userId,
      type: 'PLAN',
      amount: credits,
      expiryDate: rolloverMonths > 0 ? addMonthsUTC(new Date(), rolloverMonths) : null,
      isActive: true,
    },
  });
}

async function notify(userId, type, metadata) {
  await prisma.notification.create({
    data: { userId, type, subject: `Notificación ${type}`, metadata },
  });
  await sendEmail({ to: (await prisma.user.findUnique({ where: { id: userId } })).email, subject: `Uplin - ${type}`, html: renderTemplate(type, metadata) });
}

function addMonthsUTC(date, months) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}
function addHoursUTC(date, hours) {
  return new Date(date.getTime() + hours * 3600 * 1000);
}
function addMinutesUTC(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

// ======= Integración Mercadopago (Preapproval) =======
async function createMercadoPagoPreapproval(userId, plan) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return { customerId: null, subscriptionId: null };
  mercadopago.configure({ access_token: token });
  // Nota: SDK MP para preapproval varía; aquí dejamos un scaffold genérico.
  // Se recomienda usar el endpoint Preapproval de Suscripciones si está habilitado.
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const backUrl = `${process.env.WEBHOOK_BASE_URL}/api/mercadopago/webhook` || '';
    // Pseudocódigo: crear preapproval (subscription) para débito automático
    // const resp = await mercadopago.preapproval.create({ ... });
    // return { customerId: resp.payer_id, subscriptionId: resp.id };
    return { customerId: user.email, subscriptionId: null, webhookUrl: backUrl };
  } catch (e) {
    return { customerId: null, subscriptionId: null, webhookUrl: backUrl };
  }
}

// ======= Integración PayPal (Subscriptions) =======
function paypalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const env = new paypal.core.SandboxEnvironment(clientId, clientSecret);
  return new paypal.core.PayPalHttpClient(env);
}

async function createPayPalSubscription(userId, plan) {
  const client = paypalClient();
  if (!client) return { customerId: null, subscriptionId: null };
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // Pseudocódigo: crear plan/subscripción en PayPal o usar plan ya configurado (plan.paypalPlanId)
    // const request = new paypal.subscriptions.SubscriptionsCreateRequest();
    // request.requestBody({ plan_id: plan.paypalPlanId, subscriber: { email_address: user.email } });
    // const response = await client.execute(request);
    // return { customerId: user.email, subscriptionId: response.result.id };
    return { customerId: user.email, subscriptionId: null };
  } catch (e) {
    return { customerId: null, subscriptionId: null };
  }
}
