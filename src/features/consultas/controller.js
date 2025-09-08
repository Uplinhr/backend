import { successRes, errorRes } from "../../utils/apiResponse.js";
import consultaModel from "./model.js";
import consultoriaModel from "../consultorias/model.js"

export const getAll = async (req, res) => {
  try{
    const consultas = await consultaModel.getAll()
    if(consultas === null){
      return errorRes(res, {
        message: 'No se han encontrado consultas',
        statusCode: 404,
      })
    }
    successRes(res, {
      data: consultas,
      message: 'consultas obtenidas correctamente',
    });
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener consultas',
      statusCode: 500,
      errors: error.message
    });
  }
};

export const getOwn = async (req, res) => {
  try{
    const {id} = req.user
    if(isNaN(id)) { // SI ID NO ES NUMERICO
      return errorRes(res, {
        message: 'El ID debe ser numerico',
        statusCode: 400
      })
    }
    const consulta = await consultaModel.getByUserId(id)
    if(consulta === null){ // SI NO EXISTE la consulta
      return errorRes(res,{
        message: 'consulta no encontrada',
        statusCode: 404
      })
    }
    successRes(res, {
      data: consulta,
      message: 'consulta obtenida correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener la consulta',
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
    const consulta = await consultaModel.getById(id)
    if(consulta === null){ // SI NO EXISTE la consulta
      return errorRes(res,{
        message: 'consulta no encontrada',
        statusCode: 404
      })
    }
    successRes(res, {
      data: consulta,
      message: 'consulta obtenida correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener la consulta',
      statusCode: 500,
      errors: error.message
    });
  }
}

export const editById = async (req, res) => {
  try{
    const {id} = req.params
    if(isNaN(id)) {
        return errorRes(res, {
            message: 'El id debe ser un numero',
            statusCode: 404
        })
    }
    const changed = await consultaModel.editById(id, req.body)
    if(!changed){
      return errorRes(res, {
        message: 'La consulta no se cambió',
        statusCode: 500
      })
    }
    successRes(res, {
      message: 'consulta editada exitosamente',
      statusCode: 201
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al editar la consulta',
      statusCode: 500,
      errors: error.message
    });
  }
}


/**
 * Crea una solicitud de consultoría
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.body.cantidad_horas - Información de la búsqueda provista por el usuario
 * @param {string} req.body.comentarios - Creditos que consume de la tabla de creditos del usuario
 * @param {string} req.body.observaciones - Obseraciones de la búsqueda provista por un administrador 
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} Retorna una respuesta HTML junto con el id del registro
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Crea una solicitud de consulta y resta de la cantidad de horas del usuario
 * 
 * 1. **Validaciones iniciales**:
 *    - Campos obligatorios presentes (cantidad_horas, comentarios, id_consultori
 *    - La tabla de consultoría de usuario debe existir en la base de datos
 * 
 * 2. **Gestión de consultoria**:
 *    - Horas suficientes disponibles en la consultoría
 *    - Permisos de usuario: solo el dueño o un admin pueden usar la tabla de consultoría
 * 
 * 3. **Creación y actualización**:
 *    - Crea el registro de consulta
 *    - Resta las horas utilizadas de la consultoría (implementado en el modelo)
 *    - Retorna el ID de la consulta creada
 * 
 * @security
 * - Solo el propietario de la consultoría o un administrador pueden crear consultas
 * - Validación de horas previene uso excesivo de horas disponibles
 */
export const create = async (req, res) => {
  try {
    const {cantidad_horas, comentarios, id_consultoria} = req.body;
    if(!cantidad_horas || !comentarios || !id_consultoria) {
      return errorRes(res, {
        message: 'Se requieren todos los campos',
        statusCode: 404
      })
    }

    const consultoria = await consultoriaModel.getById(id_consultoria)
    if(consultoria === null){
      return errorRes(res,{
        message: 'consultoria no encontrada',
        statusCode: 404
      })
    }
    if(Number(consultoria.horas_restantes) - Number(cantidad_horas) < 0){
      return errorRes(res,{
        message: 'No hay suficientes horas restantes',
        statusCode: 404
      })
    }
    if(consultoria.id_usuario !== req.user.id && req.user.rol !== 'admin'){
      return errorRes(res,{
        message: 'La tabla de consultas seleccionada no pertenece al usuario',
        statusCode: 404
      })
    }
    const idConsulta = await consultaModel.create(cantidad_horas, comentarios, consultoria)
    if(idConsulta == false){
      return errorRes(res,{
        message: 'Error en la resta de horas de consultoria',
        statusCode: 404
      })
    }
    successRes(res, {
      data: { id: idConsulta },
      message: 'consulta creada exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al crear la consulta',
      statusCode: 500,
      errors: error.message
    });
  }
};


/**
 * Elimina una solicitud de consultoría (Borrado lógico)
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.params.id - ID numérico de la solicitud de búsqueda
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} Retorna una respuesta HTML
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Elimina una consulta y devuelve las horas de consultoría a la tabla del usuario
 * - ID debe ser numérico
 * - Debe existir la consulta y no estar eliminada con anterioridad
 */
export const deleteById = async (req, res) => {
  try{
    const {id} = req.params
    if(isNaN(id)) {
      return errorRes(res, {
        message: 'El id debe ser un numero',
        statusCode: 404
      })
    }
    
    const consulta = await consultaModel.getById(id)
    if(consulta === null){
      return errorRes(res,{
        message: 'consulta no encontrada',
        statusCode: 404
      })
    }
    if(consulta.estado == "Eliminado"){
      return errorRes(res,{
        message: 'La consulta ya se encuentra eliminada',
        statusCode: 400
      })
    }
    const deleted = await consultaModel.deleteById(consulta.consultorias, consulta)
    if(!deleted){
      return errorRes(res, {
        message: 'consulta no encontrada',
        statusCode: 404
      });
    }
    successRes(res, {
      message: 'consulta eliminada exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al eliminar consulta',
      statusCode: 500,
      errors: error.message
    });
  }
}