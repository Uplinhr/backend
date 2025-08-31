import pool from '../../database/database.js'

const creditoModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        `SELECT 
            c.*,
            COALESCE(
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', b.id,
                            'fecha_alta', b.fecha_alta,
                            'ultima_mod', b.ultima_mod,
                            'info_busqueda', b.info_busqueda,
                            'creditos_usados', b.creditos_usados,
                            'observaciones', b.observaciones,
                            'estado', b.estado
                        )
                    )
                    FROM busquedas b 
                    WHERE b.id_cred = c.id
                ),
                JSON_ARRAY()
            ) AS busquedas,
            COALESCE(
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', cc.id,
                            'fecha_alta', cc.fecha_alta,
                            'costo', cc.costo,
                            'medio_pago', cc.medio_pago,
                            'observaciones', cc.observaciones
                        )
                    )
                    FROM compra_creditos cc
                    WHERE cc.id_cred = c.id
                ),
                JSON_ARRAY()
            ) AS compra_creditos
        FROM creditos c`
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
            c.*,
            COALESCE(
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', b.id,
                            'fecha_alta', b.fecha_alta,
                            'ultima_mod', b.ultima_mod,
                            'info_busqueda', b.info_busqueda,
                            'creditos_usados', b.creditos_usados,
                            'observaciones', b.observaciones,
                            'estado', b.estado
                        )
                    )
                    FROM busquedas b 
                    WHERE b.id_cred = c.id
                ),
                JSON_ARRAY()
            ) AS busquedas,
            COALESCE(
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', cc.id,
                            'fecha_alta', cc.fecha_alta,
                            'costo', cc.costo,
                            'medio_pago', cc.medio_pago,
                            'observaciones', cc.observaciones
                        )
                    )
                    FROM compra_creditos cc
                    WHERE cc.id_cred = c.id
                ),
                JSON_ARRAY()
            ) AS compra_creditos
            FROM creditos c
            WHERE id = ?`, 
            [id]
        );
        return rows || null
    },
    getOwn: async (idUsuario) => {
        const [result] = await pool.query(
            `SELECT * FROM creditos 
            WHERE id_usuario = ?`, 
            [idUsuario]
        )
        return result || null
    },
    editById: async (id, credito) => {
        const [result] = await pool.query(
            'UPDATE creditos SET tipo_credito = ?, cantidad = ?, vencimiento = ?, id_usuario = ? WHERE id = ?',
            [credito.tipo_credito, credito.cantidad, credito.vencimiento, credito.id_usuario, id]
        )
        return result.affectedRows > 0
    },
    create: async (tipo_credito, cantidad, vencimiento, id_usuario) => {
        const [credito] = await pool.query(
            `INSERT INTO creditos (tipo_credito, cantidad, vencimiento, id_usuario) 
            VALUES (?, ?, ?, ?)`, [tipo_credito, cantidad, vencimiento, id_usuario]
        )
        return credito.insertId // SI HAY UN ERROR EN LA CREACION, SE GENERA EL ID IGUAL, CAMBIAR EN EL FUTURO
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM creditos WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default creditoModel