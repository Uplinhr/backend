import pool from '../../database/database.js'

const authModel = {
    login: async (email) => {
        const [user] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ?', //posiblemente no deba enviar todo
            [email]
        );
        return user[0] || null
    },
    createUsuario: async (nombre, apellido, hashedPassword, email) => {
        const [usuario] = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, contrasenia, email)
            VALUES (?, ?, ?, ?)`, [nombre, apellido, hashedPassword, email]
        )
        return usuario.insertId
    },
    editPassword: async (id, password) => {
        const [result] = await pool.query(
            'UPDATE usuarios SET contrasenia = ? WHERE id = ?',
            [password, id]
        )
        return result.affectedRows > 0
    },
}

export default authModel