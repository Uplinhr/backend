import pool from '../../database/database.js'

const compra_creditosModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM compra_creditos'
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
            'SELECT fecha_compra, medio_pago, costo, observaciones, id_cred FROM compra_creditos WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    editById: async (id, compra_credito) => {
        const [result] = await pool.query(
            'UPDATE compra_creditos SET medio_pago = ?, costo = ?, observaciones = ?, id_cred = ? WHERE id = ?',
            [compra_credito.medio_pago, compra_credito.costo, compra_credito.observaciones, compra_credito.id_cred, id]
        )
        return result.affectedRows > 0
    },
    create: async (medio_pago, costo, observaciones, id_cred) => {
        const [compra_credito] = await pool.query(
            `INSERT INTO compra_creditos (medio_pago, costo, observaciones, id_cred) 
            VALUES (?, ?, ?, ?)`, [medio_pago, costo, observaciones, id_cred]
        )
        return compra_credito.insertId // SI HAY UN ERROR EN LA CREACION, SE GENERA EL ID IGUAL, CAMBIAR EN EL FUTURO
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM compra_creditos WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default compra_creditosModel