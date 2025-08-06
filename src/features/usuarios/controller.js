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