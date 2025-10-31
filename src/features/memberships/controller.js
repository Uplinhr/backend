import prisma from '../../database/prisma.js';
import { subscribe, cancel, resume } from './service.js';

async function getUserIdFromAuth(req) {
  const sub = req.auth?.payload?.sub;
  if (!sub) throw new Error('Unauthorized');
  const user = await prisma.user.findFirst({ where: { auth0Id: sub } });
  if (!user) throw new Error('User not found');
  return user.id;
}

export const subscribeCtrl = async (req, res) => {
  try {
    const userId = await getUserIdFromAuth(req);
    const { planCode, provider } = req.body;
    if (!planCode) return res.status(400).json({ error: 'planCode requerido' });
    const sub = await subscribe(userId, planCode, provider === 'PAYPAL' ? 'PAYPAL' : 'MP');
    return res.status(201).json({ success: true, data: sub });
  } catch (err) {
    return res.status(err.message === 'Unauthorized' ? 401 : 400).json({ success: false, error: err.message });
  }
};

export const cancelCtrl = async (req, res) => {
  try {
    const userId = await getUserIdFromAuth(req);
    const sub = await cancel(userId);
    return res.json({ success: true, data: sub });
  } catch (err) {
    return res.status(err.message === 'Unauthorized' ? 401 : 400).json({ success: false, error: err.message });
  }
};

export const resumeCtrl = async (req, res) => {
  try {
    const userId = await getUserIdFromAuth(req);
    const sub = await resume(userId);
    return res.json({ success: true, data: sub });
  } catch (err) {
    return res.status(err.message === 'Unauthorized' ? 401 : 400).json({ success: false, error: err.message });
  }
};
