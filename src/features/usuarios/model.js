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
                        FROM creditos c
                        WHERE c.id_usuario = u.id
                        AND (c.vencimiento IS NULL OR c.vencimiento > NOW())
                        AND (c.tipo_credito != 'plan' OR c.id = (
                            SELECT c2.id 
                            FROM creditos c2 
                            WHERE c2.id_usuario = u.id 
                            AND c2.tipo_credito = 'plan' 
                            ORDER BY c2.fecha_alta DESC 
                            LIMIT 1
                        ))
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
            LEFT JOIN consultorias cons ON cons.id_usuario = u.id 
                AND cons.vencimiento > NOW()
                AND cons.fecha_alta = (
                    SELECT MAX(cons2.fecha_alta) 
                    FROM consultorias cons2 
                    WHERE cons2.id_usuario = u.id 
                    AND cons2.vencimiento > NOW()
                )
            LEFT JOIN empresas e ON e.id_usuario = u.id`
        );

        // Filtrado de créditos de plan viejos por cada usuario
        if (rows && rows.length > 0) {
            for (const user of rows) {
                if (user.creditos) {
                    try {
                        let creditos = user.creditos;

                        // Verificar si ya es objeto o necesita parseo
                        if (typeof creditos === 'string') {
                            creditos = JSON.parse(creditos);
                        }

                        // Filtrar creditos de plan viejos
                        const creditosFiltrados = [];
                        const planCredits = creditos.filter(c => c && c.tipo_credito === 'plan');
                        const otrosCreditos = creditos.filter(c => c && c.tipo_credito !== 'plan');
                        if (planCredits.length > 0) {
                            const planMasReciente = planCredits.reduce((latest, current) => {
                                if (!latest) return current;
                                return new Date(current.fecha_alta) > new Date(latest.fecha_alta) ? current : latest;
                            }, null);
                            creditosFiltrados.push(planMasReciente);
                        }
                        creditosFiltrados.push(...otrosCreditos);
                        user.creditos = creditosFiltrados;
                    } catch (error) {
                        console.error('Error procesando créditos para usuario:', user.id, error);
                        user.creditos = [];
                    }
                } else {
                    user.creditos = [];
                }
            }
        }
        return rows || null;
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
                        FROM creditos c
                        WHERE c.id_usuario = u.id
                        AND (c.vencimiento IS NULL OR c.vencimiento >= CURRENT_DATE())
                        AND (c.tipo_credito != 'plan' OR c.id = (
                            SELECT c2.id 
                            FROM creditos c2 
                            WHERE c2.id_usuario = u.id 
                            AND c2.tipo_credito = 'plan'
                            AND (c2.vencimiento IS NULL OR c2.vencimiento >= CURRENT_DATE())
                            ORDER BY c2.fecha_alta DESC 
                            LIMIT 1
                        ))
                    ),
                    JSON_ARRAY()
                ) AS creditos,
                    
                COALESCE(
                    (
                        SELECT JSON_OBJECT(
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
                        FROM consultorias cons
                        WHERE cons.id_usuario = u.id
                        AND (cons.vencimiento IS NULL OR cons.vencimiento >= CURRENT_DATE())
                        AND cons.id = (
                            SELECT cons2.id
                            FROM consultorias cons2
                            WHERE cons2.id_usuario = u.id
                            AND (cons2.vencimiento IS NULL OR cons2.vencimiento >= CURRENT_DATE())
                            ORDER BY cons2.fecha_alta DESC
                            LIMIT 1
                        )
                    ),
                    JSON_OBJECT()
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

        if (rows[0]) {
            const user = rows[0];
            // Filtrar creditos de plan viejos
            if (user.creditos.length > 0) {
                try {
                    let creditos = user.creditos;
                    //Verificar si necesita parseo
                    if (typeof creditos === 'string') {
                        creditos = JSON.parse(creditos);
                    }
                    const creditosFiltrados = [];
                    const planCredits = creditos.filter(c => c && c.tipo_credito === 'plan');
                    const otrosCreditos = creditos.filter(c => c && c.tipo_credito !== 'plan');
                    if (planCredits.length > 0) {
                        const planMasReciente = planCredits.reduce((latest, current) => {
                            if (!latest) return current;
                            return new Date(current.fecha_alta) > new Date(latest.fecha_alta) ? current : latest;
                        }, null);
                        creditosFiltrados.push(planMasReciente);
                    }
                    creditosFiltrados.push(...otrosCreditos);
                    user.creditos = creditosFiltrados;
                } catch (error) {
                    console.error('Error procesando créditos para usuario:', user.id, error);
                    user.creditos = [];
                }
            } else {
                user.creditos = [];
            }
        }
        return rows[0] || null;
    },
    editOwn: async (id, usuario) => {
        const campos = [];
        const valores = [];
        
        if (usuario.nombre !== undefined) {
            campos.push('nombre = ?');
            valores.push(nombre);
        }
        
        if (usuario.apellido !== undefined) {
            campos.push('apellido = ?');
            valores.push(apellido);
        }

        if (usuario.num_celular !== undefined) {
            campos.push('num_celular = ?');
            valores.push(num_celular);
        }
        
        // Obligatorio para el WHERE
        valores.push(id);
        
        if (campos.length === 0) {
            return false; // En caso de no tener nada que actualizar
        }
        
        const query = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, valores);
        return result.affectedRows > 0
    },
    editById: async (id, usuario) => {
        const campos = [];
        const valores = [];
        
        if (usuario.nombre !== undefined) {
            campos.push('nombre = ?');
            valores.push(usuario.nombre);
        }
        
        if (usuario.apellido !== undefined) {
            campos.push('apellido = ?');
            valores.push(usuario.apellido);
        }
        
        if (usuario.email !== undefined) {
            campos.push('email = ?');
            valores.push(usuario.email);
        }
        
        if (usuario.active !== undefined) {
            campos.push('active = ?');
            valores.push(usuario.active);
        }
        
        if (usuario.rol !== undefined) {
            campos.push('rol = ?');
            valores.push(usuario.rol);
        }
        
        if (usuario.num_celular !== undefined) {
            campos.push('num_celular = ?');
            valores.push(usuario.num_celular);
        }
        
        if (usuario.id_plan !== undefined) {
            campos.push('id_plan = ?');
            valores.push(usuario.id_plan);
        }
        
        // Obligatorio para el WHERE
        valores.push(id);
        
        if (campos.length === 0) {
            return false; // En caso de no tener nada que actualizar
        }
        
        const query = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, valores);
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