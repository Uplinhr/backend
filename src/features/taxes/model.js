import prisma from '../../database/prisma.js';
import logger from '../../config/logger.config.js';

// Mapea el registro de Prisma (TaxConfig) al formato legacy que espera el service
// Prisma: { id, name, rate(0-1), country("ARG - Argentina"), isActive }
// Legacy: { country_code, country_name, tax_name, tax_rate(0-100), active, apply_to_services, apply_to_memberships, notes }
function mapPrismaToLegacy(t) {
  if (!t) return null;
  let country_code = null;
  let country_name = null;
  if (t.country) {
    const parts = String(t.country).split(' - ');
    country_code = parts[0] || null;
    country_name = parts.slice(1).join(' - ') || null;
  }

  return {
    id: t.id,
    country_code,
    country_name,
    tax_name: t.name,
    tax_rate: typeof t.rate === 'number' ? t.rate * 100 : null, // convertir 0.21 -> 21.00
    active: t.isActive,
    // Estos flags no existen en Prisma por ahora; por compatibilidad los dejamos en true
    apply_to_services: true,
    apply_to_memberships: true,
    notes: null,
  };
}

class TaxModel {
  /**
   * Obtiene configuración de impuesto por país (ISO3)
   */
  static async getTaxByCountry(countryCode) {
    try {
      // Buscar por prefijo del código dentro del campo country (formato "ARG - Argentina")
      const tax = await prisma.taxConfig.findFirst({
        where: {
          isActive: true,
          country: { startsWith: countryCode },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return mapPrismaToLegacy(tax);
    } catch (error) {
      logger.error('Error obteniendo configuración de impuesto (Prisma):', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las configuraciones de impuestos activas
   */
  static async getAllActiveTaxes() {
    try {
      const taxes = await prisma.taxConfig.findMany({
        where: { isActive: true },
        orderBy: { country: 'asc' },
      });
      return taxes.map(mapPrismaToLegacy);
    } catch (error) {
      logger.error('Error obteniendo configuraciones de impuestos (Prisma):', error);
      throw error;
    }
  }

  /**
   * Crea nueva configuración de impuesto
   */
  static async createTax(taxData) {
    try {
      const country = taxData.country_code && taxData.country_name
        ? `${taxData.country_code} - ${taxData.country_name}`
        : taxData.country_name || taxData.country_code || null;

      const created = await prisma.taxConfig.create({
        data: {
          name: taxData.tax_name,
          // convertir 21.00 -> 0.21
          rate: typeof taxData.tax_rate === 'number' ? taxData.tax_rate / 100 : 0,
          country: country,
          isActive: taxData.active ?? true,
        }
      });

      return created.id;
    } catch (error) {
      logger.error('Error creando configuración de impuesto (Prisma):', error);
      throw error;
    }
  }

  /**
   * Actualiza configuración de impuesto
   */
  static async updateTax(id, taxData) {
    try {
      const updateData = {};
      if (taxData.tax_name !== undefined) updateData.name = taxData.tax_name;
      if (taxData.tax_rate !== undefined) updateData.rate = taxData.tax_rate / 100;
      if (taxData.active !== undefined) updateData.isActive = !!taxData.active;
      if (taxData.country_name !== undefined || taxData.country_code !== undefined) {
        const country = taxData.country_code && taxData.country_name
          ? `${taxData.country_code} - ${taxData.country_name}`
          : taxData.country_name || taxData.country_code || null;
        updateData.country = country;
      }

      const updated = await prisma.taxConfig.update({
        where: { id },
        data: updateData,
      });

      return !!updated;
    } catch (error) {
      logger.error('Error actualizando configuración de impuesto (Prisma):', error);
      throw error;
    }
  }

  /**
   * Desactiva configuración de impuesto
   */
  static async deactivateTax(id) {
    try {
      const updated = await prisma.taxConfig.update({
        where: { id },
        data: { isActive: false },
      });
      return !!updated;
    } catch (error) {
      logger.error('Error desactivando configuración de impuesto (Prisma):', error);
      throw error;
    }
  }
}

export default TaxModel;
