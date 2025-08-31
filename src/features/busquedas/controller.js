import { successRes, errorRes } from "../../utils/apiResponse.js";
import busquedaModel from "./model.js";
import creditoModel from '../creditos/model.js'

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

export const getOwn = async (req, res) => {
  try{
    const {id} = req.user
    if(isNaN(id)) { // SI ID NO ES NUMERICO
      return errorRes(res, {
        message: 'El ID debe ser numerico',
        statusCode: 400
      })
    }
    const busquedas = await busquedaModel.getByUserId(id)
    if(busquedas === null){ // SI NO EXISTE EL busqueda
      return errorRes(res,{
        message: 'busqueda no encontrado',
        statusCode: 404
      })
    }
    successRes(res, {
      data: busquedas,
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
  const {rol, id} = req.user
  try {
    const {info_busqueda} = req.body;
    let id_cred;
    if(!info_busqueda) {
      return errorRes(res, {
        message: 'Se requiere la informacion de la busqueda',
        statusCode: 404
      })
    }

    if(rol == 'admin'){
      id_cred = req.body.id_cred
    } else{
      const creditos = await creditoModel.getOwn(id)
      if(creditos === null){
        return errorRes(res,{
          message: 'No tienes una lista de creditos asignada',
          statusCode: 404
        })
      }
      const prioridades = ['devuelto', 'adicional', 'plan'];
      for (const prioridad of prioridades) {
        const creditoEncontrado = creditos.find(credito => credito.tipo_credito === prioridad);
        if (creditoEncontrado) {
            id_cred = creditoEncontrado.id;
            break;
        }
      }
    }
    const idBusqueda = await busquedaModel.create(info_busqueda, id_cred)
    successRes(res, {
      data: { id: idBusqueda },
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