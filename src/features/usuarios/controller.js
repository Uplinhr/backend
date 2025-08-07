import { successRes, errorRes } from "../../utils/apiResponse.js";
import UsuarioModel from "./model.js";

export const getUsuarios = async (req, res) => {
    try{
        const usuarios = await UsuarioModel.getAll()
        if(usuarios === null){
            errorRes(res, {
                message: 'No se han encontrado usuarios',
                statusCode: 404,
            })
        }
        successRes(res, { 
          data: usuarios,
          message: 'Usuarios obtenidos correctamente',
        });
    } catch (error){
        errorRes(res, {
      message: 'Error al obtener usuarios',
      statusCode: 500,
      errors: error.message
    });
    }
};

export const getUsuarioById = async (req, res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) { // SI ID NO ES NUMERICO
            return errorRes(res, {
                message: 'El ID debe ser numerico',
                statusCode: 400
            })
            }
        const usuario = await UsuarioModel.getById(id)
        if(usuario === null){ // SI NO EXISTE EL USUARIO
            return errorRes(res,{
                message: 'Usuario no encontrado',
                statusCode: 404
            })
        }
        successRes(res, {
            data: usuario,
            message: 'Usuario obtenido correctamente'
        })
    } catch (error){
        errorRes(res, {
          message: 'Error al obtener el usuario',
          statusCode: 500,
          errors: error.message
        });
    }
}

export const createUsuario = async (req, res) => {
    try{
        const {nombre, apellido, contrasenia, email, estado} = req.body

        if(!nombre || !apellido || !contrasenia || !email || !estado) {
            return errorRes(res, {
                message: 'Se requieren todos los campos',
                statusCode: 404
            })
        }

        const idUsuario = await UsuarioModel.create(nombre, apellido, contrasenia, email, estado)
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
        } else {
            errorRes(res, {
                message: 'Error al crear usuario',
                statusCode: 500,
                errors: error.message
            });
        }
    }
}

export const deleteUsuarioById = async (req, res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) {
            return errorRes(res, {
                message: 'El id debe ser un numero',
                statusCode: 404
            })
        }

        const deleted = await UsuarioModel.deleteById(id)
        if(!deleted){
            return errorRes(res, {
              message: 'Usuario no encontrado',
              statusCode: 404
            });
        }
        successRes(res, {
            message: 'Usuario eliminado exitosamente',
            statusCode: 201
        })
    } catch (error) {
        errorRes(res, {
          message: 'Error al eliminar usuario',
          statusCode: 500,
          errors: error.message
        });
    }
}