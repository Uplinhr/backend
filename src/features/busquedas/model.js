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
            'SELECT fecha_alta, ultima_mod, info_busqueda, creditos_usados, observaciones, estado, id_cred, id_tipo, id_proceso FROM busquedas WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    editById: async (id, busqueda) => {
        const [result] = await pool.query(
            'UPDATE busquedas SET info_busqueda = ?, creditos_usados = ?, observaciones = ?, estado = ?, id_cred = ?, id_tipo = ?, id_proceso = ?, ultima_mod = NOW() WHERE id = ?',
            [busqueda.info_busqueda, busqueda.creditos_usados, busqueda.observaciones, busqueda.estado, busqueda.id_cred, busqueda.id_tipo, busqueda.id_proceso, id]
        )
        return result.affectedRows > 0
    },
    create: async (info_busqueda, creditos_usados, observaciones, id_cred, id_tipo, id_proceso) => {
        const [busqueda] = await pool.query(
            `INSERT INTO busquedas (info_busqueda, creditos_usados, observaciones, id_cred 
            ${id_tipo? ', id_tipo' : ''}
            ${id_proceso? ', id_proceso' : ''}
            ) 
            VALUES (?, ?, ?, ?
            ${id_tipo? ', ?' : ''}
            ${id_proceso? ', ?' : ''}
            )`, [info_busqueda, creditos_usados, observaciones, id_cred, id_tipo, id_proceso]
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