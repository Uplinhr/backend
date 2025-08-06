import pool from '../../database.js'

const UsuarioModel = {
    getAll: async () => {
    const [rows] = await pool.query('SELECT * FROM usuarios');
    return rows[0] || null
    },
    getById: async (id) => {
        const [rows] = await pool.query('SELECT nombre, email FROM usuarios WHERE id = ?', [id]);
        return rows[0] || null
    }
}

export default UsuarioModel