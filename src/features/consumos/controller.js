import { successRes, errorRes } from "../../utils/apiResponse.js";
import consumoModel from "./model.js";

export const getAll = async (req, res) => {
  try{
    const consumos = await consumoModel.getAll()
    if(consumos === null){
      return errorRes(res, {
        message: 'No se han encontrado consumos',
        statusCode: 404,
      })
    }
    successRes(res, {
      data: consumos,
      message: 'consumos obtenidos correctamente',
    });
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener consumos',
      statusCode: 500,
      errors: error.message
    });
  }
};

export const getOwn = async (req, res) => { //No puede ser con getById, se debe crear una nueva funcion
  try{
    const {id} = req.user
    if(isNaN(id)) { // SI ID NO ES NUMERICO
      return errorRes(res, {
        message: 'El ID debe ser numerico',
        statusCode: 400
      })
    }
    const credito = await consumoModel.getById(id)
    if(credito === null){ // SI NO EXISTE EL credito
      return errorRes(res,{
        message: 'consumo no encontrado',
        statusCode: 404
      })
    }
    successRes(res, {
      data: credito,
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
    const consumo = await consumoModel.getById(id)
    if(consumo === null){ // SI NO EXISTE EL consumo
      return errorRes(res,{
        message: 'consumo no encontrado',
        statusCode: 404
      })
    }
    successRes(res, {
      data: consumo,
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

export const editById = async (req, res) => {
  try{
    const {id} = req.params
    if(isNaN(id)) {
        return errorRes(res, {
            message: 'El id debe ser un numero',
            statusCode: 404
        })
    }
    const changed = await consumoModel.editById(id, req.body)
    if(!changed){
      return errorRes(res, {
        message: 'El consumo no se cambió',
        statusCode: 500
      })
    }
    successRes(res, {
      message: 'consumo editado exitosamente',
      statusCode: 201
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al editar el consumo',
      statusCode: 500,
      errors: error.message
    });
  }
}

export const create = async (req, res) => {
  try {
    const {tipo_busqueda, creditos_usados, observaciones, id_cred} = req.body;
    if(!tipo_busqueda || !creditos_usados || !observaciones || !id_cred) {
      return errorRes(res, {
        message: 'Se requieren todos los campos',
        statusCode: 404
      })
    }

    const idCredito = await consumoModel.create(tipo_busqueda, creditos_usados, observaciones, id_cred)
    successRes(res, {
      data: { id: idCredito },
      message: 'consumo creado exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al crear el consumo',
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
    
    const deleted = await consumoModel.deleteById(id)
    if(!deleted){
      return errorRes(res, {
        message: 'consumo no encontrado',
        statusCode: 404
      });
    }
    successRes(res, {
      message: 'consumo eliminado exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al eliminar consumo',
      statusCode: 500,
      errors: error.message
    });
  }
}