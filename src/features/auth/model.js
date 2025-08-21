import pool from '../../database/database.js'

const authModel = {
    login: async (email) => {
        const [user] = await pool.query(
            `SELECT 
            u.*,
            JSON_OBJECT(
                'id', p.id,
                'nombre', p.nombre,
                'creditos_mes', p.creditos_mes,
                'meses_cred', p.meses_cred,
                'horas_cons', p.horas_cons,
                'precio', p.precio
                ) AS plan,
            JSON_OBJECT(
                'id', c.id,
                'tipo_credito', c.tipo_credito,
                'cantidad', c.cantidad,
                'vencimiento', c.vencimiento
            ) AS creditos,
            JSON_OBJECT(
                'id', cons.id,
                'horas_totales', cons.horas_totales,
                'horas_restantes', cons.horas_restantes,
                'fecha_asignacion', cons.fecha_asignacion,
                'vencimiento', cons.vencimiento
            ) AS consultorias,
            JSON_OBJECT(
                'id', e.id,
                'nombre', e.nombre,
                'email', e.email
            ) AS empresas
            FROM usuarios u
            LEFT JOIN planes p ON u.id_plan = p.id
            LEFT JOIN creditos c ON c.id_usuario = u.id
            LEFT JOIN consultorias cons ON cons.id_usuario = u.id
            LEFT JOIN empresas e ON e.id_usuario = u.id
            WHERE u.email = ?;
            `,
            [email]
        );
        return user[0] || null
    },
    createUsuario: async (nombre, apellido, hashedPassword, email) => {
        const [usuario] = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, contrasenia, email)
            VALUES (?, ?, ?, ?)`, [nombre, apellido, hashedPassword, email]
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