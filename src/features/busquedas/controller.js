import { successRes, errorRes } from "../../utils/apiResponse.js";
import busquedaModel from "./model.js";

export const getAll = async (req, res) => {
  try{
    const busquedas = await busquedaModel.getAll()
    if(busquedas === null){
      return errorRes(res, {
        message: 'No se han encontrado busquedas',
        statusCode: 404,
      })
    }
    successRes(res, {
      data: busquedas,
      message: 'busquedas obtenidos correctamente',
    });
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener busquedas',
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
    const busqueda = await busquedaModel.getByUserId(id)
    if(busqueda === null){ // SI NO EXISTE EL busqueda
      return errorRes(res,{
        message: 'busqueda no encontrado',
        statusCode: 404
      })
    }
    successRes(res, {
      data: busqueda,
      message: 'busqueda obtenido correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener la busqueda',
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
    const busqueda = await busquedaModel.getById(id)
    if(busqueda === null){ // SI NO EXISTE EL busqueda
      return errorRes(res,{
        message: 'busqueda no encontrado',
        statusCode: 404
      })
    }
    successRes(res, {
      data: busqueda,
      message: 'busqueda obtenido correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener el busqueda',
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
    const changed = await busquedaModel.editById(id, req.body)
    if(!changed){
      return errorRes(res, {
        message: 'El busqueda no se cambió',
        statusCode: 500
      })
    }
    successRes(res, {
      message: 'busqueda editado exitosamente',
      statusCode: 201
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al editar el busqueda',
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

    const idCredito = await busquedaModel.create(tipo_busqueda, creditos_usados, observaciones, id_cred)
    successRes(res, {
      data: { id: idCredito },
      message: 'busqueda creado exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al crear el busqueda',
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
    
    const deleted = await busquedaModel.deleteById(id)
    if(!deleted){
      return errorRes(res, {
        message: 'busqueda no encontrado',
        statusCode: 404
      });
    }
    successRes(res, {
      message: 'busqueda eliminado exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al eliminar busqueda',
      statusCode: 500,
      errors: error.message
    });
  }
}