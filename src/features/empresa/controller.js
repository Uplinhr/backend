import { successRes, errorRes } from "../../utils/apiResponse.js";
import empresaModel from "./model.js";

export const getAll = async (req, res) => {
  try{
    const empresas = await empresaModel.getAll()
    if(empresas === null){
      return errorRes(res, {
        message: 'No se han encontrado empresas',
        statusCode: 404,
      })
    }
    successRes(res, {
      data: empresas,
      message: 'empresas obtenidos correctamente',
    });
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener empresas',
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
    const empresa = await empresaModel.getById(id)
    if(empresa === null){ // SI NO EXISTE empresa
      return errorRes(res,{
        message: 'Empresa no encontrada',
        statusCode: 404
      })
    }
    successRes(res, {
      data: empresa,
      message: 'Empresa obtenida correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener la empresa',
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
    const empresa = await empresaModel.getById(id)
    if(empresa === null){ // SI NO EXISTE EL empresa
      return errorRes(res,{
        message: 'Empresa no encontrada',
        statusCode: 404
      })
    }
    successRes(res, {
      data: empresa,
      message: 'Empresa obtenida correctamente'
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al obtener la empresa',
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
  
    const changed = await empresaModel.editById(id, req.body)
    if(!changed){
      return errorRes(res, {
        message: 'La empresa no se cambió',
        statusCode: 500
      })
    }
    successRes(res, {
      message: 'empresa editada exitosamente',
      statusCode: 201
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al editar empresa',
      statusCode: 500,
      errors: error.message
    });
  }
}

export const editOwn = async (req, res) => {
  try{
    const {id} = req.user
    if(isNaN(id)) {
        return errorRes(res, {
            message: 'El id debe ser un numero',
            statusCode: 404
        })
    }
    const empresa = {
      id_usuario: id,
      ...req.body
    }
    
    const changed = await empresaModel.editOwn(empresa)
    if(!changed){
      return errorRes(res, {
        message: 'La empresa no se cambió',
        statusCode: 500
      })
    }
    successRes(res, {
      message: 'empresa editada exitosamente',
      statusCode: 201
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al editar empresa propia',
      statusCode: 500,
      errors: error.message
    });
  }
}

export const create = async (req, res) => {
  try {
    const {nombre, email, id_usuario, ...camposOpcionales} = req.body;
    if(!nombre || !email || !id_usuario) { //si id_usuario es null, da error
      return errorRes(res, {
        message: 'Se requieren todos los campos',
        statusCode: 404
      })
    }
    const empresa = {
      nombre,
      email,
      id_usuario: parseInt(id_usuario),
      ...camposOpcionales
    }

    const idEmpresa = await empresaModel.create(empresa)

    if(!idEmpresa){
      return errorRes(res, {
        message: 'Error al crear la empresa',
        statusCode: 500
      });
    }
    successRes(res, {
      data: { id: idEmpresa },
      message: 'empresa creada exitosamente',
      statusCode: 201
    })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return errorRes(res, {
        message: 'El usuario ya tiene una empresa asociada',
        statusCode: 409,
        errors: error.code
      })
    }
    errorRes(res, {
      message: 'Error al crear la empresa',
      statusCode: 500,
      errors: error.message
    });
  }
};

export const enableById = async (req,res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) {
            return errorRes(res, {
                message: 'El id debe ser un numero',
                statusCode: 404
            })
        }

        const enabled = await empresaModel.enableById(id)
        if(!enabled){
            return errorRes(res, {
              message: 'empresa no encontrado',
              statusCode: 404
            });
        }
        successRes(res, {
            message: 'empresa habilitado exitosamente',
            statusCode: 201,
            data: enabled
        })
    } catch(error){
        errorRes(res, {
          message: 'Error al habilitar empresa',
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
    
    const deleted = await empresaModel.deleteById(id)
    if(!deleted){
      return errorRes(res, {
        message: 'empresa no encontrada',
        statusCode: 404
      });
    }
    successRes(res, {
      message: 'empresa eliminada exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al eliminar empresa',
      statusCode: 500,
      errors: error.message
    });
  }
}

/**
 * Desvincula al usuario dentro de la empresa
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.params.id - ID numérico de la empresa
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} Retorna una respuesta HTML
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Setea en null el id_usuario dentro del registro de la empresa
 * - ID debe ser numérico
 */
export const unlinkUser = async (req, res) => {
  try{
    const {id} = req.params
    if(isNaN(id)) {
      return errorRes(res, {
        message: 'El id debe ser un numero',
        statusCode: 404
      })
    }

    const unlinked = await empresaModel.unlinkUserById(id)
    if(!unlinked){
      return errorRes(res, {
        message: 'empresa no encontrada',
        statusCode: 404
      });
    }
    successRes(res, {
      message: 'Usuario de empresa desvinculada exitosamente',
      statusCode: 201
    })
  } catch (error){
    errorRes(res, {
      message: 'Error al desvincular usuario de empresa',
      statusCode: 500,
      errors: error.message
    });
  }
}