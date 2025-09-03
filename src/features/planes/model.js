import pool from '../../database/database.js'

const planModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM planes'
    );
    return rows || null
    },
    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM planes WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    editById: async (id, plan) => {
        const campos = [];
        const valores = [];
        
        if (plan.nombre !== undefined) {
            campos.push('nombre = ?');
            valores.push(plan.nombre);
        }
        
        if (plan.creditos_mes !== undefined) {
            campos.push('creditos_mes = ?');
            valores.push(plan.creditos_mes);
        }
        
        if (plan.meses_cred !== undefined) {
            campos.push('meses_cred = ?');
            valores.push(plan.meses_cred);
        }
        
        if (plan.horas_cons !== undefined) {
            campos.push('horas_cons = ?');
            valores.push(plan.horas_cons);
        }
        
        if (plan.precio !== undefined) {
            campos.push('precio = ?');
            valores.push(plan.precio);
        }
        
        if (plan.custom !== undefined) {
            campos.push('custom = ?');
            valores.push(plan.custom);
        }
        
        if (plan.active !== undefined) {
            campos.push('active = ?');
            valores.push(plan.active);
        }
        
        campos.push('ultima_mod = NOW()');
        
        // Obligatorio para el WHERE
        valores.push(id);
        
        if (campos.length === 0) {
            return false; // En caso de no tener nada que actualizar
        }
        
        const query = `UPDATE planes SET ${campos.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, valores);
        return result.affectedRows > 0
    },
    create: async (nombre, creditos_mes, meses_cred, horas_cons, precio, custom) => {
        const [plan] = await pool.query(
            `INSERT INTO planes (nombre, creditos_mes, meses_cred, horas_cons, precio
            ${custom != null? ', custom' : ''}) 
            VALUES (?, ?, ?, ?, ?${custom != null? ', ?' : ''})`, 
            [nombre, creditos_mes, meses_cred, horas_cons, precio, custom]
        )
        return plan.insertId
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
        return result.affectedRows > 0
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
            // Eliminar el crédito creado si falla la consultoría
            if (creditos && creditos.insertId) {
                await pool.query('DELETE FROM creditos WHERE id = ?', [creditos.insertId]);
            }
            if (consultorias && consultorias.insertId) {
                await pool.query('DELETE FROM consultorias WHERE id = ?', [consultorias.insertId]);
            }
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }
}

export default planModel