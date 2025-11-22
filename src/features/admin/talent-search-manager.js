import prisma from '../../database/prisma.js';
import logger from '../../config/logger.config.js';

/**
 * Servicios de Búsqueda de Talento - Gestión Administrativa
 *
 * Funcionalidades disponibles:
 * ✅ Ver todos los servicios activos
 * ✅ Crear nuevos servicios
 * ✅ Editar precios y descuentos existentes
 * ✅ Activar/desactivar servicios
 * ✅ Cambiar orden de visualización
 * ✅ Ver estadísticas de uso por servicio
 */

class TalentSearchServiceManager {

  /**
   * Ver todos los servicios de búsqueda de talento
   */
  static async getAllServices() {
    try {
      const services = await prisma.talentSearchService.findMany({
        orderBy: [{ name: 'asc' }]
      });

      return services.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        category: s.category,
        discountPercentage: 0, // Deprecated or unused for now based on schema
        description: s.description,
        features: {}, // Deprecated or unused for now based on schema
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }));

    } catch (error) {
      logger.error('Error obteniendo servicios de búsqueda:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo servicio de búsqueda
   */
  static async createService(serviceData) {
    try {
      const {
        name,
        price,
        category,
        description = '',
        isActive = true
      } = serviceData;

      const exists = await prisma.talentSearchService.findFirst({ where: { name } });
      if (exists) throw new Error('Ya existe un servicio con ese nombre');

      const created = await prisma.talentSearchService.create({
        data: {
          name,
          price,
          category,
          description,
          isActive
        }
      });

      logger.info({
        type: 'TALENT_SEARCH_SERVICE_CREATED',
        serviceId: created.id,
        serviceName: name,
        price
      });

      return created;

    } catch (error) {
      logger.error('Error creando servicio de búsqueda:', error);
      throw error;
    }
  }

  /**
   * Actualizar servicio existente
   */
  static async updateService(serviceId, updateData) {
    try {
      const { name } = updateData;
      if (name) {
        const exists = await prisma.talentSearchService.findFirst({ where: { name } });
        if (exists && exists.id !== serviceId) throw new Error('Ya existe otro servicio con ese nombre');
      }

      const data = {};
      if (updateData.name !== undefined) data.name = updateData.name;
      if (updateData.price !== undefined) data.price = updateData.price;
      if (updateData.category !== undefined) data.category = updateData.category;
      if (updateData.description !== undefined) data.description = updateData.description;
      if (updateData.isActive !== undefined) data.isActive = updateData.isActive;

      if (Object.keys(data).length === 0) throw new Error('No hay datos para actualizar');

      await prisma.talentSearchService.update({ where: { id: String(serviceId) }, data });

      logger.info({ type: 'TALENT_SEARCH_SERVICE_UPDATED', serviceId, updates: Object.keys(updateData) });
      return true;
    } catch (error) {
      logger.error('Error actualizando servicio de búsqueda:', error);
      throw error;
    }
  }

  /**
   * Eliminar servicio (soft delete cambiando estado a inactivo)
   */
  static async deleteService(serviceId) {
    try {
      await prisma.talentSearchService.update({ where: { id: String(serviceId) }, data: { isActive: false } });
      logger.info({ type: 'TALENT_SEARCH_SERVICE_DELETED', serviceId });
      return true;
    } catch (error) {
      logger.error('Error eliminando servicio de búsqueda:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de uso por servicio
   */
  static async getServiceStats(serviceId = null) {
    try {
      const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const services = await prisma.talentSearchService.findMany({
        where: serviceId ? { id: String(serviceId) } : {},
        select: { id: true, name: true }
      });

      const stats = await Promise.all(services.map(async (s) => {
        const items = await prisma.cartItem.findMany({
          where: {
            itemType: 'talent_search',
            itemId: String(s.id),
            createdAt: { gte: last30d }
          },
          select: { id: true, quantity: true, total: true, unitPrice: true, createdAt: true }
        });
        const timesUsed = items.length;
        const totalHires = items.reduce((a, b) => a + (b.quantity || 0), 0);
        const totalRevenue = items.reduce((a, b) => a + (b.total || 0), 0);
        const avgUnitPrice = items.length ? (items.reduce((a, b) => a + (b.unitPrice || 0), 0) / items.length) : 0;
        const lastUsed = items.reduce((max, it) => (max && max > it.createdAt ? max : it.createdAt), null);
        return {
          serviceId: s.id,
          serviceName: s.name,
          timesUsed,
          totalHires,
          totalRevenue,
          avgUnitPrice,
          lastUsed
        };
      }));

      return stats.sort((a, b) => (b.timesUsed - a.timesUsed) || (b.totalRevenue - a.totalRevenue));

    } catch (error) {
      logger.error('Error obteniendo estadísticas de servicios:', error);
      throw error;
    }
  }

  /**
   * Calcular precio final con descuento aplicado
   */
  static calculateFinalPrice(basePrice, discountPercentage) {
    const discount = basePrice * (discountPercentage / 100);
    return basePrice - discount;
  }

  /**
   * Validar datos de servicio antes de guardar
   */
  static validateServiceData(data) {
    const errors = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('El nombre del servicio es requerido');
    }

    if (!data.price || data.price <= 0) {
      errors.push('El precio (créditos) debe ser mayor a 0');
    }

    if (!data.category) {
        errors.push('La categoría es requerida');
    }

    return errors;
  }
}

export default TalentSearchServiceManager;
