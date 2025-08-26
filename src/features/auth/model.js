import pool from '../../database/database.js'

const authModel = {
    login: async (email) => {
        const [user] = await pool.query(
            `SELECT 
                u.*,
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
                    ),
                    JSON_ARRAY()
                ) AS creditos,
                    
                CASE 
                    WHEN cons.id IS NOT NULL THEN 
                        JSON_OBJECT(
                            'id', cons.id,
                            'horas_totales', cons.horas_totales,
                            'horas_restantes', cons.horas_restantes,
                            'fecha_alta', cons.fecha_alta,
                            'vencimiento', cons.vencimiento
                        )
                    ELSE NULL 
                END AS consultorias,
                    
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
            LEFT JOIN empresas e ON e.id_usuario = u.id
            WHERE u.email = ?;
            `,
            [email]
        );
        return user[0] || null
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