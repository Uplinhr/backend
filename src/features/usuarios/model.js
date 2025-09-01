import pool from '../../database/database.js'

const usuarioModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        `SELECT 
            u.id,
            u.nombre,
            u.apellido,
            u.email,
            u.fecha_alta,
            u.active,
            u.num_celular,
            u.rol,
            COALESCE(
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
                ),
                JSON_OBJECT(
                    'id', NULL,
                    'nombre', NULL,
                    'creditos_mes', NULL,
                    'meses_cred', NULL,
                    'horas_cons', NULL,
                    'precio', NULL,
                    'active', NULL,
                    'fecha_alta', NULL,
                    'ultima_mod', NULL
                )
            ) AS plan,
                
            COALESCE(
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', c.id,
                            'tipo_credito', c.tipo_credito,
                            'cantidad', c.cantidad,
                            'vencimiento', c.vencimiento,
                            'fecha_alta', c.fecha_alta
                        )
                    )
                    FROM (
                        SELECT c1.*,
                               ROW_NUMBER() OVER (
                                   PARTITION BY c1.id_usuario, c1.tipo_credito 
                                   ORDER BY 
                                       CASE WHEN c1.tipo_credito = 'plan' THEN 0 ELSE 1 END,
                                       c1.fecha_alta DESC
                               ) as row_num
                        FROM creditos c1 
                        WHERE c1.id_usuario = u.id
                        AND c1.vencimiento > NOW()
                    ) c
                    WHERE c.row_num = 1 OR c.tipo_credito != 'plan'
                ),
                JSON_ARRAY()
            ) AS creditos,
                
            COALESCE(
                JSON_OBJECT(
                    'id', cons.id,
                    'horas_totales', cons.horas_totales,
                    'horas_restantes', cons.horas_restantes,
                    'fecha_alta', cons.fecha_alta,
                    'vencimiento', cons.vencimiento
                ),
                JSON_OBJECT(
                    'id', NULL,
                    'horas_totales', NULL,
                    'horas_restantes', NULL,
                    'fecha_alta', NULL,
                    'vencimiento', NULL
                )
            ) AS consultorias,
                
            CASE 
                WHEN e.id IS NOT NULL THEN 
                    JSON_OBJECT(
                        'id', e.id,
                        'nombre', e.nombre,
                        'email', e.email,
                        'active', e.active,
                        'fecha_alta', e.fecha_alta,
                        'ultima_mod', e.ultima_mod
                    )
                ELSE NULL 
            END AS empresas
                    
            FROM usuarios u
            LEFT JOIN planes p ON u.id_plan = p.id
            LEFT JOIN (
                SELECT c1.*
                FROM consultorias c1
                WHERE c1.vencimiento > NOW()
                AND c1.id = (
                    SELECT c2.id
                    FROM consultorias c2
                    WHERE c2.id_usuario = c1.id_usuario
                    AND c2.vencimiento > NOW()
                    ORDER BY c2.fecha_alta DESC  -- ← Ordenar por fecha_alta para la más reciente
                    LIMIT 1
                )
            ) cons ON cons.id_usuario = u.id
            LEFT JOIN empresas e ON e.id_usuario = u.id`
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
            `SELECT 
                u.*,
                COALESCE(
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
                    ),
                    JSON_OBJECT(
                        'id', NULL,
                        'nombre', NULL,
                        'creditos_mes', NULL,
                        'meses_cred', NULL,
                        'horas_cons', NULL,
                        'precio', NULL,
                        'active', NULL,
                        'fecha_alta', NULL,
                        'ultima_mod', NULL
                    )
                ) AS plan,
                    
                COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', c.id,
                                'tipo_credito', c.tipo_credito,
                                'cantidad', c.cantidad,
                                'vencimiento', c.vencimiento,
                                'fecha_alta', c.fecha_alta,
                                'busquedas', COALESCE(
                                    (
                                        SELECT JSON_ARRAYAGG(
                                            JSON_OBJECT(
                                                'id', b.id,
                                                'fecha_alta', b.fecha_alta,
                                                'ultima_mod', b.ultima_mod,
                                                'info_busqueda', b.info_busqueda,
                                                'creditos_usados', b.creditos_usados,
                                                'observaciones', b.observaciones,
                                                'estado', b.estado
                                            )
                                        )
                                        FROM busquedas b 
                                        WHERE b.id_cred = c.id
                                    ),
                                    JSON_ARRAY()
                                )
                            )
                        )
                        FROM (
                            SELECT c1.*,
                                   ROW_NUMBER() OVER (
                                       PARTITION BY c1.id_usuario, c1.tipo_credito 
                                       ORDER BY 
                                           CASE WHEN c1.tipo_credito = 'plan' THEN 0 ELSE 1 END,
                                           c1.fecha_alta DESC
                                   ) as row_num
                            FROM creditos c1 
                            WHERE c1.id_usuario = u.id
                            AND (c1.vencimiento IS NULL OR c1.vencimiento >= CURRENT_DATE())
                        ) c
                        WHERE (c.row_num = 1 AND c.tipo_credito = 'plan') OR c.tipo_credito != 'plan'
                    ),
                    JSON_ARRAY()
                ) AS creditos,
                    
                COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'id', cons.id,
                                'horas_totales', cons.horas_totales,
                                'horas_restantes', cons.horas_restantes,
                                'fecha_alta', cons.fecha_alta,
                                'vencimiento', cons.vencimiento,
                                'consultas', COALESCE(
                                    (
                                        SELECT JSON_ARRAYAGG(
                                            JSON_OBJECT(
                                                'id', cc.id,
                                                'fecha_alta', cc.fecha_alta,
                                                'ultima_mod', cc.ultima_mod,
                                                'comentarios', cc.comentarios,
                                                'cantidad_horas', cc.cantidad_horas,
                                                'observaciones', cc.observaciones,
                                                'estado', cc.estado
                                            )
                                        )
                                        FROM consultas cc
                                        WHERE cc.id_consultoria = cons.id
                                    ),
                                    JSON_ARRAY()
                                )
                            )
                        )
                        FROM (
                            SELECT c1.*,
                                   ROW_NUMBER() OVER (
                                       PARTITION BY c1.id_usuario
                                       ORDER BY c1.fecha_alta DESC
                                   ) as row_num
                            FROM consultorias c1 
                            WHERE c1.id_usuario = u.id
                            AND (c1.vencimiento IS NULL OR c1.vencimiento >= CURRENT_DATE())
                        ) cons
                        WHERE cons.row_num = 1  -- Solo la consultoría más reciente
                    ),
                    JSON_ARRAY()
                ) AS consultorias,
                    
                CASE 
                    WHEN e.id IS NOT NULL THEN 
                        JSON_OBJECT(
                            'id', e.id,
                            'nombre', e.nombre,
                            'email', e.email,
                            'active', e.active,
                            'fecha_alta', e.fecha_alta,
                            'ultima_mod', e.ultima_mod
                        )
                    ELSE NULL 
                END AS empresas
            FROM usuarios u
            LEFT JOIN planes p ON u.id_plan = p.id
            LEFT JOIN empresas e ON e.id_usuario = u.id 
            WHERE u.id = ?;`, 
            [id]
        );
        return rows[0] || null
    },
    editFullName: async (id, nombre, apellido) => {
        console.log(nombre)
        const [result] = await pool.query(
            'UPDATE usuarios SET nombre = ?, apellido = ? WHERE id = ?',
            [nombre, apellido, id]
        )
        return result.affectedRows > 0
    },
    editById: async (id, user) => {
        const [result] = await pool.query(
            `UPDATE usuarios SET 
            nombre = ?, apellido = ?, email = ?, active = ?, rol = ?, num_celular = ?, id_plan = ? 
            WHERE id = ?`,
            [user.nombre, user.apellido, user.email, user.active, user.rol, user.num_celular, user.id_plan, 
            id]
        )
        return result.affectedRows > 0
    },
    enableById: async (id) => {
        const [result] = await pool.query(
            'UPDATE usuarios SET active = true WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'UPDATE usuarios SET active = false WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default usuarioModel