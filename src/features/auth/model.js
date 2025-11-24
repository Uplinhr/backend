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
    if (!u) return null;

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
        emailVerified: u.emailVerified,
        num_celular: u.phone,
        rol: mapRoleFromPrisma(u.role),
        id_plan: u.planId || null, // Si se relaciona con Plan
        pictureUrl: u.pictureUrl,
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
            }
        });

        return mapUserToLegacy(u);
    },
    createUsuario: async (userData) => {
        const { 
            nombre, apellido, hashedPassword, email, num_celular, 
            companyName, country, website, linkedin,
            companyEmail, companyPhone, companyAddress, companyTaxId 
        } = userData;

        // Combinar nombre + apellido en name
        const fullName = [nombre, apellido].filter(Boolean).join(' ').trim();

        const result = await prisma.$transaction(async (tx) => {
            // 1. Crear Usuario
            const user = await tx.user.create({
                data: {
                    email: email,
                    password: hashedPassword,
                    name: fullName || null,
                    role: 'CLIENTE',
                    phone: num_celular || null,
                    emailVerified: false, // Asegurar que empieza no verificado
                }
            });

            // 2. Crear UserProfile (Datos personales extra)
            if (country || linkedin) {
                await tx.userProfile.create({
                    data: {
                        userId: user.id,
                        country: country || null,
                        linkedinUrl: linkedin || null,
                    }
                });
            }

            // 3. Crear CompanyProfile (Datos de empresa)
            if (companyName) {
                await tx.companyProfile.create({
                    data: {
                        userId: user.id,
                        companyName: companyName,
                        website: website || null,
                        companyEmail: companyEmail || null,
                        companyPhone: companyPhone || null,
                        address: companyAddress || null,
                        taxId: companyTaxId || null
                    }
                });
            }

            return user;
        });

        return result;
    },

    editPassword: async (id, password) => {
        const updated = await prisma.user.update({
            where: { id },
            data: { password }
        });
        return !!updated;
    },
}

export default authModel

