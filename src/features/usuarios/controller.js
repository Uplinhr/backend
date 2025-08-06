import { successRes, errorRes } from "../../utils/apiResponse.js";
import pool from "../../database.js";

export const getUsuarios = async (req, res) => {
    try{
        const [rows] = await pool.query('SELECT * FROM usuarios');
        successRes(res, { 
          data: rows,
          message: 'Usuarios obtenidos correctamente'
        });
    } catch (error){
        errorRes(res, {
      message: 'Error al obtener usuarios',
      statusCode: 500,
      errors: error.message
    });
    }
};

export const getUsuarioById = async (req, res) => {
    try{
        const {id} = req.params
        if(isNaN(id)) { // SI ID NO ES NUMERICO
            return errorRes(res, {
                message: 'El ID debe ser numerico',
                statusCode: 400
            })
            }
        const [rows] = await pool.query(`SELECT nombre, email FROM usuarios WHERE id = ?`, [id])
        if(rows.length === 0){ // SI NO EXISTE EL USUARIO
            return errorRes(res,{
                message: 'Usuario no encontrado',
                statusCode: 404
            })
        }
        successRes(res, {
            data: rows[0],
            message: 'Usuario obtenido correctamente'
        })
    } catch (error){
        errorResponse(res, {
          message: 'Error al obtener el usuario',
          statusCode: 500,
          errors: err.message
        });
    }
}