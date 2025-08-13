import pool from '../../database/database.js'

const usuarioModel = {
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
    editFullName: async (id, user) => {
        const [rows] = await pool.query(
            'UPDATE usuarios SET nombre = ?, apellido = ? WHERE id = ?',
            [user.nombre, user.apellido, id]
        )
        return rows[0] || null
    },
    editUser: async (user) => {
        const [rows] = await pool.query(
            'UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, estado = ?, rol = ?, id_plan = ? WHERE id = ?',
            [user.nombre, user.apellido, user.email, user.estado, user.rol, user.id_plan, user.id]
        )
        return rows[0] || null
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'UPDATE usuarios SET estado = ? WHERE id = ?',
            ['inactivo', id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default usuarioModel