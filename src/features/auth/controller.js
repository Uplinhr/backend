import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../database/prisma.js';
import authModel from './model.js';
import { getTokenFromRequest } from '../../middlewares/auth.js';
import reinicio_contraseniaModel from '../reinicio_contrasenia/model.js';
import { successRes, errorRes } from "../../utils/apiResponse.js";
import { Resend } from "resend";


/**
 * Registra un nuevo usuario en la base de datos
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.body.nombre - Nombre del usuario
 * @param {string} req.body.apellido - Apellido del usuario
 * @param {string} req.body.contrasenia - Contraseña sin hashear del usuario
 * @param {string} req.body.email - Correo electrónico válido
 * @param {string} [req.body.num_celular] - Correo electrónico válido (opcional)
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} No retorna valor directamente, pero sí su ID junto con la respuesta HTTP
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Crea un nuevo usuario en la base de datos con los datos proporcionados.
 * - Hashea la contraseña antes de almacenarla
 * - Valida que los campos obligatorios estén presentes
 * - Maneja errores de duplicado de email (ER_DUP_ENTRY)
 */
export const register = async (req, res) => {
  try {
    // Soporte para campos legacy y nuevos
    // Soporte para campos legacy y nuevos
    const nombre = req.body.nombre || req.body.name;
    const apellido = req.body.apellido;
    const contrasenia = req.body.contrasenia || req.body.password;
    const email = req.body.email;
    const num_celular = req.body.num_celular;

    const { 
      companyName, country, website, linkedin, 
      companyEmail, companyPhone, companyAddress, companyTaxId 
    } = req.body;

    if(!nombre || !contrasenia || !email) {
      return errorRes(res, {
        message: 'Se requieren nombre, email y contraseña',
        statusCode: 400
      })
    }

    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    const newUser = await authModel.createUsuario({
      nombre,
      apellido,
      hashedPassword,
      email,
      num_celular,
      companyName,
      country,
      website,
      linkedin,
      companyEmail,
      companyPhone,
      companyAddress,
      companyTaxId
    });

    // Generar token para onboarding fluido
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    const resend = new Resend(process.env.MAIL_API_KEY);
    const { data, error } = await resend.emails.send({
      from: `UplinHR <${process.env.EMAIL_FROM}>`,
      to: ["contacto@uplinhr.com"],
      subject: "Registro de usuario - UplinHR",
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Se ha registrado un nuevo usuario - UplinHR</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #FFFFFF;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                }
                .header {
                    background-color: #502B7D;
                    padding: 20px;
                    text-align: center;
                }
                .header h1 {
                    color: #FFFFFF;
                    margin: 0;
                    font-size: 24px;
                }
                .content {
                    padding: 30px;
                }
                .footer {
                    background-color: #f5f5f5;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #6C4099;
                    color: #FFFFFF;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .info-box {
                    background-color: #f9f5ff;
                    border-left: 4px solid #6C4099;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 0 4px 4px 0;
                }
            </style>
        </head>
        <body>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f9; padding: 20px 0;">
                <tr>
                    <td align="center">
                        <div class="container">
                            <div class="header">
                                <h1>UplinHR</h1>
                            </div>

                            <div class="content">
                                <h2 style="color: #502B7D; margin-top: 0;">Nuevo registro de usuario</h2>
                                <p>Hola equipo UplinHR,</p>
                                <p>Se ha registrado un nuevo usuario en la plataforma.</p>

                                <div class="info-box">
                                    <p><strong>Nombre:</strong></p>
                                    <p>${[nombre, apellido].filter(Boolean).join(' ')}</p>
                                    <p><strong>Correo electrónico del nuevo usuario:</strong></p>
                                    <p>${email}</p>
                                </div>

                                <p>Accede al sistema administrativo:</p>

                                <p style="text-align: center;">
                                    <a href="https://www.uplinhr.com/login" class="button">
                                        Acceder al sistema
                                    </a>
                                </p>

                                <p>Este es un mensaje automático, por favor no responder directamente a este correo.</p>
                            </div>

                            <div class="footer">
                                <p>Equipo UplinHR<br>
                                <a href="https://www.uplinhr.com" style="color: #502B7D;">www.uplinhr.com</a></p>
                                <p>© ${new Date().getFullYear()} UplinHR. Todos los derechos reservados.</p>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `
    });
    if (error) {
      console.error('Error enviando email:', error)
    }

    // Enviar email de verificación al usuario
    try {
      const verifyToken = jwt.sign({ id: newUser.id, purpose: 'verify_email' }, process.env.JWT_SECRET, { expiresIn: '24h' });
      const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
      await resend.emails.send({
        from: `UplinHR <${process.env.EMAIL_FROM}>`,
        to: [email],
        subject: 'Confirma tu correo - UplinHR',
        html: `
          <html><body style="font-family:Arial,sans-serif">
            <h2 style="color:#502B7D;">Confirma tu correo</h2>
            <p>Hola ${[nombre, apellido].filter(Boolean).join(' ') || ''}, gracias por registrarte en UplinHR.</p>
            <p>Para activar tu cuenta, por favor confirma tu correo haciendo clic en el siguiente botón:</p>
            <p style="text-align:center;margin:24px 0;">
              <a href="${verifyLink}" style="display:inline-block;padding:12px 20px;background:#6C4099;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Confirmar correo</a>
            </p>
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p><a href="${verifyLink}">${verifyLink}</a></p>
            <p style="color:#666;font-size:12px">Este enlace expira en 24 horas.</p>
          </body></html>
        `,
      });
    } catch (e) {
      console.error('No se pudo enviar verificación de email:', e?.message || e);
    }

    successRes(res, {
      data: { id: newUser.id, token },
      message: 'Usuario creado exitosamente',
      statusCode: 201
    })
  } catch (error) {
    if (res.headersSent) {
      console.error('Error después de enviar respuesta:', error);
      return;
    }
    if (error.code === 'P2002') { // Prisma unique constraint error
      errorRes(res, {
        message: 'El email ya está registrado',
        statusCode: 409,
        errors: error.code
      });
    } else {
      errorRes(res, {
        message: 'Error al crear usuario',
        statusCode: 500,
        errors: error.message
      });
    }
  }
};

// Envía verificación de email al usuario autenticado (JWT local)
export const sendVerifyEmail = async (req, res) => {
  try {
    const userId = String(req.user.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return errorRes(res, { message: 'Usuario no encontrado', statusCode: 404 });
    if (user.emailVerified) return successRes(res, { message: 'El email ya está verificado', statusCode: 200 });

    const verifyToken = jwt.sign({ id: userId, purpose: 'verify_email' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
    const resend = new Resend(process.env.MAIL_API_KEY);
    await resend.emails.send({
      from: `UplinHR <${process.env.EMAIL_FROM}>`,
      to: [user.email],
      subject: 'Confirma tu correo - UplinHR',
      html: `<html><body><p>Confirma tu correo:</p><p><a href="${verifyLink}">${verifyLink}</a></p></body></html>`,
    });
    return successRes(res, { message: 'Email de verificación enviado', statusCode: 200 });
  } catch (error) {
    return errorRes(res, { message: 'Error enviando verificación', statusCode: 500, errors: error.message });
  }
};

// Confirma verificación de email usando token
export const confirmVerifyEmail = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    if (!token) return errorRes(res, { message: 'Token requerido', statusCode: 400 });
    const decoded = jwt.verify(String(token), process.env.JWT_SECRET);
    if (decoded.purpose !== 'verify_email' || !decoded.id) {
      return errorRes(res, { message: 'Token inválido', statusCode: 400 });
    }
    await prisma.user.update({ where: { id: String(decoded.id) }, data: { emailVerified: true } });
    return successRes(res, { message: 'Email verificado correctamente', statusCode: 200 });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorRes(res, { message: 'El enlace ha expirado', statusCode: 400 });
    }
    return errorRes(res, { message: 'Error verificando email', statusCode: 500, errors: error.message });
  }
};


/**
 * Inicia sesión al usuario
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.body.email - Correo electrónico válido
 * @param {string} req.body.contrasenia - Contraseña sin hashear del usuario
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} retorna un usuario con sus tablas relacionadas, y el token
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Verifica las credenciales proporcionadas del usuario y crea un token con expiración de 1 hora
 * - Compara la contrasenia hasheada del usuario con la proporcionada en los parámetros
 * - Verifica que exista un usuario con el mail proporcionado en los parámetros
 */
export const login = async (req, res) => {
  try {
    // Soporte para campos legacy y nuevos
    const email = req.body.email;
    const contrasenia = req.body.contrasenia || req.body.password;

    if (!email || !contrasenia) {
      return errorRes(res, {
        message: 'Email y contraseña son requeridos',
        statusCode: 400
      });
    }

    if (process.env.DEV) console.log('[LOGIN] email received:', email);

    const user = await authModel.login(email)
    if (process.env.DEV) console.log('[LOGIN] user found:', !!user);

    if (!user) return errorRes(res, {message: 'Usuario no encontrado',statusCode: 404});

    if (!user.contrasenia) {
      return errorRes(res, { message: 'El usuario no tiene contraseña local. Restablece la contraseña o ingresa con Auth0.', statusCode: 400 });
    }

    if (process.env.DEV) console.log('[LOGIN] hash length:', user.contrasenia ? String(user.contrasenia).length : 0);
    const isMatch = await bcrypt.compare(contrasenia, user.contrasenia);
    if (process.env.DEV) console.log('[LOGIN] bcrypt.compare result:', isMatch);
    if (!isMatch) return errorRes(res, {message: 'Contraseña incorrecta',statusCode: 400});

    if(!user.active) return errorRes(res, {message: 'Usuario desactivado',statusCode: 400});

    if (!user.emailVerified) {
      return errorRes(res, { message: 'Por favor verifica tu correo electrónico para iniciar sesión.', statusCode: 403 });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.cookie('token', token, { httpOnly: true, secure: !process.env.DEV });
    successRes(res, {
      data: { user, token },
      message: 'Sesión iniciada',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al iniciar sesión',
      statusCode: 500,
      errors: error.message
    });
  }
};

/**
 * Verifica si el token del usuario sigue siendo válido
 * @param {Object} req - Objeto de petición de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} retorna una respuesta HTML
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Verifica el token del usuario almacenado en sus cookies
 * - Verifica que tenga un token almacenado
 * - Verifica que el token coincida con un usuario dentro de la base de datos
 */
export const checkToken = async (req, res) => {
  try{
    const token = getTokenFromRequest(req)
  if(!token){
    return errorRes(res, {
      message: 'No autorizado',
      statusCode: 401,
      success: false
    })
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, name: true, role: true, deletedAt: true }
  });
  if(!user || user.deletedAt){
    return errorRes(res, {
      message: 'Token invalido',
      statusCode: 401,
      success: false
    })
  }
  return successRes(res, {
    message: 'Token checkeado',
    statusCode: 201,
    success: true
  })
  } catch(error){
    console.error(error)
    return errorRes(res,{
      message: 'Ocurrio un error al checkear el token',
      statusCode: 400,
      success: false
    })
  }
}

/**
 * Edita la contraseña del usuario
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.params.id - ID numérico del usuario
 * @param {string} req.body.contrasenia - Contraseña sin hashear del usuario
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} Retorna una respuesta HTML
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Modifica la contraseña del usuario, solo deja cambiar la suya propia en caso de no poseer el rol de admin
 * - Hashea la contraseña antes de modificar el registro en la base de datos
 * - Verifica que el ID sea numérico
 */
export const editPassword = async (req, res) => {
  try{
    const {id} = req.params
    if(isNaN(id)) {
      return errorRes(res, {
        message: 'El id debe ser un numero',
        statusCode: 404
      })
    }
    if(Number(req.user.id) !== Number(id) && req.user.rol !== 'admin'){
      return errorRes(res, {
        message: 'Solo puedes cambiar tu propia contraseña',
        statusCode: 404
      })
    }
    const {contrasenia} = req.body
    const hashedPassword = await bcrypt.hash(contrasenia, 10);
    const changed = await authModel.editPassword(id, hashedPassword)
    if(!changed){
      return errorRes(res, {
        message: 'No se editó la contraseña',
        statusCode: 500
      })
    }
    successRes(res, {
      message: 'Contraseña editada exitosamente',
      statusCode: 201,
      data: changed
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al editar la contraseña',
      statusCode: 500,
      errors: error.message
    });
  }
}

/**
 * Envía un correo al usuario para restablecer su contraseña
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.body.email - Correo electrónico del usuario
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} Retorna una respuesta HTML
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Procesa la solicitud de restablecimiento de contraseña:
 * 1. Valida que el usuario exista y esté activo
 * 2. Genera un token seguro de un solo uso con expiración de 1 hora
 * 3. Crea un registro en la base de datos para el reinicio
 * 4. Envía un email con enlace de restablecimiento usando Resend
 * 5. Maneja errores específicos de validación y envío de email
 */
export const requestPasswordReset = async (req, res) => {
  const resend = new Resend(process.env.MAIL_API_KEY);
  const {email} = req.body
  try{
    const user = await authModel.login(email)
    if(!user){
      return errorRes(res, {
        message: "No se ha encontrado el email",
        statusCode: 404
      })
    }
    if(!user.active){
      return errorRes(res, {
        message: "Usuario desactivado",
        statusCode: 409
      })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const fechaExp = new Date(Date.now() + 1 * 60 * 60 * 1000) //Expira en 1 hora

    const registro = await reinicio_contraseniaModel.create(token, email, fechaExp, user.id)
    if(!registro){
      return errorRes(res, {
        message: 'Falló la creación del registro de cambio de contraseña',
        statusCode: 400
      })
    }

    const resetLink = `${process.env.FRONTEND_URL}/restablecer-clave?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: `Uplin <${process.env.EMAIL_FROM}>`,
      to: [email],
      subject: "Restablecer tu contraseña - Uplin",
      html: `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0; background-color:#f9f9f9;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f9; padding: 20px 0;">
                  <tr>
                      <td align="center">
                          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #FFFFFF; padding: 20px; border-radius: 10px;">
                              <tr>
                                  <td>
                                      <h2 style="color: #502B7D; text-align: center;">Restablecer tu contraseña</h2>
                                      <p>Hola ${user.nombre},</p>
                                      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta Uplin.</p>
                                      <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                                      <p style="text-align: center;">
                                          <a href="${resetLink}"
                                             style="display: inline-block; padding: 12px 24px; background-color: #6C4099; color: #FFFFFF; text-decoration: none; border-radius: 5px; font-weight: bold;">
                                             Restablecer contraseña
                                          </a>
                                      </p>
                                      <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
                                      <p>El link expirará en 1 hora por seguridad.</p>
                                      <hr style="border:0; border-top:1px solid #eee; margin: 30px 0;">
                                      <p style="color: #666; font-size: 12px; text-align: center;">
                                          Equipo Uplin<br>
                                          Si tienes problemas con el botón, copia y pega esta URL en tu navegador:<br>
                                          <a href="${resetLink}" style="color: #502B7D; word-break: break-all;">${resetLink}</a>
                                      </p>
                                  </td>
                              </tr>
                          </table>
                      </td>
                  </tr>
              </table>
          </body>
          </html>
      `
    });
    if (error) {
      console.error('Error enviando email:', error)
      return errorRes(res, {
        message: 'Error al enviar el email de recuperación',
        statusCode: error.statusCode,
        errors: error.message
      })
    }
    successRes(res, {
      message: 'Email de recuperación enviado correctamente',
      statusCode: 200,
      data: data
    })
  } catch(error){
    console.error('Error en requestPasswordReset:', error);
    errorRes(res, {
      message: 'Error al procesar la solicitud de recuperación',
      statusCode: 500,
      errors: error.message
    });
  }
}

