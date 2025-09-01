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
            'SELECT * FROM planes WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    editById: async (id, plan) => {
        const [result] = await pool.query(
            'UPDATE planes SET nombre = ?, creditos_mes = ?, meses_cred = ?, horas_cons = ?, precio = ?, custom = ?, active = ?, ultima_mod = NOW() WHERE id = ?',
            [plan.nombre, plan.creditos_mes, plan.meses_cred, plan.horas_cons, plan.precio, plan.custom, plan.active, id]
        )
        return result.affectedRows > 0
    },
    create: async (nombre, creditos_mes, meses_cred, horas_cons, precio, custom) => {
        const [plan] = await pool.query(
            `INSERT INTO planes (nombre, creditos_mes, meses_cred, horas_cons, precio
            ${custom != null? ', custom' : ''}) 
            VALUES (?, ?, ?, ?, ?${custom != null? ', ?' : ''})`, 
            [nombre, creditos_mes, meses_cred, horas_cons, precio, custom]
        )
        return plan.insertId // SI HAY UN ERROR EN LA CREACION, SE GENERA EL ID IGUAL, CAMBIAR EN EL FUTURO
    },
    enableById: async (id) => {
        const [result] = await pool.query(
            'UPDATE planes SET active = true WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'UPDATE planes SET active = false WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    },
    asignPlan: async (plan, id_usuario) => {
        try{
            const sumarMeses = (meses) => {
                const fecha = new Date();
                fecha.setMonth(fecha.getMonth() + meses);
                return fecha;
            }
            const [creditos] = await pool.query(
                `INSERT INTO creditos (tipo_credito, cantidad, vencimiento, id_usuario) 
                VALUES (?, ?, ?, ?)`, ['plan', plan.creditos_mes, sumarMeses(plan.meses_cred), id_usuario]
            )
            const [consultorias] = await pool.query(
                `INSERT INTO consultorias (horas_totales, horas_restantes, vencimiento, id_usuario) 
                VALUES (?, ?, ?, ?)`, [plan.horas_cons, plan.horas_cons, sumarMeses(1), id_usuario]
            )
            return {
                success: true,
                data: {
                    creditos: creditos.insertId,
                    consultorias: consultorias.insertId
                },
                message: 'Plan asignado correctamente'
            }
        } catch(error){
            console.error('Error en asignPlan:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }
}

export default planModel