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

      // Buscar créditos por tipo
      const creditoPlan = creditosUsuario.find(c => c.tipo_credito === 'plan');
      const creditoAdicional = creditosUsuario.find(c => c.tipo_credito === 'adicional');
      const creditoDevuelto = creditosUsuario.find(c => c.tipo_credito === 'devuelto');

      const creditosUsados = req.body.creditos_usados;

      // Orden de prioridad: devuelto -> plan -> adicional
      let creditoSeleccionado = null;

      if (creditoDevuelto && creditoDevuelto.cantidad >= creditosUsados) {
        creditoSeleccionado = creditoDevuelto;
      } else if (creditoPlan && creditoPlan.cantidad >= creditosUsados) {
        creditoSeleccionado = creditoPlan;
      } else if (creditoAdicional && creditoAdicional.cantidad >= creditosUsados) {
        creditoSeleccionado = creditoAdicional;
      }

      // Validar créditos suficientes
      if (!creditoSeleccionado) {
        return errorRes(res, {
          message: 'Créditos insuficientes para finalizar la búsqueda',
          statusCode: 400
        });
      }

      // Restar créditos
      const nuevaCantidad = creditoSeleccionado.cantidad - creditosUsados;
      const creditChanged = await creditoModel.editById(creditoSeleccionado.id, {
        cantidad: nuevaCantidad
      });
      console.log('creditChanged: ', creditChanged)
      console.log('credioSeleccionado: ', creditoSeleccionado)
      console.log('nuevaCantidad: ', nuevaCantidad)
      if (!creditChanged) {
        return errorRes(res, {
          message: 'Error en la resta de créditos',
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
      statusCode: 200 // 200 en lugar de 201 (201 es para creación)
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