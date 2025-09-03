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
            `SELECT c.*
            FROM creditos c
            WHERE c.id_usuario = ?
            AND (c.vencimiento IS NULL OR c.vencimiento >= CURRENT_DATE())
            AND (c.tipo_credito != 'plan' OR c.id = (
                SELECT c2.id 
                FROM creditos c2 
                WHERE c2.id_usuario = ? 
                AND c2.tipo_credito = 'plan'
                AND (c2.vencimiento IS NULL OR c2.vencimiento >= CURRENT_DATE())
                ORDER BY c2.fecha_alta DESC 
                LIMIT 1
            ))
            ORDER BY c.tipo_credito, c.fecha_alta DESC`, 
            [idUsuario, idUsuario]  //Dos parámetros para los dos placeholders
        )
        return result || null
    },
    editById: async (id, credito) => {
        const campos = [];
        const valores = [];
        
        if (credito.tipo_credito !== undefined) {
            campos.push('tipo_credito = ?');
            valores.push(credito.tipo_credito);
        }
        
        if (credito.cantidad !== undefined) {
            campos.push('cantidad = ?');
            valores.push(credito.cantidad);
        }
        
        if (credito.vencimiento !== undefined) {
            campos.push('vencimiento = ?');
            valores.push(credito.vencimiento);
        }
        
        if (credito.id_usuario !== undefined) {
            campos.push('id_usuario = ?');
            valores.push(credito.id_usuario);
        }
        
        // Obligatorio para el WHERE
        valores.push(id);
        
        if (campos.length === 0) {
            return false; // En caso de no tener nada que actualizar
        }
        
        const query = `UPDATE creditos SET ${campos.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, valores);
        return result.affectedRows > 0
    },
    create: async (tipo_credito, cantidad, vencimiento, id_usuario) => {
        const [credito] = await pool.query(
            `INSERT INTO creditos (tipo_credito, cantidad, vencimiento, id_usuario) 
            VALUES (?, ?, ?, ?)`, [tipo_credito, cantidad, vencimiento, id_usuario]
        )
        return credito.insertId
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