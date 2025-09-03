import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authModel from './model.js';
import reinicio_contraseniaModel from '../reinicio_contrasenia/model.js';
import { successRes, errorRes } from "../../utils/apiResponse.js";
import { Resend } from "resend";

export const register = async (req, res) => {
  try {
    const {nombre, apellido, contrasenia, email, num_celular} = req.body;
    if(!nombre || !apellido || !contrasenia || !email) {
      return errorRes(res, {
        message: 'Se requieren todos los campos',
        statusCode: 404
      })
    }
    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    const idUsuario = await authModel.createUsuario(nombre, apellido, hashedPassword, email, num_celular)

    successRes(res, {
      data: { id: idUsuario},
      message: 'Usuario creado exitosamente',
      statusCode: 201
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      errorRes(res, {
        message: 'El email ya está registrado',
        statusCode: 409,
        errors: error.code
      });
    }
    errorRes(res, {
      message: 'Error al crear usuario',
      statusCode: 500,
      errors: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const user = await authModel.login(req.body.email)

    if (!user) return errorRes(res, {message: 'Usuario no encontrado',statusCode: 404});

    const isMatch = await bcrypt.compare(req.body.contrasenia, user.contrasenia);
    if (!isMatch) return errorRes(res, {message: 'Contraseña incorrecta',statusCode: 400});

    if(!user.active) return errorRes(res, {message: 'Usuario desactivado',statusCode: 400});

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

// Enviar el mail
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
    const fechaExp = newDate(Date.now() + 1 * 60 * 60 * 1000) //Expira en 1 hora

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
              <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .button { 
                      display: inline-block; 
                      padding: 12px 24px; 
                      background-color: #007bff; 
                      color: white; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      margin: 20px 0; 
                  }
                  .footer { 
                      margin-top: 30px; 
                      padding-top: 20px; 
                      border-top: 1px solid #eee; 
                      color: #666; 
                      font-size: 12px; 
                  }
              </style>
          </head>
          <body>
              <div class="container">
                  <h2>Restablecer tu contraseña</h2>
                  <p>Hola ${user.nombre},</p>
                  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta Uplin.</p>
                  <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                  
                  <a href="${resetLink}" class="button">Restablecer contraseña</a>
                  
                  <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
                  <p>El link expirará en 1 hora por seguridad.</p>
                  
                  <div class="footer">
                      <p>Equipo Uplin</p>
                      <p>Si tienes problemas con el botón, copia y pega esta URL en tu navegador:</p>
                      <p>${resetLink}</p>
                  </div>
              </div>
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

//chequear token
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

// Despues del mail
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

export const logout = (req, res) => {
    res.clearCookie('token');
    successRes(res, {
      message: 'Sesión cerrada',
      statusCode: 201
    })
};