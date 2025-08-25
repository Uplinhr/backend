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
            'SELECT fecha_alta, ultima_mod, cantidad_horas, comentarios, observaciones, estado, id_consultoria FROM consultas WHERE id = ?', 
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
    create: async (cantidad_horas, observaciones, id_consultoria) => {
        const [consulta] = await pool.query(
            `INSERT INTO consultas (cantidad_horas, observaciones, id_consultoria) 
            VALUES (?, ?, ?)`, [cantidad_horas, observaciones, id_consultoria]
        )
        return consulta.insertId // SI HAY UN ERROR EN LA CREACION, SE GENERA EL ID IGUAL, CAMBIAR EN EL FUTURO
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            `UPDATE consultas SET estado = ? WHERE id = ?`,
            ['Eliminado', id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default consultaModel