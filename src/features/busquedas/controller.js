import { successRes, errorRes } from "../../utils/apiResponse.js";
import busquedaModel from "./model.js";
import creditoModel from '../creditos/model.js'
import { Resend } from "resend";

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


/**
 * Edita una soliticud de búsqueda
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.params.id - ID numérico de la solicitud de búsqueda
 * @param {string} [req.body.info_busqueda] - Información de la búsqueda provista por el usuario (opcional)
 * @param {string} [req.body.creditos_usados] - Creditos que consume de la tabla de creditos del usuario (obligatorio si estado es "Finalizado")
 * @param {string} [req.body.observaciones] - Obseraciones de la búsqueda provista por un administrador (opcional)
 * @param {string} [req.body.estado] - Estado de la solicitud de búsqueda (opcional)
 * @param {string} [req.body.id_cred] - ID numérico de la tabla de créditos del usuario (opcional)
 * @param {string} [req.body.id_tipo] - ID numérico del tipo de solicitud de búsqueda (opcional)
 * @param {string} [req.body.id_proceso] - ID numérico del proceso de solicitud de búsqueda (opcional)
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} Retorna una respuesta HTML
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Edita los datos de la solicitud de búsqueda de la base de datos
 * 
 * 1. **Validaciones iniciales**:
 *    - ID debe ser numérico
 *    - La búsqueda debe existir
 *    - No se puede editar búsquedas ya finalizadas
 * 
 * 2. **Gestión de créditos** (solo si se cambia estado a 'Finalizado'):
 *    - Valida que se envíen créditos usados
 *    - Obtiene todos los créditos del usuario
 *    - Aplica prioridad de uso: créditos devueltos → plan → adicionales
 *    - Verifica suficiencia de créditos
 *    - Resta créditos en cascada según prioridad
 *    - Actualiza cada tipo de crédito en la base de datos
 * 
 * 3. **Actualización final**:
 *    - Edita la búsqueda con los datos proporcionados
 *    - Retorna respuesta apropiada
 */
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

      const creditosUsados = req.body.creditos_usados;

      // Buscar créditos por tipo en orden de prioridad
      const creditosDevueltos = creditosUsuario
        .filter(c => c.tipo_credito === 'devuelto' && c.cantidad > 0)
        .sort((a, b) => b.cantidad - a.cantidad);
      const creditosPlan = creditosUsuario
        .filter(c => c.tipo_credito === 'plan' && c.cantidad > 0);
      const creditosAdicionales = creditosUsuario
        .filter(c => c.tipo_credito === 'adicional' && c.cantidad > 0)
        .sort((a, b) => b.cantidad - a.cantidad); // Opcional: ordenar por cantidad

      // Verificar créditos totales disponibles
      const creditosTotales = creditosDevueltos.reduce((sum, c) => sum + c.cantidad, 0) +
                              creditosPlan.reduce((sum, c) => sum + c.cantidad, 0) +
                              creditosAdicionales.reduce((sum, c) => sum + c.cantidad, 0);
      
      if (creditosTotales < creditosUsados) {
        return errorRes(res, {
          message: 'Créditos insuficientes para finalizar la búsqueda',
          statusCode: 400
        });
      }

      let creditosRestantes = creditosUsados;

      // Restar créditos en cascada según prioridad
      const restarDeCreditos = async (creditosArray) => {
        for (const credito of creditosArray) {
          if (creditosRestantes <= 0) break;

          const cantidadARestar = Math.min(credito.cantidad, creditosRestantes);
          const nuevaCantidad = credito.cantidad - cantidadARestar;
          
          const creditChanged = await creditoModel.editById(credito.id, {
            cantidad: nuevaCantidad
          });

          if (!creditChanged) {
            throw new Error(`Error al restar créditos de tipo ${credito.tipo_credito}`);
          }

          creditosRestantes -= cantidadARestar;
          console.log(`Restados ${cantidadARestar} créditos de ${credito.tipo_credito} (ID: ${credito.id}). Restantes: ${creditosRestantes}`);
        }
      };

      await restarDeCreditos(creditosDevueltos)
      await restarDeCreditos(creditosPlan);
      await restarDeCreditos(creditosAdicionales);

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

    const resend = new Resend(process.env.MAIL_API_KEY);
    const { data, error } = await resend.emails.send({
      from: `UplinHR <${process.env.EMAIL_FROM}>`,
      to: ["contacto@uplinhr.com"],
      subject: "Nueva solicitud de búsqueda - UplinHR",
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nueva Solicitud de Búsqueda - UplinHR</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #FFFFFF;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                }
                .header {
                    background-color: #502B7D;
                    padding: 20px;
                    text-align: center;
                }
                .header h1 {
                    color: #FFFFFF;
                    margin: 0;
                    font-size: 24px;
                }
                .content {
                    padding: 30px;
                }
                .footer {
                    background-color: #f5f5f5;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
                .button {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #6C4099;
                    color: #FFFFFF;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    margin: 20px 0;
                }
                .info-box {
                    background-color: #f9f5ff;
                    border-left: 4px solid #6C4099;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 0 4px 4px 0;
                }
            </style>
        </head>
        <body>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f9f9; padding: 20px 0;">
                <tr>
                    <td align="center">
                        <div class="container">
                            <div class="header">
                                <h1>UplinHR</h1>
                            </div>

                            <div class="content">
                                <h2 style="color: #502B7D; margin-top: 0;">Nueva Solicitud de Búsqueda</h2>
                                <p>Hola equipo UplinHR,</p>
                                <p>El usuario ${req.user.nombre + ' ' + req.user.apellido} ha solicitado una búsqueda en la plataforma.</p>

                                <div class="info-box">
                                    <p><strong>Información de la búsqueda:</strong></p>
                                    <p>${info_busqueda}</p>
                                    <p><strong>Email del usuario:</strong></p>
                                    <p>${req.user.email}</p>
                                </div>

                                <p>Para revisar los detalles completos de esta solicitud, accede al sistema administrativo:</p>

                                <p style="text-align: center;">
                                    <a href="https://www.uplinhr.com/login" class="button">
                                        Acceder al sistema
                                    </a>
                                </p>

                                <p>Este es un mensaje automático, por favor no responder directamente a este correo.</p>
                            </div>

                            <div class="footer">
                                <p>Equipo UplinHR<br>
                                <a href="https://www.uplinhr.com" style="color: #502B7D;">www.uplinhr.com</a></p>
                                <p>© 2023 UplinHR. Todos los derechos reservados.</p>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `
    });
    if (error) {
      console.error('Error enviando email:', error)
      return errorRes(res, {
        message: 'Error al enviar el email de recuperación',
        statusCode: error.statusCode,
        errors: error.message
      })
    }

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


/**
 * Elimina una solicitud de búsqueda (Borrado lógico)
 * @param {Object} req - Objeto de petición de Express
 * @param {string} req.params.id - ID numérico de la solicitud de búsqueda
 * @param {Object} res - Objeto de respuesta de Express
 * @returns {Promise<void>} Retorna una respuesta HTML
 * @throws {Error} Si ocurre un error inesperado en el servidor
 * @description
 * Edita el estado de una solicitud de búsqueda a "Eliminado" y devuelve los créditos si corresponde
 * 
 * 1. **Validaciones iniciales**:
 * - ID debe ser numérico
 * - La búsqueda debe existir
 * - La búsqueda no debe tener el estado: "Eliminado" con anterioridad
 * 
 * 2. **Devolución de créditos** (solo si la búsqueda estaba finalizada y usó créditos):
 * - Intenta devolver créditos al crédito original usado
 * - Si no encuentra el crédito original, busca en orden de prioridad:
 * - Créditos devueltos → Créditos de plan → Créditos adicionales
 * - Si no existe ningún crédito, crea uno nuevo de tipo 'devuelto'
 * - Maneja múltiples escenarios de fallo en la devolución
 * 
 * * 3. **Eliminación final**:
 * - Elimina la búsqueda de la base de datos
 * - Retorna respuesta apropiada
 */
export const deleteById = async (req, res) => {
  try{
    const {id} = req.params
    if(isNaN(id)) {
      return errorRes(res, {
        message: 'El id debe ser un numero',
        statusCode: 404
      })
    }
    const busqueda = await busquedaModel.getById(id);
    if(!busqueda){
      return errorRes(res, {
        message: 'No existe una busqueda con esa ID',
        statusCode: 404
      })
    }
    if(busqueda.estado == 'Eliminado'){
      return errorRes(res, {
        message: 'La busqueda ya se encuentra eliminada',
        statusCode: 400
      })
    }
    if(busqueda.estado == 'Finalizado' && busqueda.creditos_usados > 0){
      const creditosUsuario = await creditoModel.getOwn(busqueda.usuario.id)

      const creditoOriginal = creditosUsuario.find(c => c.id === busqueda.id_cred)

      if(creditoOriginal){
        const nuevaCantidad = creditoOriginal.cantidad + busqueda.creditos_usados
        const creditChanged = await creditoModel.editById(creditoOriginal.id,{
          cantidad: nuevaCantidad
        })
        if(!creditChanged){
          return errorRes(res, {
            message: 'Error al devolver los créditos',
            statusCode: 500
          });
        }
        console.log(`Devueltos ${busqueda.creditos_usados} créditos al crédito ID: ${creditoOriginal.id}`);
      } else {
        //En caso de no encontrar el credito original, es muy poco posible
        const creditoDevuelto = creditosUsuario.find(c => c.tipo_credito === 'devuelto');
        const creditoPlan = creditosUsuario.find(c => c.tipo_credito === 'plan');
        const creditoAdicional = creditosUsuario.find(c => c.tipo_credito === 'adicional');

        const creditoParaDevolucion = creditoDevuelto || creditoPlan || creditoAdicional;

        if (creditoParaDevolucion) {
          const nuevaCantidad = creditoParaDevolucion.cantidad + busqueda.creditos_usados;
          const creditChanged = await creditoModel.editById(creditoParaDevolucion.id, {
            cantidad: nuevaCantidad
          });

          if (!creditChanged) {
            return errorRes(res, {
              message: 'Error al devolver los créditos',
              statusCode: 500
            });
          }
          
          console.log(`Devueltos ${busqueda.creditos_usados} créditos al crédito ID: ${creditoParaDevolucion.id} (tipo: ${creditoParaDevolucion.tipo_credito})`);
        } else {
          // Crear un nuevo crédito si no existe ninguno
          const nuevoCredito = await creditoModel.create({
            tipo_credito: 'devuelto',
            cantidad: busqueda.creditos_usados,
            id_usuario: busqueda.usuario.id,
            vencimiento: null
          });
          
          if (!nuevoCredito) {
            return errorRes(res, {
              message: 'Error al crear nuevo crédito para devolución',
              statusCode: 500
            });
          }
        }
      }
    }
    const deleted = await busquedaModel.deleteById(id)
    if(!deleted){
      return errorRes(res, {
        message: 'busqueda no encontrado',
        statusCode: 404
      });
    }
    successRes(res, {
      message: 'busqueda eliminada exitosamente',
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