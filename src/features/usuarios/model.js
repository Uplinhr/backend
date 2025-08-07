import pool from '../../database.js'

const UsuarioModel = {
    getAll: async () => {
    const [rows] = await pool.query('SELECT * FROM usuarios');
    return rows || null
    },
    getById: async (id) => {
        const [rows] = await pool.query('SELECT nombre, email FROM usuarios WHERE id = ?', [id]);
        return rows[0] || null
    },
    create: async (nombre, email, id) => {
        const [usuario] = await pool.query(`INSERT INTO usuarios (nombre, email) 
            VALUES (?, ?)`, [nombre, email]
        )
        return usuario.insertId
    }
}

export default UsuarioModel