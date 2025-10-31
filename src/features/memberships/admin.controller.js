import prisma from '../../database/prisma.js';

export const listPlans = async (req, res) => {
  const plans = await prisma.membershipPlan.findMany({ orderBy: { priceMonthly: 'asc' } });
  res.json({ success: true, data: plans });
};

export const upsertPlan = async (req, res) => {
  const { code, name, priceMonthly, currency = 'USD', creditsPerMonth, rolloverMonths = 0, benefits, isActive = true, mpProductId, paypalPlanId } = req.body;
  if (!code || !name || priceMonthly == null || creditsPerMonth == null) {
    return res.status(400).json({ success: false, error: 'code, name, priceMonthly, creditsPerMonth son requeridos' });
  }
  const plan = await prisma.membershipPlan.upsert({
    where: { code },
    update: { name, priceMonthly, currency, creditsPerMonth, rolloverMonths, benefits, isActive, mpProductId, paypalPlanId },
    create: { code, name, priceMonthly, currency, creditsPerMonth, rolloverMonths, benefits, isActive, mpProductId, paypalPlanId },
  });
  res.status(201).json({ success: true, data: plan });
};

export const listSubscriptions = async (req, res) => {
  const subs = await prisma.membershipSubscription.findMany({ include: { plan: true, user: { select: { id: true, email: true } } }, orderBy: { startedAt: 'desc' } });
  res.json({ success: true, data: subs });
};

export const updateSubscriptionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // ACTIVE, PAST_DUE, CANCELED, SUSPENDED
  const allowed = ['ACTIVE', 'PAST_DUE', 'CANCELED', 'SUSPENDED'];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, error: 'status inválido' });
  const sub = await prisma.membershipSubscription.update({ where: { id }, data: { status, suspendedAt: status === 'SUSPENDED' ? new Date() : null } });
  res.json({ success: true, data: sub });
};
