import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authModel from './model.js';
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

    const token = jwt.sign({ id: idUsuario }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.cookie('token', token, { httpOnly: true });
    successRes(res, {
      data: { id: idUsuario, token },
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
  const {mail} = req.body
  try{
    const user = await authModel.login(mail)
    if(!user){
      return errorRes(res, {
        message: "No se ha encontrado el mail",
        statusCode: 404
      })
    }
    if(!user.active){
      return errorRes(res, {
        message: "Usuario desactivado",
        statusCode: 409
      })
    }

    
    //generar token y hashearlo

    //crear resetPassword

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: `Uplin <${process.env.EMAIL_FROM}>`,
      to: [mail],
      subject: "hello world",
      html: "<strong>Esto deberia tener un link con un token</strong>",
    });
    if (error) {
      return errorRes(res, {
        message: 'Error de resend',
        statusCode: error.statusCode,
        errors: error.message || error.error
      })
    }
    successRes(res, {
      message: 'Se envió el mail correctamente',
      statusCode: 200,
      data: data
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al enviar el mail para recuperar contraseña',
      statusCode: 500,
      errors: error.message
    });
  }
}

// Despues del mail
export const recoverPassword = async (req, res)=> {
  const { token } = req.cookies; //Puede ser que no esté en las cookies
  try{
    const {id, contrasenia} = req.body
    if(isNaN(id)) {     //No es necesario este if
      return errorRes(res, {
          message: 'El id debe ser un numero',
          statusCode: 404
      })
    }
    const hashedPassword = await bcrypt.hash(contrasenia, 10);
    await authModel.editPassword(id, hashedPassword)
    successRes(res, {
      message: 'Contraseña editada exitosamente',
      statusCode: 201
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al recuperar la contraseña',
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