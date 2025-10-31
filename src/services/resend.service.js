import { Resend } from 'resend';

const apiKey = process.env.MAIL_API_KEY;
const from = process.env.EMAIL_FROM || 'UplinHR <no-reply@uplinhr.com>';

let resend;
if (apiKey) {
  resend = new Resend(apiKey);
}

export async function sendEmail({ to, subject, html }) {
  if (!resend) return { skipped: true };
  try {
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function renderTemplate(type, metadata = {}) {
  const titleMap = {
    ACCOUNT_WELCOME: '¡Bienvenido/a a UplinHR! ',
    PASSWORD_RESET: 'Restablecimiento de contraseña',
    PLAN_PURCHASE: 'Actualización de tu plan/membresía',
    TALENT_SEARCH_UPDATE: 'Actualización de Búsqueda de Talento',
    CONSULTATION_UPDATE: 'Actualización de Consultoría',
  };
  const title = titleMap[type] || 'Notificación UplinHR';
  const body = renderBody(type, metadata);
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body{font-family:Arial, sans-serif; background:#f7f5fb; color:#222; margin:0; padding:0}
      .container{max-width:640px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06)}
      .header{background:#502B7D; padding:20px; text-align:center}
      .header h1{color:#fff; margin:0; font-size:22px}
      .content{padding:28px}
      .footer{background:#faf9fd; padding:18px; text-align:center; color:#666; font-size:12px}
      .btn{display:inline-block; padding:12px 18px; background:#6C4099; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold}
      .card{background:#faf9fd; border:1px solid #eee; border-radius:10px; padding:16px; margin:12px 0}
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header"><h1>UplinHR</h1></div>
      <div class="content">
        <h2>${title}</h2>
        ${body}
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} UplinHR • <a href="https://www.uplinhr.com" style="color:#6C4099; text-decoration:none">uplinhr.com</a>
      </div>
    </div>
  </body>
  </html>`;
}

function renderBody(type, m){
  switch(type){
    case 'ACCOUNT_WELCOME':
      return `<p>Gracias por registrarte. Ya podés explorar nuestros servicios.</p>`;
    case 'PASSWORD_RESET':
      return `<p>Hemos recibido tu solicitud. Si no fuiste vos, ignorá este correo.</p>`;
    case 'PLAN_PURCHASE': {
      if(m?.type === 'subscription_charge_success'){
        return `<div class="card"><p>Se procesó correctamente el cobro de tu membresía <strong>${m.plan ?? ''}</strong>.</p></div>`;
      }
      if(m?.type === 'subscription_charge_failed'){
        return `<div class="card"><p>No pudimos procesar tu cobro de membresía <strong>${m.plan ?? ''}</strong>. Intento #${m.attempt ?? 1}. Intentaremos nuevamente en breve.</p></div>`;
      }
      if(m?.type === 'subscription_start'){
        return `<div class="card"><p>¡Tu suscripción <strong>${m.plan ?? ''}</strong> ya está activa!</p></div>`;
      }
      return `<p>Actualización de plan.</p>`;
    }
    case 'TALENT_SEARCH_UPDATE':
      return `<p>Tenemos novedades sobre tu búsqueda.</p>`;
    case 'CONSULTATION_UPDATE':
      return `<p>Actualizamos detalles de tu consultoría.</p>`;
    default:
      return `<p>Notificación del sistema.</p>`;
  }
}
