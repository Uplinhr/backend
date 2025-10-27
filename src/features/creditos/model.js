import prisma from '../../database/prisma.js'

// Mapeo de Prisma Credit a estructura legacy esperada por controller
// Prisma: { id, userId, type, amount, expiryDate, isActive, createdAt, updatedAt }
// Legacy: { id, tipo_credito, cantidad, vencimiento, id_usuario, fecha_alta, busquedas(JSON), compra_creditos(JSON) }
const mapCreditToLegacy = (c) => {
    if (\!c) return null;
    
    return {
        id: c.id,
        tipo_credito: c.type.toLowerCase(), // PLAN -> plan, PURCHASE -> purchase, BONUS -> bonus
        cantidad: c.amount,
        vencimiento: c.expiryDate,
        id_usuario: c.userId,
        fecha_alta: c.createdAt,
        // Estructuras relacionadas: compatibilidad (arrays vacíos por ahora)
        busquedas: [],
        compra_creditos: []
    };
}

const creditoModel = {
    getAll: async () => {
        const credits = await prisma.credit.findMany({
            include: {
                user: {
                    select: { email: true, name: true }
                },
                searches: {
                    select: { id: true, searchInfo: true, creditsUsed: true, status: true }
                },
                purchases: {
                    select: { id: true, amount: true, paymentMethod: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        // Mapear a estructura legacy
        return credits.map(credit => ({
            ...mapCreditToLegacy(credit),
            busquedas: credit.searches.map(s => ({
                id: s.id,
                fecha_alta: s.createdAt,
                ultima_mod: s.updatedAt,
                info_busqueda: s.searchInfo,
                creditos_usados: s.creditsUsed,
                observaciones: s.notes,
                estado: s.status.toLowerCase()
            })),
            compra_creditos: credit.purchases.map(p => ({
                id: p.id,
                fecha_alta: p.createdAt,
                costo: p.amount,
                medio_pago: p.paymentMethod,
                observaciones: p.notes
            }))
        }));
    },
    
    getById: async (id) => {
        const credit = await prisma.credit.findUnique({
            where: { id },
            include: {
                user: {
                    select: { email: true, name: true }
                },
                searches: {
                    select: { id: true, searchInfo: true, creditsUsed: true, status: true, createdAt: true, updatedAt: true, notes: true }
                },
                purchases: {
                    select: { id: true, amount: true, paymentMethod: true, createdAt: true, notes: true }
                }
            }
        });
        
        if (\!credit) return null;
        
        return {
            ...mapCreditToLegacy(credit),
            busquedas: credit.searches.map(s => ({
                id: s.id,
                fecha_alta: s.createdAt,
                ultima_mod: s.updatedAt,
                info_busqueda: s.searchInfo,
                creditos_usados: s.creditsUsed,
                observaciones: s.notes,
                estado: s.status.toLowerCase()
            })),
            compra_creditos: credit.purchases.map(p => ({
                id: p.id,
                fecha_alta: p.createdAt,
                costo: p.amount,
                medio_pago: p.paymentMethod,
                observaciones: p.notes
            }))
        };
    },
    
    getOwn: async (idUsuario) => {
        const credits = await prisma.credit.findMany({
            where: {
                userId: idUsuario,
                isActive: true,
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gte: new Date() } }
                ]
            },
            include: {
                searches: {
                    select: { id: true, searchInfo: true, creditsUsed: true, status: true, createdAt: true }
                }
            },
            orderBy: [
                { type: 'asc' },
                { createdAt: 'desc' }
            ]
        });
        
        // Filtrar créditos de plan más recientes (como hace el código original)
        const filteredCredits = [];
        const planCredits = credits.filter(c => c.type === 'PLAN');
        const otherCredits = credits.filter(c => c.type \!== 'PLAN');
        
        if (planCredits.length > 0) {
            // Solo el plan más reciente
            const mostRecentPlan = planCredits.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
            filteredCredits.push(mapCreditToLegacy(mostRecentPlan));
        }
        
        // Agregar otros créditos
        filteredCredits.push(...otherCredits.map(mapCreditToLegacy));
        
        return filteredCredits;
    },
    
    editById: async (id, credito) => {
        const updateData = {};
        if (credito.tipo_credito \!== undefined) updateData.type = credito.tipo_credito.toUpperCase();
        if (credito.cantidad \!== undefined) updateData.amount = credito.cantidad;
        if (credito.vencimiento \!== undefined) updateData.expiryDate = credito.vencimiento;
        if (credito.id_usuario \!== undefined) updateData.userId = credito.id_usuario;
        
        if (Object.keys(updateData).length === 0) return false;
        
        const updated = await prisma.credit.update({
            where: { id },
            data: updateData
        });
        
        return \!\!updated;
    },
    
    create: async (tipo_credito, cantidad, vencimiento, id_usuario) => {
        const created = await prisma.credit.create({
            data: {
                userId: id_usuario,
                type: tipo_credito.toUpperCase(),
                amount: cantidad,
                expiryDate: vencimiento,
                isActive: true
            }
        });
        
        return created.id;
    },
    
    deleteById: async (id) => {
        const deleted = await prisma.credit.update({
            where: { id },
            data: { isActive: false }
        });
        return \!\!deleted;
    }
}

export default creditoModel
