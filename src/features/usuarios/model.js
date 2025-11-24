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
    
    // Encontrar plan activo
    const activePlanRelation = u.plans?.find(p => p.isActive);
    const activePlan = activePlanRelation?.plan;

    return {
        id: u.id,
        nombre,
        apellido,
        email: u.email,
        fecha_alta: u.createdAt,
        active: u.deletedAt ? false : true,
        num_celular: u.phone,
        rol: mapRoleToLegacy(u.role),
        pictureUrl: u.pictureUrl,
        // Datos de perfil y empresa
        profile: u.profile ? {
            country: u.profile.country,
            linkedinUrl: u.profile.linkedinUrl,
        } : null,
        company: u.company ? {
            companyName: u.company.companyName,
            companyEmail: u.company.companyEmail,
            companyPhone: u.company.companyPhone,
            taxId: u.company.taxId,
            address: u.company.address,
            website: u.company.website,
            country: u.company.country,
        } : null,
        // Plan activo
        plan: activePlan ? {
            id: activePlan.id,
            nombre: activePlan.name,
            creditos_mes: activePlan.features?.credits || 0, // Asumiendo estructura de features
            meses_cred: 1,
            horas_cons: activePlan.features?.hours || 0,
            precio: activePlan.price,
            active: activePlanRelation.isActive,
            fecha_alta: activePlanRelation.startDate,
            ultima_mod: activePlanRelation.updatedAt
        } : {
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
        const users = await prisma.user.findMany({ 
            orderBy: { createdAt: 'desc' },
            include: { 
                profile: true, 
                company: true,
                plans: {
                    include: { plan: true }
                }
            } 
        });
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
        const u = await prisma.user.findUnique({ 
            where: { id },
            include: { 
                profile: true, 
                company: true,
                plans: {
                    include: { plan: true }
                }
            }
        });
        return mapUserToLegacy(u);
    },
    editOwn: async (id, usuario) => {
        // usuario trae: nombre, apellido, num_celular, linkedin, country, companyName, website, companyEmail, companyPhone, companyAddress, companyTaxId
        
        try {
            await prisma.$transaction(async (tx) => {
                // 1. Actualizar User (nombre, apellido -> name, num_celular -> phone)
                const dataUser = {};
                if (usuario.nombre !== undefined || usuario.apellido !== undefined) {
                    const current = await tx.user.findUnique({ where: { id } });
                    const currentParts = splitName(current?.name);
                    const newNombre = usuario.nombre ?? currentParts.nombre ?? '';
                    const newApellido = usuario.apellido ?? currentParts.apellido ?? '';
                    const fullName = [newNombre, newApellido].filter(Boolean).join(' ').trim();
                    dataUser.name = fullName || null;
                }
                if (usuario.num_celular !== undefined) {
                    dataUser.phone = usuario.num_celular;
                }
                if (usuario.email !== undefined) {
                    const current = await tx.user.findUnique({ where: { id } });
                    if (current.email !== usuario.email) {
                        // Check if email is already taken
                        const existing = await tx.user.findUnique({ where: { email: usuario.email } });
                        if (existing && existing.id !== id) { // Ensure it's not the current user's email
                            throw new Error('El email ya está en uso por otro usuario.');
                        }
                        dataUser.email = usuario.email;
                        dataUser.emailVerified = false;
                    }
                }
                
                if (Object.keys(dataUser).length > 0) {
                    await tx.user.update({ where: { id }, data: dataUser });
                }

                // 2. Actualizar/Crear UserProfile (linkedin, country, etc)
                // Mapeo de campos frontend -> backend UserProfile
                const dataProfile = {};
                if (usuario.linkedin !== undefined) dataProfile.linkedinUrl = usuario.linkedin;
                if (usuario.country !== undefined) dataProfile.country = usuario.country;
                // Agregar otros campos si vienen del front (address, city, etc)
                
                if (Object.keys(dataProfile).length > 0) {
                    await tx.userProfile.upsert({
                        where: { userId: id },
                        create: { userId: id, ...dataProfile },
                        update: dataProfile
                    });
                }

                // 3. Actualizar/Crear CompanyProfile
                const dataCompany = {};
                if (usuario.companyName !== undefined) dataCompany.companyName = usuario.companyName;
                if (usuario.website !== undefined) dataCompany.website = usuario.website;
                if (usuario.companyEmail !== undefined) dataCompany.companyEmail = usuario.companyEmail;
                if (usuario.companyPhone !== undefined) dataCompany.companyPhone = usuario.companyPhone;
                if (usuario.companyAddress !== undefined) dataCompany.address = usuario.companyAddress;
                if (usuario.companyTaxId !== undefined) dataCompany.taxId = usuario.companyTaxId;
                if (usuario.country !== undefined) dataCompany.country = usuario.country; // Asumimos sync de país

                if (Object.keys(dataCompany).length > 0) {
                    // CompanyProfile requiere companyName obligatorio en create. 
                    // Si no existe y no viene companyName, no podemos crear.
                    // Verificamos si existe primero o si viene companyName.
                    const existingCompany = await tx.companyProfile.findUnique({ where: { userId: id } });
                    
                    if (existingCompany) {
                        await tx.companyProfile.update({
                            where: { userId: id },
                            data: dataCompany
                        });
                    } else if (dataCompany.companyName) {
                        await tx.companyProfile.create({
                            data: { userId: id, ...dataCompany }
                        });
                    }
                }
            });

            // Fetch and return the updated user with relations
            const updatedUser = await prisma.user.findUnique({
                where: { id },
                include: {
                    profile: true,
                    company: true,
                    plans: {
                        include: {
                            plan: true
                        }
                    }
                }
            });
            
            return mapUserToLegacy(updatedUser);
        } catch (error) {
            console.error("Error en editOwn:", error);
            return false;
        }
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