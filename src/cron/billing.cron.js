import cron from 'node-cron';
import { processDueSubscriptions } from '../features/memberships/service.js';

const SCHEDULE = process.env.BILLING_CRON || '0 3 * * *';
const TZ = process.env.BILLING_TIMEZONE || 'UTC';

export function startBillingCron() {
  const task = cron.schedule(SCHEDULE, async () => {
    try {
      await processDueSubscriptions(new Date());
    } catch (err) {
      // Intencional: el servicio ya emite notificaciones; aquí evitamos caer el proceso.
      console.error('Billing cron error:', err.message);
    }
  }, { timezone: TZ });
  return task;
}
