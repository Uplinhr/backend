import pool from '../../database/database.js'

const consultaModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        `SELECT 
            cons.*,
            JSON_OBJECT(
            'id', u.id,
            'nombre', u.nombre,
            'apellido', u.apellido,
            'email', u.email,
            'fecha_alta', u.fecha_alta,
            'rol', u.rol,
            'num_celular', u.num_celular,
            'active', u.active
            ) AS usuario
        FROM consultas cons
        LEFT JOIN consultorias c ON cons.id_consultoria = c.id
        LEFT JOIN usuarios u ON c.id_usuario = u.id`
    );
    return rows || null
    },
    getById: async (id) => {
        const [rows] = await pool.query(
            `SELECT 
                cons.*,
                JSON_OBJECT(
                'id', c.id,
                'horas_restantes', c.horas_restantes,
                'horas_totales', c.horas_totales,
                'fecha_alta', c.fecha_alta,
                'vencimiento', c.vencimiento
                ) AS consultorias
            FROM consultas cons
            LEFT JOIN consultorias c ON cons.id_consultoria = c.id
            WHERE cons.id = ?`, 
            [id]
        );
        return rows[0] || null
    },
    getByUserId: async(id) => {
        const [rows] = await pool.query(
            `SELECT 
                cons.*,
                JSON_OBJECT(
                'id', c.id,
                'horas_restantes', c.horas_restantes,
                'horas_totales', c.horas_totales,
                'fecha_alta', c.fecha_alta,
                'vencimiento', c.vencimiento
                ) AS consultorias,
                JSON_OBJECT(
                'id', u.id,
                'nombre', u.nombre,
                'apellido', u.apellido,
                'email', u.email,
                'fecha_alta', u.fecha_alta,
                'rol', u.rol,
                'num_celular', u.num_celular,
                'active', u.active
                ) AS usuario
                FROM consultas cons
                LEFT JOIN consultorias c ON cons.id_consultoria = c.id
                LEFT JOIN usuarios u ON c.id_usuario = u.id
                WHERE u.id = ?;
            `,
            [id]
        )
        return rows || null
    },
    editById: async (id, consulta) => {
        const campos = [];
        const valores = [];
        
        if (consulta.cantidad_horas !== undefined) {
            campos.push('cantidad_horas = ?');
            valores.push(consulta.cantidad_horas);
        }
        
        if (consulta.comentarios !== undefined) {
            campos.push('comentarios = ?');
            valores.push(consulta.comentarios);
        }
        
        if (consulta.observaciones !== undefined) {
            campos.push('observaciones = ?');
            valores.push(consulta.observaciones);
        }
        
        if (consulta.estado !== undefined) {
            campos.push('estado = ?');
            valores.push(consulta.estado);
        }
        
        if (consulta.id_consultoria !== undefined) {
            campos.push('id_consultoria = ?');
            valores.push(consulta.id_consultoria);
        }
        
        campos.push('ultima_mod = NOW()');
        
        // Obligatorio para el WHERE
        valores.push(id);
        
        if (campos.length === 0) {
            return false; // En caso de no tener nada que actualizar
        }
        
        const query = `UPDATE consultas SET ${campos.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, valores);
        return result.affectedRows > 0
    },
    create: async (cantidad_horas, comentarios, consultoria) => {
        try{
            const restaHoras = Number(consultoria.horas_restantes) - Number(cantidad_horas)
            const [resultConsultoria] = await pool.query(
                `UPDATE consultorias SET horas_restantes = ? WHERE id = ?`,
                [restaHoras, consultoria.id]
            )
            if (resultConsultoria.affectedRows === 0) {
                throw new Error('No se pudo actualizar la consultoría');
            }
            const [resultConsulta] = await pool.query(
                `INSERT INTO consultas (cantidad_horas, comentarios, id_consultoria)
                VALUES (?, ?, ?)`, [cantidad_horas, comentarios, consultoria.id]
            )
            return resultConsulta.insertId
        } catch(error){
            console.error('Error en create:', error);
            // Revierte la resta de horas si falla la creación de la consulta
            if (resultConsultoria && resultConsultoria.affectedRows > 0) {
                const horasOriginales = Number(consultoria.horas_restantes);
                await pool.query(
                    `UPDATE consultorias SET horas_restantes = ? WHERE id = ?`,
                    [horasOriginales, consultoria.id]
                );
            }
            throw error;
        }
    },
    deleteById: async (consultoria, consulta) => {
        try{
            const [resultConsulta] = await pool.query(
                `UPDATE consultas SET estado = ? WHERE id = ?`,
                ['Eliminado', consulta.id]
            )
            if (resultConsulta.affectedRows === 0) {
                throw new Error('No se pudo eliminar la consulta');
            }

            const [resultConsultoria] = await pool.query(
                `UPDATE consultorias SET horas_restantes = ? WHERE id = ?`,
                [(consultoria.horas_restantes + consulta.cantidad_horas), consultoria.id]
            )
            return resultConsulta.affectedRows > 0 && resultConsultoria.affectedRows > 0 // Retorna true si eliminó algún registro
        } catch(error){
            console.error('Error en deleteById:', error);
            throw error;
        }
    },
}

export default consultaModel