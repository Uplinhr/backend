import pool from '../../database.js'

const UsuarioModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM usuarios'
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
            'SELECT nombre, email, apellido, fecha_alta FROM usuarios WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    create: async (nombre, apellido, contrasenia, email, estado) => {
        const [usuario] = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, contrasenia, email, estado) 
            VALUES (?, ?, ?, ?, ?)`, [nombre, apellido, contrasenia, email, estado]
        )
        return usuario.insertId
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM usuarios WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default UsuarioModel