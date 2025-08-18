import { successRes, errorRes } from "../../utils/apiResponse.js";
import planModel from "./model.js";

export const getAll = async (req, res) => {
  try{
    const planes = await planModel.getAll()
    if(planes === null){
      return errorRes(res, {
        message: 'No se han encontrado planes',
        statusCode: 404,
      })
    }
    successRes(res, {
      data: planes,
      message: 'planes obtenidos correctamente',
    });
  } catch (error){
  errorRes(res, {
    message: 'Error al obtener planes',
    statusCode: 500,
    errors: error.message
  });
  }
};

export const getById = async (req, res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) { // SI ID NO ES NUMERICO
            return errorRes(res, {
                message: 'El ID debe ser numerico',
                statusCode: 400
            })
            }
        const plan = await planModel.getById(id)
        if(plan === null){ // SI NO EXISTE EL PLAN
            return errorRes(res,{
                message: 'Plan no encontrado',
                statusCode: 404
            })
        }
        successRes(res, {
            data: plan,
            message: 'plan obtenido correctamente'
        })
    } catch (error){
        errorRes(res, {
          message: 'Error al obtener el plan',
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

        const changed = await planModel.editById(id, req.body)
        if(!changed){
          return errorRes(res, {
            message: 'El plan no se cambió',
            statusCode: 500
          })
        }
        successRes(res, {
            message: 'Plan editado exitosamente',
            statusCode: 201
        })
    } catch(error){
        errorRes(res, {
          message: 'Error al editar plan',
          statusCode: 500,
          errors: error.message
        });
    }
}

export const create = async (req, res) => {
  try {
    const {nombre, creditos_mes, meses_cred, horas_cons, precio, estado} = req.body;
    if(!nombre || !creditos_mes || !meses_cred || !horas_cons || !precio || !estado) {
      return errorRes(res, {
        message: 'Se requieren todos los campos',
        statusCode: 404
      })
    }

    const idPlan = await planModel.create(nombre, creditos_mes, meses_cred, horas_cons, precio, estado)

    successRes(res, {
      data: { id: idPlan },
      message: 'Plan creado exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al crear el plan',
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

        const deleted = await planModel.deleteById(id)
        if(!deleted){
            return errorRes(res, {
              message: 'Plan no encontrado',
              statusCode: 404
            });
        }
        successRes(res, {
            message: 'Plan eliminado exitosamente',
            statusCode: 201
        })
    } catch (error) {
        errorRes(res, {
          message: 'Error al eliminar plan',
          statusCode: 500,
          errors: error.message
        });
    }
}