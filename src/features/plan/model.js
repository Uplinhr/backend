import pool from '../../database/database.js'

const planModel = {
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
            'SELECT nombre, email, apellido, fecha_alta, estado, rol, id_plan FROM usuarios WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM usuarios WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default planModel