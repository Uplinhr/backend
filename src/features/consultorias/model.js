import pool from '../../database/database.js'

const consultoriaModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM consultorias'
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
            'SELECT horas_totales, horas_restantes, fecha_asignacion, vencimiento, id_usuario FROM consultorias WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    getOwn: async (id) => {
        const [rows] = await pool.query(
            'SELECT horas_totales, horas_restantes, fecha_asignacion, vencimiento, id FROM consultorias WHERE id_usuario = ?', 
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
        return consultoria.insertId // SI HAY UN ERROR EN LA CREACION, SE GENERA EL ID IGUAL, CAMBIAR EN EL FUTURO
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'DELETE FROM consultorias WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0 // Retorna true si eliminó algún registro
    }
}

export default consultoriaModel