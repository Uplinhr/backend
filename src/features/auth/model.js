import pool from '../../database/database.js'

const authModel = {
    login: async (email) => {
        const [user] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?', //posiblemente no deba enviar todo
            [email]
        );
        return user[0] || null
    },
    create: async (nombre, apellido, hashedPassword, email) => {
        const [usuario] = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, contrasenia, email)
            VALUES (?, ?, ?, ?)`, [nombre, apellido, hashedPassword, email]
        )
        return usuario.insertId
    },
    editPassword: async (id, password) => {
        const [rows] = await pool.query(
            'UPDATE usuarios SET contrasenia = ? WHERE id = ?',
            [password, id]
        )
        return rows
    },
}

export default authModel