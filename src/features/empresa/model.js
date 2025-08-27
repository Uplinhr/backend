import pool from '../../database/database.js'

const empresaModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM empresas'
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
            'SELECT nombre, email, id_usuario, active, fecha_alta, ultima_mod FROM empresas WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    editById: async (id, empresa) => {
        const [result] = await pool.query(
            'UPDATE empresas SET nombre = ?, email = ?, id_usuario = ?, ultima_mod = NOW() WHERE id = ?',
            [empresa.nombre, empresa.email, empresa.id_usuario, id]
        )
        return result.affectedRows > 0
    },
    editOwn: async (empresa) => {
        const [result] = await pool.query(
            'UPDATE empresas SET nombre = ?, email = ?, ultima_mod = NOW() WHERE id_usuario = ?',
            [empresa.nombre, empresa.email, empresa.id_usuario]
        )
        return result.affectedRows > 0
    },
    create: async (nombre, email, id_usuario) => {
        const [empresa] = await pool.query(
            `INSERT INTO empresas (nombre, email, id_usuario) 
            VALUES (?, ?, ?)`, [nombre, email, id_usuario]
        )
        return empresa.insertId // SI HAY UN ERROR EN LA CREACION, SE GENERA EL ID IGUAL, CAMBIAR EN EL FUTURO
    },
    enableById: async (id) => {
        const [result] = await pool.query(
            'UPDATE empresas SET active = true WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'UPDATE empresas SET active = false WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default empresaModel