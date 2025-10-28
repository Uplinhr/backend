import prisma from '../../database/prisma.js'

const reinicio_contraseniaModel = {
    create: async (token, email, fechaExp, idUsuario) => {
        const created = await prisma.passwordReset.create({
            data: {
                token,
                email,
                expiresAt: fechaExp,
                userId: idUsuario ?? null,
            }
        })
        return created.id
    },
    getByToken: async (token) => {
        const row = await prisma.passwordReset.findUnique({ where: { token } })
        return row || null;
    },
    setTokenAsUsed: async (id) => {
        await prisma.passwordReset.update({ where: { id: String(id) }, data: { used: true } })
        return true;
    },
    deleteExpiredTokens: async () => {
        const result = await prisma.passwordReset.deleteMany({
            where: { OR: [{ expiresAt: { lte: new Date() } }, { used: true }] }
        })
        return result.count;
    }
}

export default reinicio_contraseniaModel