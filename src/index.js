import app from './app.js'
import { startBillingCron } from './cron/billing.cron.js'

const PORT = app.get('port')
app.listen(PORT, () => {
    console.log("🚀 Servidor ejecutándose en puerto:", PORT);
    console.log("📊 Entorno:", process.env.NODE_ENV || 'development');
    startBillingCron();
}).on('error', (err) => {
    console.error('❌ Error al iniciar el servidor:', err.message);
    process.exit(1);
});