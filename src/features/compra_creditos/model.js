import pool from '../../database/database.js'

const compra_creditosModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        `SELECT 
        cc.*,
        CASE 
            WHEN c.id IS NOT NULL THEN 
                JSON_OBJECT(
                    'id', c.id,
                    'tipo_credito', c.tipo_credito,
                    'cantidad', c.cantidad,
                    'vencimiento', c.vencimiento,
                    'fecha_alta', c.fecha_alta
                )
            ELSE NULL 
        END AS creditos
        FROM compra_creditos cc
        LEFT JOIN creditos c ON cc.id_cred = c.id`
    );
    return rows || null
    },
    getById: async (id) => {
        const [rows] = await pool.query(
            `SELECT 
            cc.*,
            CASE 
                WHEN c.id IS NOT NULL THEN 
                    JSON_OBJECT(
                        'id', c.id,
                        'tipo_credito', c.tipo_credito,
                        'cantidad', c.cantidad,
                        'vencimiento', c.vencimiento,
                        'fecha_alta', c.fecha_alta
                    )
                ELSE NULL 
            END AS creditos
            FROM compra_creditos cc
            LEFT JOIN creditos c ON cc.id_cred = c.id
            WHERE cc.id = ?`, 
            [id]
        );
        return rows[0] || null
    },
    editById: async (id, compra_credito) => {
        const campos = [];
        const valores = [];
        
        if (compra_credito.medio_pago !== undefined) {
            campos.push('medio_pago = ?');
            valores.push(compra_credito.medio_pago);
        }
        
        if (compra_credito.costo !== undefined) {
            campos.push('costo = ?');
            valores.push(compra_credito.costo);
        }
        
        if (compra_credito.observaciones !== undefined) {
            campos.push('observaciones = ?');
            valores.push(compra_credito.observaciones);
        }
        
        if (compra_credito.id_cred !== undefined) {
            campos.push('id_cred = ?');
            valores.push(compra_credito.id_cred);
        }
        
        // Obligatorio para el WHERE
        valores.push(id);
        
        if (campos.length === 0) {
            return false; // En caso de no tener nada que actualizar
        }
        
        const query = `UPDATE compra_creditos SET ${campos.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, valores);
        return result.affectedRows > 0
    },
    create: async (medio_pago, costo, observaciones, cantidad, id_usuario) => {
        try{
            const [creditos] = await pool.query(
                `INSERT INTO creditos (tipo_credito, cantidad, vencimiento, id_usuario) 
                VALUES (?, ?, ?, ?)`, ['adicional', cantidad, null, id_usuario]
            )
            const [compra_credito] = await pool.query(
                `INSERT INTO compra_creditos (medio_pago, costo, observaciones, id_cred) 
                VALUES (?, ?, ?, ?)`, [medio_pago, costo, observaciones, creditos.insertId]
            )
            return compra_credito.insertId
        } catch(error){
            if(creditos && creditos.insertId){
                await pool.query('DELETE FROM creditos WHERE id = ?', [creditos.insertId]);
            }
            throw error
        }
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM compra_creditos WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0
    }
}

export default compra_creditosModel