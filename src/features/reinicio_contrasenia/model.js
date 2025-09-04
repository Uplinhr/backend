import pool from '../../database/database.js'

const reinicio_contraseniaModel = {
    create: async (token, email, fechaExp, idUsuario) => {
        const [result] = await pool.query(
            `INSERT INTO reinicio_contrasenia
            (token, email, fecha_exp, id_usuario)
            VALUES (?, ?, ?, ?)`,
            [token, email, fechaExp, idUsuario]
        )
        return result.insertId
    },
    getByToken: async (token) => {
        const [rows] = await pool.query(
            `SELECT * FROM reinicio_contrasenia 
             WHERE token = ?`,
            [token]
        );
        return rows[0] || null;
    },
    setTokenAsUsed: async (id) => {
        const [result] = await pool.query(
            `UPDATE reinicio_contrasenia SET used = TRUE WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    },
    deleteExpiredTokens: async () => {
        const [result] = await pool.query(
            `DELETE FROM reinicio_contrasenia 
             WHERE fecha_exp <= NOW() OR used = TRUE`,
        );
        return result.affectedRows;
    }
}

export default reinicio_contraseniaModel