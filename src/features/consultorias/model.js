import prisma from '../../database/prisma.js'

// Mapeo de Prisma Consultation a estructura legacy esperada por controller
// Prisma: { id, userId, totalHours, remainingHours, expiryDate, isActive, createdAt, updatedAt, sessions[] }
// Legacy: { id, horas_totales, horas_restantes, fecha_alta, vencimiento, id_usuario, consultas(JSON) }
const mapConsultationToLegacy = (c) => {
    if (!c) return null;
    
    return {
        id: c.id,
        horas_totales: c.totalHours,
        horas_restantes: c.remainingHours,
        fecha_alta: c.createdAt,
        vencimiento: c.expiryDate,
        id_usuario: c.userId,
        // Consultas individuales como JSON
        consultas: c.sessions.map(s => ({
            id: s.id,
            fecha_alta: s.createdAt,
            ultima_mod: s.updatedAt,
            comentarios: s.notes,
            cantidad_horas: s.duration ? Math.floor(s.duration / 60) : null,
            observaciones: s.notes,
            estado: s.status.toLowerCase()
        }))
    };
}

const consultoriaModel = {
    getAll: async () => {
        const consultations = await prisma.consultation.findMany({
            include: {
                user: {
                    select: { email: true, name: true }
                },
                sessions: {
                    select: { id: true, startTime: true, endTime: true, duration: true, cost: true, notes: true, status: true, createdAt: true, updatedAt: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        return consultations.map(mapConsultationToLegacy);
    },
    
    getById: async (id) => {
        const consultation = await prisma.consultation.findUnique({
            where: { id },
            include: {
                user: {
                    select: { email: true, name: true }
                },
                sessions: {
                    select: { id: true, startTime: true, endTime: true, duration: true, cost: true, notes: true, status: true, createdAt: true, updatedAt: true }
                }
            }
        });
        
        return consultation ? mapConsultationToLegacy(consultation) : null;
    },
    
    getOwn: async (id) => {
        const consultations = await prisma.consultation.findMany({
            where: {
                userId: id,
                isActive: true,
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gte: new Date() } }
                ]
            },
            include: {
                sessions: {
                    select: { id: true, startTime: true, endTime: true, duration: true, cost: true, notes: true, status: true, createdAt: true, updatedAt: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
        });
        
        return consultations.length > 0 ? mapConsultationToLegacy(consultations[0]) : null;
    },
    
    editById: async (id, consultoria) => {
        const updateData = {};
        if (consultoria.horas_totales !== undefined) updateData.totalHours = consultoria.horas_totales;
        if (consultoria.horas_restantes !== undefined) updateData.remainingHours = consultoria.horas_restantes;
        if (consultoria.vencimiento !== undefined) updateData.expiryDate = consultoria.vencimiento;
        if (consultoria.id_usuario !== undefined) updateData.userId = consultoria.id_usuario;
        
        if (Object.keys(updateData).length === 0) return false;
        
        const updated = await prisma.consultation.update({
            where: { id },
            data: updateData
        });
        
        return !!updated;
    },
    
    create: async (horas_totales, horas_restantes, vencimiento, id_usuario) => {
        const created = await prisma.consultation.create({
            data: {
                userId: id_usuario,
                totalHours: horas_totales,
                remainingHours: horas_restantes,
                expiryDate: vencimiento,
                isActive: true
            }
        });
        
        return created.id;
    },
    
    deleteById: async (id) => {
        const updated = await prisma.consultation.update({
            where: { id },
            data: { isActive: false }
        });
        return !!updated;
    }
}

export default consultoriaModel

