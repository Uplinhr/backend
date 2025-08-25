import { successRes, errorRes } from "../../utils/apiResponse.js";
import compra_planModel from "./model.js";

export const getCompra_Planes = async (req, res) => {
    try{
        const compra_planes = await compra_planModel.getAll()
        if(compra_planes === null){
            errorRes(res, {
                message: 'No se han encontrado compras de planes',
                statusCode: 404,
            })
        }
        successRes(res, {
          data: compra_planes,
          message: 'Compra de los planes obtenidos correctamente',
        });
    } catch (error){
    errorRes(res, {
      message: 'Error al obtener compras de planes',
      statusCode: 500,
      errors: error.message
    });
    }
};

export const getCompra_PlanById = async (req, res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) { // SI ID NO ES NUMERICO
            return errorRes(res, {
                message: 'El ID debe ser numerico',
                statusCode: 400
            })
            }
        const compra_plan = await compra_planModel.getCompra_PlanById(id)
        if(compra_plan === null){ // SI NO EXISTE EL COMPRA_PLAN
            return errorRes(res,{
                message: 'Compra de plan no encontrado',
                statusCode: 404
            })
        }
        successRes(res, {
            data: compra_plan,
            message: 'Compra de plan obtenido correctamente'
        })
    } catch (error){
        errorRes(res, {
          message: 'Error al obtener la compra de plan',
          statusCode: 500,
          errors: error.message
        });
    }
}

export const editCompra_PlanById = async (req, res) => {
  try{
    const {id} = req.params
    if(isNaN(id)) {
      return errorRes(res, {
        message: 'El id debe ser un numero',
        statusCode: 404
      })
    }
    const changed = await compra_planModel.editCompra_PlanById(id, req.body)
    if(!changed){
      return errorRes(res, {
        message: 'No se editó la compra de plan',
        statusCode: 500
      })  
    } 
    successRes(res, {
      message: 'Compra de plan editado exitosamente',
      statusCode: 201
    })
  } catch(error){
    errorRes(res, {
      message: 'Error al editar la compra de plan',
      statusCode: 500,
      errors: error.message
    });
  }
}

export const createCompra_Plan = async (req, res) => {
  try {
    const {medio_pago, observaciones, precio_abonado, id_plan, id_usuario} = req.body;
    if(!medio_pago || !observaciones || !precio_abonado || !id_plan || !id_usuario) {
      return errorRes(res, {
        message: 'Se requieren todos los campos',
        statusCode: 404
      })
    }

    const idCompra_Plan = await compra_planModel.create(medio_pago, observaciones, precio_abonado, id_plan, id_usuario)

    successRes(res, {
      data: { id: idCompra_Plan },
      message: 'Compra de plan creado exitosamente',
      statusCode: 201
    })
  } catch (error) {
    errorRes(res, {
      message: 'Error al crear la compra de plan',
      statusCode: 500,
      errors: error.message
    });
  }
};

export const deleteCompra_PlanById = async (req, res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) {
            return errorRes(res, {
                message: 'El id debe ser un numero',
                statusCode: 404
            })
        }

        const deleted = await compra_planModel.deleteCompra_PlanById(id)
        if(!deleted){
            return errorRes(res, {
              message: 'Compra de plan no encontrado',
              statusCode: 404
            });
        }
        successRes(res, {
            message: 'Compra de plan eliminado exitosamente',
            statusCode: 201
        })
    } catch (error) {
        errorRes(res, {
          message: 'Error al eliminar la Compra de plan',
          statusCode: 500,
          errors: error.message
        });
    }
}