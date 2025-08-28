import pool from '../../database/database.js'

const consultaModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM consultas'
    );
    return rows || null
    },/*
    getAllActives: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM usuarios WHERE estado = ?', ['activo']
    );
    return rows || null
    },*/
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
        const [result] = await pool.query(
            'UPDATE consultas SET cantidad_horas = ?, comentarios = ?, observaciones = ?, estado = ?, id_consultoria = ?, ultima_mod = NOW() WHERE id = ?',
            [consulta.cantidad_horas, consulta.comentarios, consulta.observaciones, consulta.estado, consulta.id_consultoria, id]
        )
        return result.affectedRows > 0
    },
    create: async (cantidad_horas, comentarios, consultoria) => {
        const [resultConsulta] = await pool.query(
            `INSERT INTO consultas (cantidad_horas, comentarios, id_consultoria)
            VALUES (?, ?, ?)`, [cantidad_horas, comentarios, consultoria.id]
        )
        
        const restaHoras = Number(consultoria.horas_restantes) - Number(cantidad_horas)
        const [resultConsultoria] = await pool.query(
            `UPDATE consultorias SET horas_restantes = ? WHERE id = ?`,
            [restaHoras, consultoria.id]
        )
        if(resultConsultoria.affectedRows > 0){
            return resultConsulta.insertId
        }
        return false
    },
    deleteById: async (consultoria, consulta) => {
        const [resultConsulta] = await pool.query(
            `UPDATE consultas SET estado = ? WHERE id = ?`,
            ['Eliminado', consulta.id]
        )
        const [resultConsultoria] = await pool.query(
            `UPDATE consultorias SET horas_restantes = ? WHERE id = ?`,
            [(consultoria.horas_restantes + consulta.cantidad_horas), consultoria.id]
        )
        return resultConsulta.affectedRows > 0 && resultConsultoria.affectedRows > 0 // Retorna true si eliminó algún registro
    },
}

export default consultaModel