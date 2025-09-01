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
    const {nombre, creditos_mes, meses_cred, horas_cons, precio, custom} = req.body;
    if(!nombre || !creditos_mes || !meses_cred || !horas_cons || !precio) {
      return errorRes(res, {
        message: 'Se requieren todos los campos',
        statusCode: 404
      })
    }

    const idPlan = await planModel.create(nombre, creditos_mes, meses_cred, horas_cons, precio, custom)

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

export const enableById = async (req,res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) {
            return errorRes(res, {
                message: 'El id debe ser un numero',
                statusCode: 404
            })
        }

        const enabled = await planModel.enableById(id)
        if(!enabled){
            return errorRes(res, {
              message: 'plan no encontrado',
              statusCode: 404
            });
        }
        successRes(res, {
            message: 'plan habilitado exitosamente',
            statusCode: 201,
            data: enabled
        })
    } catch(error){
        errorRes(res, {
          message: 'Error al habilitar plan',
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

export const buyPlan = async (req, res) => {// ESTA FUNCION NO SIRVE, PERO SE PODRIA USAR EN EL FUTURO
  try{
    const {id_plan, id_usuario} = req.body
    if(isNaN(id_plan) || isNaN(id_usuario)){
      return errorRes(res, {
          message: 'Los id deben ser un numeros',
          statusCode: 404
      })
    }
    const plan = await planModel.getById(id_plan)
    if(!plan) {
      return errorRes(res, {
        message: 'No se encontró el plan',
        statusCode: 404
      })
    }
    const buy = await planModel.asignPlan(plan, id_usuario)
    if(buy === false){
      return errorRes(res, {
        message: 'No existe un usuario con esa ID',
        statusCode: 404
      })
    }
    console.log(buy)
    if(!buy.success){
      return errorRes(res, {
        message: 'Ocurrió un error en la creación de las tablas de creditos y consultorias',
        statusCode: 500
      })
    }
    successRes(res, {
        message: 'Compra de plan exitosa',
        statusCode: 201
    })
  } catch(error){
    errorRes(res,{
      message: 'ocurrio un error en la compra de plan',
      statusCode: 500
    })
  }
}