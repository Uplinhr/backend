import pool from '../../database/database.js'

const busquedaModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM busquedas'
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
                b.*,
                JSON_OBJECT(
                'id', c.id,
                'tipo_credito', c.tipo_credito,
                'cantidad', c.cantidad,
                'fecha_alta', c.fecha_alta,
                'vencimiento', c.vencimiento
                ) AS creditos,
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
            FROM busquedas b
            LEFT JOIN creditos c ON b.id_cred = c.id
            LEFT JOIN usuarios u ON c.id_usuario = u.id
            WHERE b.id = ?`, 
            [id]
        );
        return rows[0] || null
    },
    getByUserId: async(id) => {
        const [rows] = await pool.query(
            `SELECT 
                b.*,
                JSON_OBJECT(
                'id', c.id,
                'tipo_credito', c.tipo_credito,
                'cantidad', c.cantidad,
                'fecha_alta', c.fecha_alta,
                'vencimiento', c.vencimiento
                ) AS creditos,
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
                FROM busquedas b
                LEFT JOIN creditos c ON b.id_cred = c.id
                LEFT JOIN usuarios u ON c.id_usuario = u.id
                WHERE u.id = ?;
            `,
            [id]
        )
        return rows || null
    },
    editById: async (id, busqueda) => {
        const [result] = await pool.query(
            'UPDATE busquedas SET info_busqueda = ?, creditos_usados = ?, observaciones = ?, estado = ?, id_cred = ?, id_tipo = ?, id_proceso = ?, ultima_mod = NOW() WHERE id = ?',
            [busqueda.info_busqueda, busqueda.creditos_usados, busqueda.observaciones, busqueda.estado, busqueda.id_cred, busqueda.id_tipo, busqueda.id_proceso, id]
        )
        return result.affectedRows > 0
    },
    create: async (info_busqueda, id_cred) => {
        const [busqueda] = await pool.query(
            `INSERT INTO busquedas (info_busqueda, id_cred, creditos_usados)
            VALUES (?, ?, ?)`, [info_busqueda, id_cred, null]
        )
        return busqueda.insertId // SI HAY UN ERROR EN LA CREACION, SE GENERA EL ID IGUAL, CAMBIAR EN EL FUTURO
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'UPDATE busquedas SET estado = ? WHERE id = ?',
            ['Eliminado', id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default busquedaModel