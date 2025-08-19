import pool from '../../database/database.js'

const compra_planModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM compra_planes'
    );
    return rows || null
    },/*
    getAllActives: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM usuarios WHERE estado = ?', ['activo']
    );
    return rows || null
    },*/
    getCompra_PlanById: async (id) => {
        const [rows] = await pool.query(
            'SELECT fecha_compra, medio_pago, observaciones, id_plan FROM compra_planes WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    editCompra_PlanById: async (id, plan) => {
        const [result] = await pool.query(
            'UPDATE compra_planes SET medio_pago = ?, observaciones = ?, id_plan = ? WHERE id = ?',
            [plan.medio_pago, plan.observaciones, plan.id_plan, id]
        )
        return result.affectedRows > 0
    },
    create: async (medio_pago, observaciones, id_plan) => {
        const [compra_plan] = await pool.query(
            `INSERT INTO compra_planes (medio_pago, observaciones, id_plan) 
            VALUES (?, ?, ?)`, [medio_pago, observaciones, id_plan]
        )
        return compra_plan.insertId
    },
    deleteCompra_PlanById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM compra_planes WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default compra_planModel