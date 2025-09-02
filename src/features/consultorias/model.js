import pool from '../../database/database.js'

const consultoriaModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        `SELECT 
            cons.*,
            COALESCE(
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
            ) AS consultas
        FROM consultorias cons`
    );
    return rows || null
    },
    getById: async (id) => {
        const [rows] = await pool.query(
            `SELECT 
                cons.*,
                COALESCE(
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
                ) AS consultas
            FROM consultorias cons
            WHERE cons.id = ?`, 
            [id]
        );
        return rows[0] || null
    },
    getOwn: async (id) => {
        const [rows] = await pool.query(
            `SELECT 
                cons.*,
                COALESCE(
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
                ) AS consultas
            FROM consultorias cons
            WHERE cons.id_usuario = ? 
            AND (cons.vencimiento IS NULL OR cons.vencimiento > NOW())
            ORDER BY cons.fecha_alta DESC 
            LIMIT 1`,
            [id]
        );
        return rows[0] || null
    },
    editById: async (id, consultoria) => {
        const [result] = await pool.query(
            'UPDATE consultorias SET horas_totales = ?, horas_restantes = ?, vencimiento = ?, id_usuario = ? WHERE id = ?',
            [consultoria.horas_totales, consultoria.horas_restantes, consultoria.vencimiento, consultoria.id_usuario, id]
        )
        return result.affectedRows > 0
    },
    create: async (horas_totales, horas_restantes, vencimiento, id_usuario) => {
        const [consultoria] = await pool.query(
            `INSERT INTO consultorias (horas_totales, horas_restantes, vencimiento, id_usuario) 
            VALUES (?, ?, ?, ?)`, [horas_totales, horas_restantes, vencimiento, id_usuario]
        )
        return consultoria.insertId
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM consultorias WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0
    }
}

export default consultoriaModel