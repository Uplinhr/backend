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
  try {
    const { id } = req.params;
    
    // Validación de ID
    if (isNaN(id)) {
      return errorRes(res, {
        message: 'El id debe ser un número',
        statusCode: 400
      });
    }

    // Obtener búsqueda
    const busqueda = await busquedaModel.getById(id);
    if (!busqueda) {
      return errorRes(res, {
        message: 'No existe una búsqueda con esa ID',
        statusCode: 404
      });
    }

    // Validar estado actual
    if (busqueda.estado === 'Finalizado') {
      return errorRes(res, {
        message: 'No puedes editar una búsqueda finalizada',
        statusCode: 400
      });
    }

    // Procesar créditos si se está finalizando
    if (req.body.estado === 'Finalizado') {
      const creditosUsuario = await creditoModel.getOwn(busqueda.usuario.id);
      
      // Validar que se envíen créditos usados
      if (!req.body.creditos_usados || req.body.creditos_usados <= 0) {
        return errorRes(res, {
          message: 'Se deben especificar créditos usados al finalizar',
          statusCode: 400
        });
      }

      // Buscar créditos por tipo en orden de prioridad
      const creditoDevuelto = creditosUsuario.find(c => c.tipo_credito === 'devuelto');
      const creditoPlan = creditosUsuario.find(c => c.tipo_credito === 'plan');
      const creditoAdicional = creditosUsuario.find(c => c.tipo_credito === 'adicional');

      const creditosUsados = req.body.creditos_usados;
      let creditosRestantes = creditosUsados;

      // Orden de prioridad: devuelto -> plan -> adicional
      const creditosEnOrden = [creditoDevuelto, creditoPlan, creditoAdicional].filter(Boolean);

      // Verificar créditos totales disponibles
      const creditosTotales = creditosEnOrden.reduce((total, cred) => total + (cred?.cantidad || 0), 0);
      
      if (creditosTotales < creditosUsados) {
        return errorRes(res, {
          message: 'Créditos insuficientes para finalizar la búsqueda',
          statusCode: 400
        });
      }

      // Restar créditos en cascada según prioridad
      for (const credito of creditosEnOrden) {
        if (creditosRestantes <= 0) break;

        if (credito && credito.cantidad > 0) {
          const cantidadARestar = Math.min(credito.cantidad, creditosRestantes);
          const nuevaCantidad = credito.cantidad - cantidadARestar;
          
          const creditChanged = await creditoModel.editById(credito.id, {
            cantidad: nuevaCantidad
          });

          if (!creditChanged) {
            return errorRes(res, {
              message: `Error al restar créditos de tipo ${credito.tipo_credito}`,
              statusCode: 500
            });
          }

          creditosRestantes -= cantidadARestar;
          console.log(`Restados ${cantidadARestar} créditos de ${credito.tipo_credito}. Restantes: ${creditosRestantes}`);
        }
      }

      // Verificar que se restaron todos los créditos
      if (creditosRestantes > 0) {
        return errorRes(res, {
          message: 'Error inesperado: no se pudieron restar todos los créditos',
          statusCode: 500
        });
      }
    }

    // Editar la búsqueda
    const changed = await busquedaModel.editById(id, req.body);
    if (!changed) {
      return errorRes(res, {
        message: 'La búsqueda no se pudo editar',
        statusCode: 500
      });
    }

    successRes(res, {
      message: 'Búsqueda editada exitosamente',
      statusCode: 200
    });

  } catch (error) {
    console.error('Error al editar búsqueda:', error);
    errorRes(res, {
      message: 'Error interno al editar la búsqueda',
      statusCode: 500,
      errors: error.message
    });
  }
};

export const create = async (req, res) => {
  const {rol, id} = req.user
  try {
    const {info_busqueda, id_cred} = req.body;
    if(!info_busqueda) {
      return errorRes(res, {
        message: 'Se requiere la informacion de la busqueda',
        statusCode: 404
      })
    }

    const creditos = await creditoModel.getById(id_cred)
    if (creditos === null){
      return errorRes(res, {
        message: 'La tabla de creditos no existe',
        statusCode: 404
      })
    }
    if(creditos[0].id_usuario != id && rol !== 'admin'){
      return errorRes(res, {
        message: 'La tabla de creditos no corresponde al usuario',
        statusCode: 404
      })
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