import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authModel from './model.js';
import { successRes, errorRes } from "../../utils/apiResponse.js";

export const register = async (req, res) => {
  try {
    const {nombre, apellido, contrasenia, email} = req.body;
    if(!nombre || !apellido || !contrasenia || !email) {
      return errorRes(res, {
        message: 'Se requieren todos los campos',
        statusCode: 404
      })
    }
    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    const idUsuario = await authModel.create(nombre, apellido, hashedPassword, email)

    const token = jwt.sign({ id: idUsuario }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.cookie('token', token, { httpOnly: true });
    successRes(res, {
      data: { id: idUsuario },
      message: 'Usuario creado exitosamente',
      statusCode: 201
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      errorRes(res, {
        message: 'El email ya está registrado',
        statusCode: 409
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

    if(user.estado === 'inactivo') return errorRes(res, {message: 'Usuario desactivado',statusCode: 400});

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.cookie('token', token, { httpOnly: true, secure: !process.env.DEV });
    successRes(res, {
      data: { user },
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
    await authModel.editPassword(id, hashedPassword)
    successRes(res, {
      message: 'Contraseña editada exitosamente',
      statusCode: 201
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
export const mailRecoverPassword = async (req, res) => {
  try{
    const {id} = req.params
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