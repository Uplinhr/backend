import pool from '../../database/database.js'

const authModel = {
    login: async (email) => {
        const [user] = await pool.query(
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
            LEFT JOIN empresas e ON e.id_usuario = u.id
            WHERE u.email = ?;
            `,
            [email]
        );

        // Filtrado de creditos
        if (user[0] && user[0].creditos) {
            try {
                // Verificar si ya es un objeto, sino, parsear
                let creditos = user[0].creditos;
                if (typeof creditos === 'string') {
                    creditos = JSON.parse(creditos);
                }

                // Solo puede haber un credito de tipo: 'plan'
                const creditosFiltrados = [];
                const planCredits = creditos.filter(c => c && c.tipo_credito === 'plan');
                const otrosCreditos = creditos.filter(c => c && c.tipo_credito !== 'plan');
                if (planCredits.length > 0) {
                    const planMasReciente = planCredits.reduce((latest, current) => {
                        if (!latest) return current;  // en caso de haber un solo credito
                        return new Date(current.fecha_alta) > new Date(latest.fecha_alta) ? current : latest;
                    }, null);
                    creditosFiltrados.push(planMasReciente);
                }
                creditosFiltrados.push(...otrosCreditos);

                user[0].creditos = creditosFiltrados;
            } catch (error) {
                console.error('Error procesando créditos:', error);
                user[0].creditos = [];
            }
        } else if (user[0]) {
            // Si no hay créditos, devuelve un array vacío
            user[0].creditos = [];
        }

        return user[0] || null;
    },
    createUsuario: async (nombre, apellido, hashedPassword, email, num_celular) => {
        const [usuario] = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, contrasenia, email ${num_celular? ', num_celular' : ''})
            VALUES (?, ?, ?, ?${num_celular? ', ?': ''})`, [nombre, apellido, hashedPassword, email, num_celular]
        )
        return usuario.insertId
    },
    editPassword: async (id, password) => {
        const [result] = await pool.query(
            'UPDATE usuarios SET contrasenia = ? WHERE id = ?',
            [password, id]
        )
        return result.affectedRows > 0
    },
}

export default authModel