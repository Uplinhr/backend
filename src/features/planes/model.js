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
    getPlanById: async (id) => {
        const [rows] = await pool.query(
            'SELECT nombre, creditos_mes, meses_cred, horas_cons, precio, estado FROM planes WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    editPlanById: async (id, plan) => {
        const [rows] = await pool.query(
            'UPDATE planes SET nombre = ?, creditos_mes = ?, meses_cred = ?, horas_cons = ?, precio = ?, estado = ? WHERE id = ?',
            [plan.nombre, plan.creditos_mes, plan.meses_cred, plan.horas_cons, plan.precio, plan.estado, id]
        )
        return rows[0] || null
    },
    createPlan: async (nombre, creditos_mes, meses_cred, horas_cons, precio, estado) => {
        const [plan] = await pool.query(
            `INSERT INTO planes (nombre, creditos_mes, meses_cred, horas_cons, precio, estado) 
            VALUES (?, ?, ?, ?, ?, ?)`, [nombre, creditos_mes, meses_cred, horas_cons, precio, estado]
        )
        return plan.insertId // SI HAY UN ERROR EN LA CREACION, SE GENERA EL ID IGUAL, CAMBIAR EN EL FUTURO
    },
    deletePlanById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM planes WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default planModel