/**
 * Verifica si el token de cambio de contraseña es válido
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.body.token - Token de cambio de contraseña
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} retorna una respuesta HTML junto con el mail del usuario
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Verifica el token de cambio de contraseña
 * - Verifica que tenga un token almacenado
 * - Verifica que el token se encuentre en la base de datos, que no esté usado ni expirado
 */
export const validateResetToken = async (req, res) => {
  const {token} = req.body

  try{
    if(!token){
      return errorRes(res, {
          message: 'Token requerido',
          statusCode: 400
      })
    }

    const checkToken = await reinicio_contraseniaModel.getByToken(token)

    if(!checkToken){
      return errorRes(res, {
        message: 'El token no existe o no es válido',
        statusCode: 404
      })
    }
    if(checkToken.used == true){
      return errorRes(res, {
        message: 'Este enlace de recuperación ya fue utilizado. Por favor, solicita uno nuevo.',
        statusCode: 400
      })
    }
    if(new Date(checkToken.fecha_exp) <= new Date()){
      return errorRes(res, {
          message: 'El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.',
          statusCode: 400
      })
    }
    return successRes(res, {
      message: 'Token válido para restablecer contraseña',
      statusCode: 200,
      data: { 
        valid: true, 
        email: checkToken.email
      }
    })
  } catch(error){
    console.error('Error validando token:', error);
    errorRes(res, {
      message: 'Error al validar el enlace de recuperación',
      statusCode: 500,
      errors: error.message
    });
  }
}

