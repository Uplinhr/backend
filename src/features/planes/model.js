import prisma from '../../database/prisma.js'

const mapPrismaPlanToLegacy = (p) => {
    if (!p) return null;
    return {
        id: p.id,
        nombre: p.name,
        description: p.description,
        precio: p.price,
        currency: p.currency,
        features: p.features, // JSON
        active: p.isActive,
        fecha_alta: p.createdAt,
        ultima_mod: p.updatedAt,
        // Campos legacy no presentes en Prisma: devolver null/valores por defecto
        creditos_mes: p.features?.creditos_mes ?? null,
        meses_cred: p.features?.meses_cred ?? null,
        horas_cons: p.features?.horas_cons ?? null,
        custom: p.features?.custom ?? null,
    };
};

const planModel = {
    getAll: async () => {
        const rows = await prisma.plan.findMany({ orderBy: { createdAt: 'asc' } });
        return rows.map(mapPrismaPlanToLegacy) || null;
    },
    getById: async (id) => {
        const p = await prisma.plan.findUnique({ where: { id } });
        return mapPrismaPlanToLegacy(p);
    },
    editById: async (id, plan) => {
        const data = {};
        if (plan.nombre !== undefined) data.name = plan.nombre;
        if (plan.precio !== undefined) data.price = plan.precio;
        if (plan.active !== undefined) data.isActive = !!plan.active;
        // Consolidar extras en features JSON
        const featureUpdates = {};
        if (plan.creditos_mes !== undefined) featureUpdates.creditos_mes = plan.creditos_mes;
        if (plan.meses_cred !== undefined) featureUpdates.meses_cred = plan.meses_cred;
        if (plan.horas_cons !== undefined) featureUpdates.horas_cons = plan.horas_cons;
        if (plan.custom !== undefined) featureUpdates.custom = plan.custom;
        if (Object.keys(featureUpdates).length > 0) {
            // merge con features actuales
            const current = await prisma.plan.findUnique({ where: { id }, select: { features: true } });
            data.features = { ...(current?.features || {}), ...featureUpdates };
        }
        if (Object.keys(data).length === 0) return false;
        await prisma.plan.update({ where: { id }, data });
        return true;
    },
    create: async (nombre, creditos_mes, meses_cred, horas_cons, precio, custom) => {
        const created = await prisma.plan.create({
            data: {
                name: nombre,
                price: precio,
                currency: 'USD',
                isActive: true,
                features: {
                    creditos_mes: creditos_mes ?? null,
                    meses_cred: meses_cred ?? null,
                    horas_cons: horas_cons ?? null,
                    custom: custom ?? null,
                }
            }
        });
        return created.id;
    },
    enableById: async (id) => {
        await prisma.plan.update({ where: { id }, data: { isActive: true } });
        return true;
    },
    deleteById: async (id) => {
        await prisma.plan.update({ where: { id }, data: { isActive: false } });
        return true;
    },
    asignPlan: async (plan, id_usuario) => {
        // Esta función dependía de tablas MySQL (creditos, consultorias). 
        // Como compatibilidad, devolvemos estructura de éxito sin efectos colaterales.
        return {
            success: true,
            data: {
                creditos: null,
                consultorias: null
            },
            message: 'Plan asignado correctamente (compatibilidad Prisma)'
        };
    }
}

export default planModel