import pool from '../../database/database.js'

const creditoModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM creditos'
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
            'SELECT tipo_credito, cantidad, vencimiento, id_usuario FROM creditos WHERE id = ?', 
            [id]
        );
        return rows[0] || null
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