/**
 * Edita la contraseña del usuario
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.body.contrasenia - Contraseña sin hashear del usuario
 * @param {string} req.body.token - Token de cambio de contraseña
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} Retorna una respuesta HTML
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Modifica la contraseña del usuario, realiza verificaciones del token por segunda vez
 * - Hashea la contraseña antes de modificar el registro en la base de datos
 * - Verifica que el token exista, sea válido y no esté usado
 * - Marca el registro de cambio de contraseña como usado
 */
export const resetPassword = async (req, res)=> {
  try{
    const {contrasenia, token} = req.body
    if(!contrasenia || !token) {     //No es necesario este if
      return errorRes(res, {
          message: 'Token y nueva contraseña son requeridos',
          statusCode: 404
      })
    }

    //Se verifica otra vez por seguridad
    const checkToken = await reinicio_contraseniaModel.getByToken(token)

    if(!checkToken){
      return errorRes(res, {
        message: 'El enlace de recuperación no es válido o no existe',
        statusCode: 404
      });
    }
    if(checkToken.used == true){
      return errorRes(res, {
        message: 'Este enlace de recuperación ya fue utilizado. Por favor, solicita uno nuevo.',
        statusCode: 400
      })
    }
    if(new Date(checkToken.fecha_exp) <= new Date()){
      return errorRes(res, {
          message: 'El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.',
          statusCode: 400
      })
    }
    const hashedPassword = await bcrypt.hash(contrasenia, 10);
    const updated = await authModel.editPassword(checkToken.id_usuario, hashedPassword)
    if(!updated){
      return errorRes(res, {
        message: 'No se actualizó la contraseña',
        statusCode: 500
      })
    }

    await reinicio_contraseniaModel.setTokenAsUsed(checkToken.id)
    successRes(res, {
      message: 'Contraseña editada exitosamente, ya puedes iniciar sesión con tu nueva contraseña',
      statusCode: 200,
      data: {success: true}
    })
  } catch(error){
    console.error('Error resetting password:', error);
    errorRes(res, {
      message: 'Error al restablecer la contraseña',
      statusCode: 500,
      errors: error.message
    });
  }
}

/**
 * Desloguea al usuario
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} retorna una respuesta HTML
 * @description
 * Elimina el token del usuario almacenado en sus cookies
 */
export const logout = (req, res) => {
    res.clearCookie('token');
    successRes(res, {
      message: 'Sesión cerrada',
      statusCode: 201
    })
};