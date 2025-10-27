import prisma from '../../database/prisma.js'

// Mapeo de Prisma PlanPurchase a estructura legacy esperada por controller
// Prisma: { id, userId, planId, amount, paymentMethod, notes, createdAt }
// Legacy: { id, medio_pago, observaciones, precio_abonado, id_plan, id_usuario, fecha_alta, plan(JSON), usuario(JSON) }
const mapPlanPurchaseToLegacy = (pp) => {
    if (\!pp) return null;
    
    return {
        id: pp.id,
        medio_pago: pp.paymentMethod,
        observaciones: pp.notes,
        precio_abonado: pp.amount,
        id_plan: pp.planId,
        id_usuario: pp.userId,
        fecha_alta: pp.createdAt,
        plan: pp.plan ? {
            id: pp.plan.id,
            nombre: pp.plan.name,
            creditos_mes: pp.plan.features?.creditos_mes ?? null,
            meses_cred: pp.plan.features?.meses_cred ?? null,
            horas_cons: pp.plan.features?.horas_cons ?? null,
            precio: pp.plan.price,
            active: pp.plan.isActive,
            fecha_alta: pp.plan.createdAt,
            ultima_mod: pp.plan.updatedAt
        } : null,
        usuario: pp.user ? {
            id: pp.user.id,
            nombre: pp.user.nombre,
            apellido: pp.user.apellido,
            email: pp.user.email,
            fecha_alta: pp.user.fecha_alta,
            active: pp.user.active,
            num_celular: pp.user.num_celular,
            rol: pp.user.rol
        } : null
    };
}

const compra_planModel = {
    getAll: async () => {
        const purchases = await prisma.planPurchase.findMany({
            include: {
                user: {
                    select: { id: true, nombre: true, apellido: true, email: true, fecha_alta: true, active: true, num_celular: true, rol: true }
                },
                plan: {
                    select: { id: true, name: true, features: true, price: true, isActive: true, createdAt: true, updatedAt: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        return purchases.map(mapPlanPurchaseToLegacy);
    },
    
    getCompra_PlanById: async (id) => {
        const purchase = await prisma.planPurchase.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, nombre: true, apellido: true, email: true, fecha_alta: true, active: true, num_celular: true, rol: true }
                },
                plan: {
                    select: { id: true, name: true, features: true, price: true, isActive: true, createdAt: true, updatedAt: true }
                }
            }
        });
        
        return purchase ? mapPlanPurchaseToLegacy(purchase) : null;
    },
    
    editCompra_PlanById: async (id, plan) => {
        const updateData = {};
        if (plan.medio_pago \!== undefined) updateData.paymentMethod = plan.medio_pago;
        if (plan.observaciones \!== undefined) updateData.notes = plan.observaciones;
        if (plan.precio_abonado \!== undefined) updateData.amount = plan.precio_abonado;
        if (plan.id_plan \!== undefined) updateData.planId = plan.id_plan;
        if (plan.id_usuario \!== undefined) updateData.userId = plan.id_usuario;
        
        if (Object.keys(updateData).length === 0) return false;
        
        const updated = await prisma.planPurchase.update({
            where: { id },
            data: updateData
        });
        
        return \!\!updated;
    },
    
    create: async (medio_pago, observaciones, precio_abonado, id_plan, id_usuario) => {
        const created = await prisma.planPurchase.create({
            data: {
                userId: id_usuario,
                planId: id_plan,
                amount: precio_abonado,
                paymentMethod: medio_pago,
                notes: observaciones
            }
        });
        
        return created.id;
    },
    
    deleteCompra_PlanById: async (id) => {
        // Soft delete: marcar como inactivo en lugar de eliminar físicamente
        const deleted = await prisma.planPurchase.delete({
            where: { id }
        });
        return \!\!deleted;
    }
}

export default compra_planModel
