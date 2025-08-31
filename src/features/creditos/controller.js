import { successRes, errorRes } from "../../utils/apiResponse.js";
import creditoModel from "./model.js";

export const getAll = async (req, res) => {
  try{
    const creditos = await creditoModel.getAll()
    if(creditos === null){
      return errorRes(res, {
        message: 'No se han encontrado listas de creditos',
        statusCode: 404,
      })
    }
    successRes(res, {
      data: creditos,
      message: 'Listas de creditos obtenidos correctamente',
    });
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener listas de creditos',
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
    const credito = await creditoModel.getOwn(id)
    if(credito === null){ // SI NO EXISTE EL credito
      return errorRes(res,{
        message: 'Lista de creditos no encontrado',
        statusCode: 404
      })
    }
    successRes(res, {
      data: credito,
      message: 'Lista de creditos obtenido correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener la lista de creditos',
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
    const credito = await creditoModel.getById(id)
    if(credito === null){ // SI NO EXISTE EL credito
      return errorRes(res,{
        message: 'Lista de creditos no encontrado',
        statusCode: 404
      })
    }
    successRes(res, {
      data: credito,
      message: 'Lista de creditos obtenido correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener la lista de creditos',
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
    
    const changed = await creditoModel.editById(id, req.body)
    if(!changed){
      return errorRes(res, {
        message: 'La lista de creditos no se cambió',
        statusCode: 500
      })
    }
    successRes(res, {
      message: 'Lista de creditos editada exitosamente',
      statusCode: 201
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al editar lista de creditos',
      statusCode: 500,
      errors: error.message
    });
  }
}

export const create = async (req, res) => {
  try {
    const {tipo_credito, cantidad, vencimiento, id_usuario} = req.body;
    if(!tipo_credito || !cantidad || !vencimiento || !id_usuario) {
      return errorRes(res, {
        message: 'Se requieren todos los campos',
        statusCode: 404
      })
    }

    const idCredito = await creditoModel.create(tipo_credito, cantidad, vencimiento, id_usuario)
    successRes(res, {
      data: { id: idCredito },
      message: 'Lista de creditos creada exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al crear la lista de creditos',
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
    
    const deleted = await creditoModel.deleteById(id)
    if(!deleted){
      return errorRes(res, {
        message: 'Lista de creditos no encontrada',
        statusCode: 404
      });
    }
    successRes(res, {
      message: 'Lista de creditos eliminada exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al eliminar lista de creditos',
      statusCode: 500,
      errors: error.message
    });
  }
}