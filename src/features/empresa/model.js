import pool from '../../database/database.js'

const empresaModel = {
    getAll: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM empresas'
    );
    return rows || null
    },
    getById: async (id) => {
        const [rows] = await pool.query(
            'SELECT * FROM empresas WHERE id = ?', 
            [id]
        );
        return rows[0] || null
    },
    editById: async (id, empresa) => {
        const campos = [];
        const valores = [];
        
        // Campos obligatorios
        if (empresa.nombre) {
            campos.push('nombre = ?');
            valores.push(empresa.nombre);
        }
        
        if (empresa.email) {
            campos.push('email = ?');
            valores.push(empresa.email);
        }
        
        // Campos opcionales
        if (empresa.nombre_fantasia !== undefined) {
            campos.push('nombre_fantasia = ?');
            valores.push(empresa.nombre_fantasia);
        }
        
        if (empresa.cuit !== undefined) {
            campos.push('cuit = ?');
            valores.push(empresa.cuit);
        }
        
        if (empresa.condicion_iva !== undefined) {
            campos.push('condicion_iva = ?');
            valores.push(empresa.condicion_iva);
        }
        
        if (empresa.tipo_societario !== undefined) {
            campos.push('tipo_societario = ?');
            valores.push(empresa.tipo_societario);
        }
        
        if (empresa.actividad_principal !== undefined) {
            campos.push('actividad_principal = ?');
            valores.push(empresa.actividad_principal);
        }
        
        if (empresa.domicilio_legal_calle_numero !== undefined) {
            campos.push('domicilio_legal_calle_numero = ?');
            valores.push(empresa.domicilio_legal_calle_numero);
        }
        
        if (empresa.domicilio_legal_ciudad !== undefined) {
            campos.push('domicilio_legal_ciudad = ?');
            valores.push(empresa.domicilio_legal_ciudad);
        }
        
        if (empresa.domicilio_legal_pais !== undefined) {
            campos.push('domicilio_legal_pais = ?');
            valores.push(empresa.domicilio_legal_pais);
        }
        
        if (empresa.codigo_postal !== undefined) {
            campos.push('codigo_postal = ?');
            valores.push(empresa.codigo_postal);
        }

        if (empresa.id_usuario !== undefined) {
            campos.push('id_usuario = ?');
            valores.push(empresa.id_usuario);
        }

        if (empresa.active !== undefined) {
            campos.push('active = ?');
            valores.push(empresa.active);
        }
        
        campos.push('ultima_mod = NOW()');
        
        // Obligatorio para el WHERE
        valores.push(id);
        
        if (campos.length === 0) {
            return false; // En caso de no tener nada que actualizar
        }
        
        const query = `UPDATE empresas SET ${campos.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, valores);
        return result.affectedRows > 0;
    },
    editOwn: async (empresa) => {
        const campos = [];
        const valores = [];
        
        // Campos obligatorios
        if (empresa.nombre) {
            campos.push('nombre = ?');
            valores.push(empresa.nombre);
        }
        
        if (empresa.email) {
            campos.push('email = ?');
            valores.push(empresa.email);
        }
        
        // Campos opcionales
        if (empresa.nombre_fantasia !== undefined) {
            campos.push('nombre_fantasia = ?');
            valores.push(empresa.nombre_fantasia);
        }
        
        if (empresa.cuit !== undefined) {
            campos.push('cuit = ?');
            valores.push(empresa.cuit);
        }
        
        if (empresa.condicion_iva !== undefined) {
            campos.push('condicion_iva = ?');
            valores.push(empresa.condicion_iva);
        }
        
        if (empresa.tipo_societario !== undefined) {
            campos.push('tipo_societario = ?');
            valores.push(empresa.tipo_societario);
        }
        
        if (empresa.actividad_principal !== undefined) {
            campos.push('actividad_principal = ?');
            valores.push(empresa.actividad_principal);
        }
        
        if (empresa.domicilio_legal_calle_numero !== undefined) {
            campos.push('domicilio_legal_calle_numero = ?');
            valores.push(empresa.domicilio_legal_calle_numero);
        }
        
        if (empresa.domicilio_legal_ciudad !== undefined) {
            campos.push('domicilio_legal_ciudad = ?');
            valores.push(empresa.domicilio_legal_ciudad);
        }
        
        if (empresa.domicilio_legal_pais !== undefined) {
            campos.push('domicilio_legal_pais = ?');
            valores.push(empresa.domicilio_legal_pais);
        }
        
        if (empresa.codigo_postal !== undefined) {
            campos.push('codigo_postal = ?');
            valores.push(empresa.codigo_postal);
        }
        
        campos.push('ultima_mod = NOW()');
        
        // Obligatorio para el WHERE
        valores.push(empresa.id_usuario);
        
        if (campos.length === 0) {
            return false; // En caso de no tener nada que actualizar
        }
        
        const query = `UPDATE empresas SET ${campos.join(', ')} WHERE id_usuario = ?`;
        const [result] = await pool.query(query, valores);
        return result.affectedRows > 0;
    },
    create: async (empresa) => {
        const { nombre, email, id_usuario, ...camposOpcionales } = empresa;
        
        const [result] = await pool.query(
            `INSERT INTO empresas 
            (nombre, email, id_usuario, nombre_fantasia, cuit, condicion_iva, 
             tipo_societario, actividad_principal, domicilio_legal_calle_numero,
             domicilio_legal_ciudad, domicilio_legal_pais, codigo_postal) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                nombre, 
                email, 
                id_usuario,
                camposOpcionales.nombre_fantasia || null,
                camposOpcionales.cuit || null,
                camposOpcionales.condicion_iva || null,
                camposOpcionales.tipo_societario || null,
                camposOpcionales.actividad_principal || null,
                camposOpcionales.domicilio_legal_calle_numero || null,
                camposOpcionales.domicilio_legal_ciudad || null,
                camposOpcionales.domicilio_legal_pais || null,
                camposOpcionales.codigo_postal || null
            ]
        );
        return result.affectedRows > 0 ? result.insertId : false;
    },
    enableById: async (id) => {
        const [result] = await pool.query(
            'UPDATE empresas SET active = true WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0
    },
    deleteById: async (id) => {
        const [result] = await pool.query(
            'UPDATE empresas SET active = false WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0
    },
    unlinkUserById: async (id) => {
        const [result] = await pool.query(
            'UPDATE empresas SET id_usuario = null WHERE id = ?',
            [id]
        )
        return result.affectedRows > 0
    }
}

export default empresaModel