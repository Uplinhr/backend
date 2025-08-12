import pool from '../../database/database.js'

const AuthModel = {
    login: async (email) => {
        const [user] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?', 
            [email]
        );
        return user[0] || null
    },
    create: async (nombre, apellido, hashedPassword, email, estado) => {
        const [usuario] = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, contrasenia, email, estado) 
            VALUES (?, ?, ?, ?, ?)`, [nombre, apellido, hashedPassword, email, estado]
        )
        return usuario.insertId
    },
}

export default AuthModel