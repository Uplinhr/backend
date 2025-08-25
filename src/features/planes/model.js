import pool from '../../database/database.js'

const planModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM planes'
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
            'SELECT nombre, creditos_mes, meses_cred, horas_cons, precio, active FROM planes WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    editById: async (id, plan) => {
        const [result] = await pool.query(
            'UPDATE planes SET nombre = ?, creditos_mes = ?, meses_cred = ?, horas_cons = ?, precio = ?, ultima_mod = NOW() WHERE id = ?',
            [plan.nombre, plan.creditos_mes, plan.meses_cred, plan.horas_cons, plan.precio, id]
        )
        return result.affectedRows > 0
    },
    create: async (nombre, creditos_mes, meses_cred, horas_cons, precio) => {
        const [plan] = await pool.query(
            `INSERT INTO planes (nombre, creditos_mes, meses_cred, horas_cons, precio) 
            VALUES (?, ?, ?, ?, ?)`, [nombre, creditos_mes, meses_cred, horas_cons, precio]
        )
        return plan.insertId // SI HAY UN ERROR EN LA CREACION, SE GENERA EL ID IGUAL, CAMBIAR EN EL FUTURO
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM planes WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default planModel