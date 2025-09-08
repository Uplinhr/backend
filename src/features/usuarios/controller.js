import { successRes, errorRes } from "../../utils/apiResponse.js";
import usuarioModel from "./model.js";
import planModel from "../planes/model.js";

export const getAll = async (req, res) => {
    try{
        const usuarios = await usuarioModel.getAll()
        if(usuarios === null){
            return errorRes(res, {
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

export const getOwn = async (req, res) => {
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

export const getById = async (req, res) => {
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

export const editOwn =  async (req, res) => {
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
        const changed = await usuarioModel.editOwn(id, req.body)
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

/**
 * Edita un usuario por ID y gestiona el cambio de plan si es necesario
 * @async
 * @function editById
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.params.id - ID del usuario a editar (debe ser numérico)
 * @param {number} [req.body.id_plan] - ID del nuevo plan a asignar (opcional)
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} Retorna una respuesta HTTP
 * @throws {Error} Si ocurre un error inesperado en el procesamiento
 * @description
 * Edita la información de un usuario existente con funcionalidad especial para cambio de plan:
 * 
 * 1. **Validaciones iniciales**:
 *    - ID debe ser numérico
 *    - El usuario debe existir en la base de datos
 * 
 * 2. **Edición básica del usuario**:
 *    - Actualiza los campos proporcionados en req.body
 *    - Maneja errores de duplicado de email (ER_DUP_ENTRY)
 * 
 * 3. **Gestión de cambio de plan** (si se proporciona id_plan y es diferente al actual):
 *    - Valida que el nuevo plan exista
 *    - Ejecuta el proceso de asignación de plan
 *    - Retorna la respuesta del proceso de asignación
 * 
 * 4. **Respuesta final**:
 *    - Retorna éxito con los datos actualizados
 */
export const editById = async (req, res) => {
    try{
        const {id} = req.params
        const usuario = await usuarioModel.getById(id)
        if(isNaN(id)) {
            return errorRes(res, {
                message: 'El id debe ser un numero',
                statusCode: 404
            })
        }

        const changed = await usuarioModel.editById(id, req.body)
        if(!changed){
            return errorRes(res, {
                message: 'No se editó el usuario',
                statusCode: 500
            })
        }
        if(req.body.id_plan !== usuario.plan.id && req.body.id_plan !== undefined){ //En caso de necesitar un cambio de plan
            const plan = await planModel.getById(req.body.id_plan)
            if(!plan) {
              return errorRes(res, {
                message: 'No se encontró el plan',
                statusCode: 404
              })
            }
            const asigned = await planModel.asignPlan(plan, usuario.id)
            if(!asigned.success){
              return errorRes(res, {
                message: 'Ocurrió un error en la creación de las tablas de creditos y consultorias',
                statusCode: 500
              })
            }
            return successRes(res, asigned)
        }
        successRes(res, {
            message: 'usuario editado exitosamente',
            statusCode: 201,
            data: changed
        })
    } catch(error){
        if (error.code === 'ER_DUP_ENTRY') {
            return errorRes(res, {
                message: 'El email ya está en uso por otro usuario',
                statusCode: 409,
                errors: error.code
            })
        }
        errorRes(res, {
          message: 'Error al editar usuario',
          statusCode: 500,
          errors: error.message
        });
    }
}

export const enableById = async (req,res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) {
            return errorRes(res, {
                message: 'El id debe ser un numero',
                statusCode: 404
            })
        }

        const enabled = await usuarioModel.enableById(id)
        if(!enabled){
            return errorRes(res, {
              message: 'Usuario no encontrado',
              statusCode: 404
            });
        }
        successRes(res, {
            message: 'Usuario habilitado exitosamente',
            statusCode: 201,
            data: enabled
        })
    } catch(error){
        errorRes(res, {
          message: 'Error al habilitar usuario',
          statusCode: 500,
          errors: error.message
        });
    }
}

export const deleteById = async (req, res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) {
            return errorRes(res, {
                message: 'El id debe ser un numero',
                statusCode: 404
            })
        }

        const deleted = await usuarioModel.deleteById(id)
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