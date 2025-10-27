import prisma from '../../database/prisma.js'

// Mapeo de roles: MySQL (cliente/admin) -> Prisma (CLIENTE/ADMINISTRADOR)
const mapRoleToPrisma = (role) => {
    return role === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE';
}

const mapRoleFromPrisma = (role) => {
    return role === 'ADMINISTRADOR' ? 'admin' : 'cliente';
}

// Mapea User de Prisma a estructura legacy esperada por controller
// Prisma: { id, email, name, password, role, createdAt, updatedAt, deletedAt, planId? }
// Legacy: { id, nombre, apellido, email, contrasenia, fecha_alta, active, num_celular, rol, id_plan, plan(JSON), creditos(JSON), consultorias(JSON), empresas(JSON) }
const mapUserToLegacy = (u) => {
    if (\!u) return null;

    // Parse name -> nombre + apellido
    let nombre = null, apellido = null;
    if (u.name) {
        const parts = String(u.name).trim().split(/\s+/);
        if (parts.length === 1) {
            nombre = parts[0];
        } else {
            nombre = parts.slice(0, -1).join(' ');
            apellido = parts.slice(-1).join(' ');
        }
    }

    return {
        id: u.id,
        nombre,
        apellido,
        email: u.email,
        contrasenia: u.password, // Prisma usa 'password', legacy espera 'contrasenia'
        fecha_alta: u.createdAt,
        active: u.deletedAt ? 0 : 1, // Prisma usa deletedAt, legacy usa active (1/0)
        num_celular: null, // No existe en Prisma por ahora
        rol: mapRoleFromPrisma(u.role),
        id_plan: u.planId || null, // Si se relaciona con Plan
        // Estructuras relacionadas: compatibilidad (null por ahora, ya que no existen en schema)
        plan: JSON.stringify({
            id: null, nombre: null, creditos_mes: null, meses_cred: null,
            horas_cons: null, precio: null, active: null, fecha_alta: null, ultima_mod: null
        }),
        creditos: JSON.stringify([]),
        consultorias: JSON.stringify({
            id: null, horas_totales: null, horas_restantes: null,
            fecha_alta: null, vencimiento: null
        }),
        empresas: null
    };
}

const authModel = {
    login: async (email) => {
        const u = await prisma.user.findFirst({
            where: {
                email: email,
                deletedAt: null // Solo usuarios activos (no soft-deleted)
            },
            include: {
                plan: true // Si se relaciona con Plan
            }
        });

        return mapUserToLegacy(u);
    },
    createUsuario: async (nombre, apellido, hashedPassword, email, num_celular) => {
        // Combinar nombre + apellido en name
        const fullName = [nombre, apellido].filter(Boolean).join(' ').trim();

        const created = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword, // Prisma usa 'password'
                name: fullName || null,
                role: 'CLIENTE', // Default role
                // planId: null por ahora (si se relaciona con Plan)
            }
        });

        return created.id;
    },
    editPassword: async (id, password) => {
        const updated = await prisma.user.update({
            where: { id },
            data: { password }
        });
        return \!\!updated;
    },
}

export default authModel
