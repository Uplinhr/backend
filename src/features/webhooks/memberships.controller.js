import prisma from '../../database/prisma.js';

export const mpMembershipsWebhook = async (req, res) => {
  try {
    const event = req.body;
    // MercadoPago puede enviar diferentes tipos; buscamos datos útiles
    const type = event.type || event.action || event.topic;
    const data = event.data || {};
    const preapprovalId = data.id || event.id || event.resource || null;

    if (!type) return res.status(400).json({ ok: false });

    // Si recibimos preapproval o authorized_payment, intentamos conciliar
    if (preapprovalId) {
      const sub = await prisma.membershipSubscription.findFirst({ where: { externalSubscriptionId: preapprovalId } });
      if (sub) {
        const now = new Date();
        if (String(type).toLowerCase().includes('authorized') || String(type).toLowerCase().includes('payment') || String(type).toLowerCase().includes('charged')) {
          const next = new Date(now);
          next.setMonth(next.getMonth() + 1);
          await prisma.membershipSubscription.update({
            where: { id: sub.id },
            data: { lastChargedAt: now, lastChargeResult: 'SUCCESS', retryAttempts: 0, status: 'ACTIVE', nextBillingAt: next },
          });
        }
        if (String(type).toLowerCase().includes('paused') || String(type).toLowerCase().includes('cancel')) {
          await prisma.membershipSubscription.update({ where: { id: sub.id }, data: { status: 'SUSPENDED', suspendedAt: new Date() } });
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: true });
  }
};

export const paypalMembershipsWebhook = async (req, res) => {
  try {
    const event = req.body;
    const eventType = event.event_type;
    const resource = event.resource || {};
    const subscriptionId = resource.id || resource.billing_agreement_id || null;

    if (!eventType) return res.status(400).json({ ok: false });

    if (subscriptionId) {
      const sub = await prisma.membershipSubscription.findFirst({ where: { externalSubscriptionId: subscriptionId } });
      if (sub) {
        const now = new Date();
        if (eventType === 'PAYMENT.SALE.COMPLETED' || eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
          const next = new Date(now);
          next.setMonth(next.getMonth() + 1);
          await prisma.membershipSubscription.update({
            where: { id: sub.id },
            data: { lastChargedAt: now, lastChargeResult: 'SUCCESS', retryAttempts: 0, status: 'ACTIVE', nextBillingAt: next },
          });
        }
        if (eventType === 'PAYMENT.SALE.DENIED') {
          await prisma.membershipSubscription.update({ where: { id: sub.id }, data: { lastChargeResult: 'FAILED', status: 'PAST_DUE' } });
        }
        if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' || eventType === 'BILLING.SUBSCRIPTION.SUSPENDED') {
          await prisma.membershipSubscription.update({ where: { id: sub.id }, data: { status: 'SUSPENDED', suspendedAt: new Date() } });
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({ ok: true });
  }
};
