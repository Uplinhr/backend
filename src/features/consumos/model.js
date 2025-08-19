import pool from '../../database/database.js'

const consumoModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM consumos'
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
            'SELECT fecha_consumo, tipo_busqueda, creditos_usados, observaciones, estado, id_cred FROM consumos WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    editById: async (id, consumo) => {
        const [result] = await pool.query(
            'UPDATE consumos SET tipo_busqueda = ?, creditos_usados = ?, observaciones = ?, estado = ?, id_cred = ? WHERE id = ?',
            [consumo.tipo_busqueda, consumo.creditos_usados, consumo.observaciones, consumo.estado, consumo.id_cred, id]
        )
        return result.affectedRows > 0
    },
    create: async (tipo_busqueda, creditos_usados, observaciones, id_cred) => {
        const [consumo] = await pool.query(
            `INSERT INTO consumos (tipo_busqueda, creditos_usados, observaciones, id_cred) 
            VALUES (?, ?, ?, ?)`, [tipo_busqueda, creditos_usados, observaciones, id_cred]
        )
        return consumo.insertId // SI HAY UN ERROR EN LA CREACION, SE GENERA EL ID IGUAL, CAMBIAR EN EL FUTURO
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM consumos WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default consumoModel