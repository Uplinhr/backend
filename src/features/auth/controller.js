import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AuthModel from './model.js';
import { successRes, errorRes } from "../../utils/apiResponse.js";

export const register = async (req, res) => {
  try {
    const {nombre, apellido, contrasenia, email} = req.body;
    if(!nombre || !apellido || !contrasenia || !email || !estado) {
        return errorRes(res, {
            message: 'Se requieren todos los campos',
            statusCode: 404
        })
    }
    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    const idUsuario = await AuthModel.create(nombre, apellido, hashedPassword, email)

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
    const user = await AuthModel.login(req.body.email)

    if (!user) return errorRes(res, {message: 'Usuario no encontrado',statusCode: 404});

    const isMatch = await bcrypt.compare(req.body.contrasenia, user.contrasenia);
    if (!isMatch) return errorRes(res, {message: 'Contraseña incorrecta',statusCode: 400});

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.cookie('token', token, { httpOnly: true, secure: !process.env.DEV });
    successRes(res, {
        data: { id: user.id, nombre: user.nombre, rol: user.rol },
        message: 'Sesión iniciada',
        statusCode: 201
    })
  } catch (error) {
    errorRes(res, {message: error.message, statusCode: 500});
  }
};

export const logout = (req, res) => {
    res.clearCookie('token');
    successRes(res, {
        message: 'Sesión cerrada',
        statusCode: 201
    })
};