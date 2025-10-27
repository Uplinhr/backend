import prisma from '../../database/prisma.js'

const mapEmpresaToLegacy = (e) => {
    if (!e) return null;
    return {
        id: e.id,
        nombre: e.name,
        email: e.email,
        id_usuario: e.userId || null,
        nombre_fantasia: e.fantasyName || null,
        cuit: e.cuit || null,
        condicion_iva: e.taxCondition || null,
        tipo_societario: e.legalType || null,
        actividad_principal: e.mainActivity || null,
        domicilio_legal_calle_numero: e.legalStreet || null,
        domicilio_legal_ciudad: e.legalCity || null,
        domicilio_legal_pais: e.legalCountry || null,
        codigo_postal: e.postalCode || null,
        active: e.active,
        fecha_alta: e.createdAt,
        ultima_mod: e.updatedAt,
    };
}

const empresaModel = {
    getAll: async () => {
        const rows = await prisma.empresa.findMany({ orderBy: { createdAt: 'asc' } });
        return rows.map(mapEmpresaToLegacy) || null;
    },
    getById: async (id) => {
        const row = await prisma.empresa.findUnique({ where: { id } });
        return mapEmpresaToLegacy(row);
    },
    editById: async (id, empresa) => {
        const data = {};
        if (empresa.nombre !== undefined) data.name = empresa.nombre;
        if (empresa.email !== undefined) data.email = empresa.email;
        if (empresa.nombre_fantasia !== undefined) data.fantasyName = empresa.nombre_fantasia;
        if (empresa.cuit !== undefined) data.cuit = empresa.cuit;
        if (empresa.condicion_iva !== undefined) data.taxCondition = empresa.condicion_iva;
        if (empresa.tipo_societario !== undefined) data.legalType = empresa.tipo_societario;
        if (empresa.actividad_principal !== undefined) data.mainActivity = empresa.actividad_principal;
        if (empresa.domicilio_legal_calle_numero !== undefined) data.legalStreet = empresa.domicilio_legal_calle_numero;
        if (empresa.domicilio_legal_ciudad !== undefined) data.legalCity = empresa.domicilio_legal_ciudad;
        if (empresa.domicilio_legal_pais !== undefined) data.legalCountry = empresa.domicilio_legal_pais;
        if (empresa.codigo_postal !== undefined) data.postalCode = empresa.codigo_postal;
        if (empresa.id_usuario !== undefined) data.userId = empresa.id_usuario;
        if (empresa.active !== undefined) data.active = !!empresa.active;
        if (Object.keys(data).length === 0) return false;
        await prisma.empresa.update({ where: { id }, data });
        return true;
    },
    editOwn: async (empresa) => {
        const data = {};
        if (empresa.nombre !== undefined) data.name = empresa.nombre;
        if (empresa.email !== undefined) data.email = empresa.email;
        if (empresa.nombre_fantasia !== undefined) data.fantasyName = empresa.nombre_fantasia;
        if (empresa.cuit !== undefined) data.cuit = empresa.cuit;
        if (empresa.condicion_iva !== undefined) data.taxCondition = empresa.condicion_iva;
        if (empresa.tipo_societario !== undefined) data.legalType = empresa.tipo_societario;
        if (empresa.actividad_principal !== undefined) data.mainActivity = empresa.actividad_principal;
        if (empresa.domicilio_legal_calle_numero !== undefined) data.legalStreet = empresa.domicilio_legal_calle_numero;
        if (empresa.domicilio_legal_ciudad !== undefined) data.legalCity = empresa.domicilio_legal_ciudad;
        if (empresa.domicilio_legal_pais !== undefined) data.legalCountry = empresa.domicilio_legal_pais;
        if (empresa.codigo_postal !== undefined) data.postalCode = empresa.codigo_postal;
        if (Object.keys(data).length === 0) return false;
        await prisma.empresa.updateMany({ where: { userId: empresa.id_usuario }, data });
        return true;
    },
    create: async (empresa) => {
        const created = await prisma.empresa.create({
            data: {
                name: empresa.nombre,
                email: empresa.email,
                userId: empresa.id_usuario || null,
                fantasyName: empresa.nombre_fantasia || null,
                cuit: empresa.cuit || null,
                taxCondition: empresa.condicion_iva || null,
                legalType: empresa.tipo_societario || null,
                mainActivity: empresa.actividad_principal || null,
                legalStreet: empresa.domicilio_legal_calle_numero || null,
                legalCity: empresa.domicilio_legal_ciudad || null,
                legalCountry: empresa.domicilio_legal_pais || null,
                postalCode: empresa.codigo_postal || null,
                active: true,
            }
        });
        return created.id;
    },
    enableById: async (id) => {
        await prisma.empresa.update({ where: { id }, data: { active: true } });
        return true;
    },
    deleteById: async (id) => {
        await prisma.empresa.update({ where: { id }, data: { active: false } });
        return true;
    },
    unlinkUserById: async (id) => {
        await prisma.empresa.update({ where: { id }, data: { userId: null } });
        return true;
    }
}

export default empresaModel