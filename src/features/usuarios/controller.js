import { successRes, errorRes } from "../../utils/apiResponse.js";
import usuarioModel from "./model.js";

export const getUsuarios = async (req, res) => {
    try{
        const usuarios = await usuarioModel.getAll()
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

export const getOwnUsuario = async (req, res) => {
    try{
        const {id} = req.user
        const usuario = await usuarioModel.getById(id)
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
    }catch (error){
        errorRes(res, {
          message: 'Error al obtener el usuario',
          statusCode: 500,
          errors: error.message
        });
    }
}

export const getUsuarioById = async (req, res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) { // SI ID NO ES NUMERICO
            return errorRes(res, {
                message: 'El ID debe ser numerico',
                statusCode: 400
            })
            }
        const usuario = await usuarioModel.getById(id)
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

export const editFullName =  async (req, res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) {
            return errorRes(res, {
                message: 'El id debe ser un numero',
                statusCode: 404
            })
        }

        if(Number(id) !== Number(req.user.id)){
            return errorRes(res, {
                message: 'Solo puedes editar tu propio usuario',
                statusCode: 404
            })
        }
        const changed = await usuarioModel.editFullName(id, req.body.nombre, req.body.apellido)
        if(!changed){
            return errorRes(res, {
                message: "No se editó el nombre",
                statusCode: 500
            })
        }
        successRes(res, {
            message: 'nombre completo editado exitosamente',
            statusCode: 201,
            data: changed
        })
    } catch(error){
        errorRes(res, {
            message: 'Error al editar el nombre completo',
            statusCode: 500,
            errors: error.message
        });
    }
}

export const editUsuarioById = async (req, res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) {
            return errorRes(res, {
                message: 'El id debe ser un numero',
                statusCode: 404
            })
        }

        const changed = await usuarioModel.editUsuarioById(id, req.body)
        if(!changed){
            return errorRes(res, {
                message: 'No se editó el usuario',
                statusCode: 500
            })
        }
        successRes(res, {
            message: 'usuario editado exitosamente',
            statusCode: 201,
            data: changed
        })
    } catch(error){
        errorRes(res, {
          message: 'Error al editar usuario',
          statusCode: 500,
          errors: error.message
        });
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

        const deleted = await usuarioModel.deleteUsuarioById(id)
        if(!deleted){
            return errorRes(res, {
              message: 'Usuario no encontrado',
              statusCode: 404
            });
        }
        successRes(res, {
            message: 'Usuario eliminado exitosamente',
            statusCode: 201,
            data: deleted
        })
    } catch (error) {
        errorRes(res, {
          message: 'Error al eliminar usuario',
          statusCode: 500,
          errors: error.message
        });
    }
}