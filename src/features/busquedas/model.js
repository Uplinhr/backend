import prisma from '../../database/prisma.js'

// Mapeo de Prisma Search a estructura legacy esperada por controller
// Prisma: { id, creditId, searchInfo, creditsUsed, status, notes, createdAt, updatedAt }
// Legacy: { id, info_busqueda, creditos_usados, observaciones, estado, id_cred, id_tipo, id_proceso, fecha_alta, ultima_mod, usuario(JSON), creditos(JSON) }
const mapSearchToLegacy = (s) => {
    if (\!s) return null;
    
    return {
        id: s.id,
        info_busqueda: s.searchInfo,
        creditos_usados: s.creditsUsed,
        observaciones: s.notes,
        estado: s.status.toLowerCase(),
        id_cred: s.creditId,
        id_tipo: null, // No existe en Prisma
        id_proceso: null, // No existe en Prisma
        fecha_alta: s.createdAt,
        ultima_mod: s.updatedAt,
        // Estructuras relacionadas: compatibilidad
        usuario: null, // Se obtendría del credit.user si se necesita
        creditos: null // Se obtendría del credit si se necesita
    };
}

const busquedaModel = {
    getAll: async () => {
        const searches = await prisma.search.findMany({
            include: {
                credit: {
                    include: {
                        user: {
                            select: { id: true, nombre: true, apellido: true, email: true, fecha_alta: true, rol: true, num_celular: true, active: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        return searches.map(s => ({
            ...mapSearchToLegacy(s),
            usuario: s.credit?.user ? {
                id: s.credit.user.id,
                nombre: s.credit.user.nombre,
                apellido: s.credit.user.apellido,
                email: s.credit.user.email,
                fecha_alta: s.credit.user.fecha_alta,
                rol: s.credit.user.rol,
                num_celular: s.credit.user.num_celular,
                active: s.credit.user.active
            } : null,
            creditos: s.credit ? {
                id: s.credit.id,
                tipo_credito: s.credit.type.toLowerCase(),
                cantidad: s.credit.amount,
                fecha_alta: s.credit.createdAt,
                vencimiento: s.credit.expiryDate
            } : null
        }));
    },
    
    getById: async (id) => {
        const search = await prisma.search.findUnique({
            where: { id },
            include: {
                credit: {
                    include: {
                        user: {
                            select: { id: true, nombre: true, apellido: true, email: true, fecha_alta: true, rol: true, num_celular: true, active: true }
                        }
                    }
                }
            }
        });
        
        if (\!search) return null;
        
        return {
            ...mapSearchToLegacy(search),
            usuario: search.credit?.user ? {
                id: search.credit.user.id,
                nombre: search.credit.user.nombre,
                apellido: search.credit.user.apellido,
                email: search.credit.user.email,
                fecha_alta: search.credit.user.fecha_alta,
                rol: search.credit.user.rol,
                num_celular: search.credit.user.num_celular,
                active: search.credit.user.active
            } : null,
            creditos: search.credit ? {
                id: search.credit.id,
                tipo_credito: search.credit.type.toLowerCase(),
                cantidad: search.credit.amount,
                fecha_alta: search.credit.createdAt,
                vencimiento: search.credit.expiryDate
            } : null
        };
    },
    
    getByUserId: async(id) => {
        // Buscar búsquedas a través de créditos del usuario
        const searches = await prisma.search.findMany({
            where: {
                credit: {
                    userId: id
                }
            },
            include: {
                credit: {
                    include: {
                        user: {
                            select: { id: true, nombre: true, apellido: true, email: true, fecha_alta: true, rol: true, num_celular: true, active: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        return searches.map(s => ({
            ...mapSearchToLegacy(s),
            usuario: s.credit?.user ? {
                id: s.credit.user.id,
                nombre: s.credit.user.nombre,
                apellido: s.credit.user.apellido,
                email: s.credit.user.email,
                fecha_alta: s.credit.user.fecha_alta,
                rol: s.credit.user.rol,
                num_celular: s.credit.user.num_celular,
                active: s.credit.user.active
            } : null,
            creditos: s.credit ? {
                id: s.credit.id,
                tipo_credito: s.credit.type.toLowerCase(),
                cantidad: s.credit.amount,
                fecha_alta: s.credit.createdAt,
                vencimiento: s.credit.expiryDate
            } : null
        }));
    },
    
    editById: async (id, busqueda) => {
        const updateData = {};
        if (busqueda.info_busqueda \!== undefined) updateData.searchInfo = busqueda.info_busqueda;
        if (busqueda.creditos_usados \!== undefined) updateData.creditsUsed = busqueda.creditos_usados;
        if (busqueda.observaciones \!== undefined) updateData.notes = busqueda.observaciones;
        if (busqueda.estado \!== undefined) updateData.status = busqueda.estado.toUpperCase();
        if (busqueda.id_cred \!== undefined) updateData.creditId = busqueda.id_cred;
        
        if (Object.keys(updateData).length === 0) return false;
        
        const updated = await prisma.search.update({
            where: { id },
            data: updateData
        });
        
        return \!\!updated;
    },
    
    create: async (info_busqueda, id_cred) => {
        const created = await prisma.search.create({
            data: {
                creditId: id_cred,
                searchInfo: info_busqueda,
                creditsUsed: 1, // Default
                status: 'PENDING'
            }
        });
        
        return created.id;
    },
    
    deleteById: async (id) => {
        const updated = await prisma.search.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
        return \!\!updated;
    }
}

export default busquedaModel
