import pool from '../../database/database.js'

const AuthModel = {
    login: async (email) => {
        const [user] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?', 
            [email]
        );
        return user[0] || null
    },
    create: async (nombre, apellido, hashedPassword, email) => {
        const [usuario] = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, contrasenia, email)
            VALUES (?, ?, ?, ?, ?)`, [nombre, apellido, hashedPassword, email]
        )
        return usuario.insertId
    },
}

export default AuthModel