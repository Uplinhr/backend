import { successRes, errorRes } from "../../utils/apiResponse.js";
import consultoriaModel from "./model.js";

export const getAll = async (req, res) => {
  try{
    const consultorias = await consultoriaModel.getAll()
    if(consultorias === null){
      return errorRes(res, {
        message: 'No se han encontrado listas de consultorias',
        statusCode: 404,
      })
    }
    successRes(res, {
      data: consultorias,
      message: 'Listas de consultorias obtenidos correctamente',
    });
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener listas de consultorias',
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
    const consultoria = await consultoriaModel.getOwn(id)
    if(consultoria === null){ // SI NO EXISTE consultoria
      return errorRes(res,{
        message: 'consultoria no encontrada',
        statusCode: 404
      })
    }
    successRes(res, {
      data: consultoria,
      message: 'consultoria obtenida correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener la consultoria',
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
    const consultoria = await consultoriaModel.getById(id)
    if(consultoria === null){ // SI NO EXISTE EL consultoria
      return errorRes(res,{
        message: 'consultoria no encontrada',
        statusCode: 404
      })
    }
    successRes(res, {
      data: consultoria,
      message: 'consultoria obtenida correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener la consultoria',
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
    
    const changed = await consultoriaModel.editById(id, req.body)
    if(!changed){
      return errorRes(res, {
        message: 'La consultoria no se cambió',
        statusCode: 500
      })
    }
    successRes(res, {
      message: 'consultoria editada exitosamente',
      statusCode: 201
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al editar consultoria',
      statusCode: 500,
      errors: error.message
    });
  }
}

export const create = async (req, res) => {
  try {
    const {horas_totales, horas_restantes, vencimiento, id_usuario} = req.body;
    if(!horas_totales || !horas_restantes || !vencimiento || !id_usuario) {
      return errorRes(res, {
        message: 'Se requieren todos los campos',
        statusCode: 404
      })
    }

    const idconsultoria = await consultoriaModel.create(horas_totales, horas_restantes, vencimiento, id_usuario)
    successRes(res, {
      data: { id: idconsultoria },
      message: 'consultoria creada exitosamente',
      statusCode: 201
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return errorRes(res, {
        message: 'El usuario ya tiene una consultoria asociada',
        statusCode: 409,
        errors: error.code
      })
    }
    errorRes(res, {
      message: 'Error al crear la consultoria',
      statusCode: 500,
      errors: error.message
    });
  }
};

export const deleteById = async (req, res) => {
  try{
    const {id} = req.params
    if(isNaN(id)) {
      return errorRes(res, {
        message: 'El id debe ser un numero',
        statusCode: 404
      })
    }
    
    const deleted = await consultoriaModel.deleteById(id)
    if(!deleted){
      return errorRes(res, {
        message: 'consultoria no encontrada',
        statusCode: 404
      });
    }
    successRes(res, {
      message: 'consultoria eliminada exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al eliminar consultoria',
      statusCode: 500,
      errors: error.message
    });
  }
}