import prisma from '../../database/prisma.js'

const consultaModel = {
    getAll: async () => {
        const sessions = await prisma.consultationSession.findMany({
            include: {
                consultation: {
                    include: { user: { select: { id: true, email: true, name: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return sessions.map(s => ({
            id: s.id,
            cantidad_horas: s.duration ? Math.floor(s.duration / 60) : null,
            comentarios: s.notes,
            observaciones: s.notes,
            estado: s.status.toLowerCase(),
            id_consultoria: s.consultationId,
            fecha_alta: s.createdAt,
            ultima_mod: s.updatedAt,
            usuario: s.consultation?.user ? {
                id: s.consultation.user.id,
                nombre: s.consultation.user.name || null,
                apellido: null,
                email: s.consultation.user.email,
                fecha_alta: null,
                rol: null,
                num_celular: null,
                active: true
            } : null
        })) || null;
    },
    getById: async (id) => {
        const s = await prisma.consultationSession.findUnique({
            where: { id },
            include: { consultation: true }
        });
        if (!s) return null;
        return {
            id: s.id,
            cantidad_horas: s.duration ? Math.floor(s.duration / 60) : null,
            comentarios: s.notes,
            observaciones: s.notes,
            estado: s.status.toLowerCase(),
            id_consultoria: s.consultationId,
            fecha_alta: s.createdAt,
            ultima_mod: s.updatedAt,
            consultorias: s.consultation ? {
                id: s.consultation.id,
                horas_restantes: s.consultation.remainingHours,
                horas_totales: s.consultation.totalHours,
                fecha_alta: s.consultation.createdAt,
                vencimiento: s.consultation.expiryDate
            } : null
        };
    },
    getByUserId: async(id) => {
        const sessions = await prisma.consultationSession.findMany({
            where: { consultation: { userId: id } },
            include: { consultation: { include: { user: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return sessions.map(s => ({
            id: s.id,
            cantidad_horas: s.duration ? Math.floor(s.duration / 60) : null,
            comentarios: s.notes,
            observaciones: s.notes,
            estado: s.status.toLowerCase(),
            id_consultoria: s.consultationId,
            fecha_alta: s.createdAt,
            ultima_mod: s.updatedAt,
            consultorias: s.consultation ? {
                id: s.consultation.id,
                horas_restantes: s.consultation.remainingHours,
                horas_totales: s.consultation.totalHours,
                fecha_alta: s.consultation.createdAt,
                vencimiento: s.consultation.expiryDate
            } : null,
            usuario: s.consultation?.user ? {
                id: s.consultation.user.id,
                nombre: s.consultation.user.name || null,
                apellido: null,
                email: s.consultation.user.email,
                fecha_alta: null,
                rol: null,
                num_celular: null,
                active: true
            } : null
        })) || null;
    },
    editById: async (id, consulta) => {
        const data = {};
        if (consulta.cantidad_horas !== undefined) data.duration = Number(consulta.cantidad_horas) * 60;
        if (consulta.comentarios !== undefined) data.notes = consulta.comentarios;
        if (consulta.observaciones !== undefined) data.notes = consulta.observaciones;
        if (consulta.estado !== undefined) data.status = String(consulta.estado).toUpperCase();
        if (consulta.id_consultoria !== undefined) data.consultationId = consulta.id_consultoria;
        if (Object.keys(data).length === 0) return false;
        await prisma.consultationSession.update({ where: { id }, data });
        return true;
    },
    create: async (cantidad_horas, comentarios, consultoria) => {
        const hours = Number(cantidad_horas);
        const result = await prisma.$transaction(async (tx) => {
            const cons = await tx.consultation.update({
                where: { id: consultoria.id },
                data: { remainingHours: { decrement: hours } }
            });
            if (!cons) throw new Error('No se pudo actualizar la consultoría');
            const session = await tx.consultationSession.create({
                data: {
                    consultationId: consultoria.id,
                    duration: hours * 60,
                    notes: comentarios || null,
                    status: 'COMPLETED'
                }
            });
            return session.id;
        });
        return result;
    },
    deleteById: async (consultoria, consulta) => {
        await prisma.$transaction(async (tx) => {
            const updated = await tx.consultationSession.update({
                where: { id: consulta.id },
                data: { status: 'CANCELLED' }
            });
            const horas = Number(consulta.cantidad_horas || (updated.duration ? updated.duration / 60 : 0));
            await tx.consultation.update({
                where: { id: consultoria.id },
                data: { remainingHours: { increment: Math.floor(horas) } }
            });
        });
        return true;
    },
}

export default consultaModel