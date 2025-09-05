import pool from '../../database/database.js'

const busquedaModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        `SELECT 
            b.*,
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
        LEFT JOIN usuarios u ON c.id_usuario = u.id`
    );
    return rows || null
    },
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
        const campos = [];
        const valores = [];
        
        if (busqueda.info_busqueda !== undefined) {
            campos.push('info_busqueda = ?');
            valores.push(busqueda.info_busqueda);
        }
        
        if (busqueda.creditos_usados !== undefined) {
            campos.push('creditos_usados = ?');
            valores.push(busqueda.creditos_usados);
        }
        
        if (busqueda.observaciones !== undefined) {
            campos.push('observaciones = ?');
            valores.push(busqueda.observaciones);
        }
        
        if (busqueda.estado !== undefined) {
            campos.push('estado = ?');
            valores.push(busqueda.estado);
        }
        
        if (busqueda.id_cred !== undefined) {
            campos.push('id_cred = ?');
            valores.push(busqueda.id_cred);
        }
        
        if (busqueda.id_tipo !== undefined) {
            campos.push('id_tipo = ?');
            valores.push(busqueda.id_tipo);
        }
        
        if (busqueda.id_proceso !== undefined) {
            campos.push('id_proceso = ?');
            valores.push(busqueda.id_proceso);
        }
        
        campos.push('ultima_mod = NOW()');
        
        // Obligatorio para el WHERE
        valores.push(id);
        
        if (campos.length === 0) {
            return false; // En caso de no tener nada que actualizar
        }
        
        const query = `UPDATE busquedas SET ${campos.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, valores);
        return result.affectedRows > 0
    },
    create: async (info_busqueda, id_cred) => {
        const [busqueda] = await pool.query(
            `INSERT INTO busquedas (info_busqueda, id_cred, creditos_usados)
            VALUES (?, ?, ?)`, [info_busqueda, id_cred, null]
        )
        return busqueda.insertId
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'UPDATE busquedas SET estado = ? WHERE id = ?',
            ['Eliminado', id]
        )
        return result.affectedRows > 0
    }
}

export default busquedaModel