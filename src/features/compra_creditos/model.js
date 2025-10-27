import prisma from '../../database/prisma.js'

// Mapeo de Prisma CreditPurchase a estructura legacy esperada por controller
// Prisma: { id, creditId, amount, paymentMethod, notes, createdAt }
// Legacy: { id, medio_pago, costo, observaciones, id_cred, fecha_alta, creditos(JSON) }
const mapCreditPurchaseToLegacy = (cp) => {
    if (\!cp) return null;
    
    return {
        id: cp.id,
        medio_pago: cp.paymentMethod,
        costo: cp.amount,
        observaciones: cp.notes,
        id_cred: cp.creditId,
        fecha_alta: cp.createdAt,
        creditos: cp.credit ? {
            id: cp.credit.id,
            tipo_credito: cp.credit.type.toLowerCase(),
            cantidad: cp.credit.amount,
            vencimiento: cp.credit.expiryDate,
            fecha_alta: cp.credit.createdAt
        } : null
    };
}

const compra_creditosModel = {
    getAll: async () => {
        const purchases = await prisma.creditPurchase.findMany({
            include: {
                credit: {
                    include: {
                        user: {
                            select: { email: true, name: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        return purchases.map(mapCreditPurchaseToLegacy);
    },
    
    getById: async (id) => {
        const purchase = await prisma.creditPurchase.findUnique({
            where: { id },
            include: {
                credit: {
                    include: {
                        user: {
                            select: { email: true, name: true }
                        }
                    }
                }
            }
        });
        
        return purchase ? mapCreditPurchaseToLegacy(purchase) : null;
    },
    
    editById: async (id, compra_credito) => {
        const updateData = {};
        if (compra_credito.medio_pago \!== undefined) updateData.paymentMethod = compra_credito.medio_pago;
        if (compra_credito.costo \!== undefined) updateData.amount = compra_credito.costo;
        if (compra_credito.observaciones \!== undefined) updateData.notes = compra_credito.observaciones;
        if (compra_credito.id_cred \!== undefined) updateData.creditId = compra_credito.id_cred;
        
        if (Object.keys(updateData).length === 0) return false;
        
        const updated = await prisma.creditPurchase.update({
            where: { id },
            data: updateData
        });
        
        return \!\!updated;
    },
    
    create: async (medio_pago, costo, observaciones, cantidad, id_usuario) => {
        try {
            // Crear el crédito primero
            const credit = await prisma.credit.create({
                data: {
                    userId: id_usuario,
                    type: 'PURCHASE',
                    amount: cantidad,
                    isActive: true
                }
            });
            
            // Crear la compra del crédito
            const purchase = await prisma.creditPurchase.create({
                data: {
                    creditId: credit.id,
                    amount: costo,
                    paymentMethod: medio_pago,
                    notes: observaciones
                }
            });
            
            return purchase.id;
        } catch (error) {
            console.error('Error creando compra de crédito:', error);
            throw error;
        }
    },
    
    deleteById: async (id) => {
        // Soft delete: marcar como inactivo en lugar de eliminar
        const updated = await prisma.creditPurchase.update({
            where: { id },
            data: { 
                credit: {
                    update: { isActive: false }
                }
            }
        });
        return \!\!updated;
    }
}

export default compra_creditosModel
