import pool from '../../database/database.js'

const compra_planModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        `SELECT 
            cp.*,
            CASE 
                WHEN p.id IS NOT NULL THEN 
                    JSON_OBJECT(
                        'id', p.id,
                        'nombre', p.nombre,
                        'creditos_mes', p.creditos_mes,
                        'meses_cred', p.meses_cred,
                        'horas_cons', p.horas_cons,
                        'precio', p.precio,
                        'active', p.active,
                        'fecha_alta', p.fecha_alta,
                        'ultima_mod', p.ultima_mod
                    )
                ELSE NULL 
            END AS plan,
            CASE 
                WHEN u.id IS NOT NULL THEN 
                    JSON_OBJECT(
                        'id', u.id,
                        'nombre', u.nombre,
                        'apellido', u.apellido,
                        'email', u.email,
                        'fecha_alta', u.fecha_alta,
                        'active', u.active,
                        'num_celular', u.num_celular,
                        'rol', u.rol
                    )
                ELSE NULL 
            END AS usuario
            FROM compra_planes cp
            LEFT JOIN planes p ON cp.id_plan = p.id
            LEFT JOIN usuarios u ON cp.id_usuario = u.id;`
    );
    return rows || null
    },
    getCompra_PlanById: async (id) => {
        const [rows] = await pool.query(
            `SELECT 
            cp.*,
            CASE 
                WHEN p.id IS NOT NULL THEN 
                    JSON_OBJECT(
                        'id', p.id,
                        'nombre', p.nombre,
                        'creditos_mes', p.creditos_mes,
                        'meses_cred', p.meses_cred,
                        'horas_cons', p.horas_cons,
                        'precio', p.precio,
                        'active', p.active,
                        'fecha_alta', p.fecha_alta,
                        'ultima_mod', p.ultima_mod
                    )
                ELSE NULL 
            END AS plan,
            CASE 
                WHEN u.id IS NOT NULL THEN 
                    JSON_OBJECT(
                        'id', u.id,
                        'nombre', u.nombre,
                        'apellido', u.apellido,
                        'email', u.email,
                        'fecha_alta', u.fecha_alta,
                        'active', u.active,
                        'num_celular', u.num_celular,
                        'rol', u.rol
                    )
                ELSE NULL 
            END AS usuario
            FROM compra_planes cp
            LEFT JOIN planes p ON cp.id_plan = p.id
            LEFT JOIN usuarios u ON cp.id_usuario = u.id
            WHERE cp.id = ?`, 
            [id]
        );
        return rows[0] || null
    },
    editCompra_PlanById: async (id, plan) => {
        const [result] = await pool.query(
            'UPDATE compra_planes SET medio_pago = ?, observaciones = ?, precio_abonado = ?, id_plan = ?, id_usuario = ? WHERE id = ?',
            [plan.medio_pago, plan.observaciones, plan.precio_abonado, plan.id_plan, plan.id_usuario, id]
        )
        return result.affectedRows > 0
    },
    create: async (medio_pago, observaciones, precio_abonado, id_plan, id_usuario) => {
        const [compra_plan] = await pool.query(
            `INSERT INTO compra_planes (medio_pago, observaciones, precio_abonado, id_plan, id_usuario) 
            VALUES (?, ?, ?, ?, ?)`, [medio_pago, observaciones, precio_abonado, id_plan, id_usuario]
        )
        return compra_plan.insertId
    },
    deleteCompra_PlanById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM compra_planes WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0
    }
}

export default compra_planModel