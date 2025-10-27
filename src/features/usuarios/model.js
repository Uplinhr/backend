import prisma from '../../database/prisma.js'

// Helpers de mapeo entre Prisma.User y estructura legacy
const mapRoleToLegacy = (role) => {
    if (role === 'ADMINISTRADOR') return 'admin';
    return 'cliente';
}

const splitName = (name) => {
    if (!name) return { nombre: null, apellido: null };
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return { nombre: parts[0], apellido: null };
    return { nombre: parts.slice(0, -1).join(' '), apellido: parts.slice(-1).join(' ') };
}

const mapUserToLegacy = (u) => {
    if (!u) return null;
    const { nombre, apellido } = splitName(u.name);
    return {
        id: u.id,
        nombre,
        apellido,
        email: u.email,
        fecha_alta: u.createdAt,
        active: u.deletedAt ? false : true,
        num_celular: null,
        rol: mapRoleToLegacy(u.role),
        // Estructuras relacionadas no existen en Prisma actual: proveer compatibilidad
        plan: {
            id: null,
            nombre: null,
            creditos_mes: null,
            meses_cred: null,
            horas_cons: null,
            precio: null,
            active: null,
            fecha_alta: null,
            ultima_mod: null
        },
        creditos: [],
        consultorias: {
            id: null,
            horas_totales: null,
            horas_restantes: null,
            fecha_alta: null,
            vencimiento: null
        },
        empresas: null
    };
}

const usuarioModel = {
    getAll: async () => {
        const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
        const mapped = users.map(mapUserToLegacy);
        return mapped || null;
    },/*
    getAllActives: async () => {
    const [rows] = await pool.query(
        'SELECT * FROM usuarios WHERE estado = ?', ['activo']
    );
    return rows || null
    },*/
    getById: async (id) => {
        const u = await prisma.user.findUnique({ where: { id } });
        return mapUserToLegacy(u);
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
        
        // Compatibilidad: solo podemos actualizar nombre y num_celular (no existe), así que unimos nombre+apellido
        if (usuario.nombre !== undefined || usuario.apellido !== undefined) {
            const current = await prisma.user.findUnique({ where: { id } });
            const currentParts = splitName(current?.name);
            const newNombre = usuario.nombre ?? currentParts.nombre ?? '';
            const newApellido = usuario.apellido ?? currentParts.apellido ?? '';
            const fullName = [newNombre, newApellido].filter(Boolean).join(' ').trim();
            await prisma.user.update({ where: { id }, data: { name: fullName || null } });
            return true;
        }
        return false
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
        
        // Compatibilidad con Prisma: actualizamos nombre, email y rol
        const data = {};
        if (usuario.nombre !== undefined || usuario.apellido !== undefined) {
            const current = await prisma.user.findUnique({ where: { id } });
            const currentParts = splitName(current?.name);
            const newNombre = usuario.nombre ?? currentParts.nombre ?? '';
            const newApellido = usuario.apellido ?? currentParts.apellido ?? '';
            const fullName = [newNombre, newApellido].filter(Boolean).join(' ').trim();
            data.name = fullName || null;
        }
        if (usuario.email !== undefined) data.email = usuario.email;
        if (usuario.rol !== undefined) data.role = usuario.rol === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE';
        if (Object.keys(data).length === 0) return false;
        await prisma.user.update({ where: { id }, data });
        return true
    },
    enableById: async (id) => {
        await prisma.user.update({ where: { id }, data: { deletedAt: null } });
        return true
    },
    deleteById: async (id) => {
        await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
        return true // Retorna true si realizó la actualización
    }
}

export default usuarioModel