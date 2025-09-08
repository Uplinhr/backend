import { successRes, errorRes } from "../../utils/apiResponse.js";
import compra_creditosModel from "./model.js";

export const getAll = async (req, res) => {
  try{
    const compra_creditos = await compra_creditosModel.getAll()
    if(compra_creditos === null){
      return errorRes(res, {
        message: 'No se han encontrado compras de creditos',
        statusCode: 404,
      })
    }
    successRes(res, {
      data: compra_creditos,
      message: 'compras de creditos obtenidos correctamente',
    });
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener compras de creditos',
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
    const compra_credito = await compra_creditosModel.getById(id)
    if(compra_credito === null){ // SI NO EXISTE EL compra_credito
      return errorRes(res,{
        message: 'consumo no encontrado',
        statusCode: 404
      })
    }
    successRes(res, {
      data: compra_credito,
      message: 'consumo obtenido correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener la consumo',
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
    const compra_credito = await compra_creditosModel.getById(id)
    if(compra_credito === null){ // SI NO EXISTE EL compra_credito
      return errorRes(res,{
        message: 'compra de credito no encontrado',
        statusCode: 404
      })
    }
    successRes(res, {
      data: compra_credito,
      message: 'compra de credito obtenido correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener la compra de credito',
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
    const changed = await compra_creditosModel.editById(id, req.body)
    if(!changed){
      return errorRes(res, {
        message: 'La compra de credito no se cambió',
        statusCode: 500
      })
    }
    successRes(res, {
      message: 'compra de credito editado exitosamente',
      statusCode: 201
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al editar la compra de credito',
      statusCode: 500,
      errors: error.message
    });
  }
}

export const create = async (req, res) => {
  try {
    const {medio_pago, costo, observaciones, cantidad, id_usuario} = req.body;
    if(!medio_pago || !costo || !observaciones || !cantidad || !id_usuario) {
      return errorRes(res, {
        message: 'Se requieren todos los campos',
        statusCode: 404
      })
    }

    const idCompra_credito = await compra_creditosModel.create(medio_pago, costo, observaciones, cantidad, id_usuario)
    successRes(res, {
      data: { id: idCompra_credito },
      message: 'compra de credito creada exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al crear la compra de credito',
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
    
    const deleted = await compra_creditosModel.deleteById(id)
    if(!deleted){
      return errorRes(res, {
        message: 'compra de credito no encontrado',
        statusCode: 404
      });
    }
    successRes(res, {
      message: 'compra de credito eliminada exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al eliminar compra de credito',
      statusCode: 500,
      errors: error.message
    });
  }
}