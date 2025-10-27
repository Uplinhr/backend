import TaxModel from './model.js';
import paymentConfig from '../../config/payment.config.js';
import { calculateTax, roundToTwoDecimals } from '../../utils/helpers.js';
import logger from '../../config/logger.config.js';

class TaxService {
  /**
   * Calcula impuestos para un monto dado
   * @param {number} subtotal - Monto sin impuestos
   * @param {string} countryCode - Código de país (ISO 3166-1 alpha-3)
   * @param {string} itemType - Tipo de item (membership, service, etc)
   * @returns {Object} - { taxRate, taxAmount, taxName, total }
   */
  static async calculateTaxes(subtotal, countryCode, itemType = 'service') {
    try {
      // Obtener configuración de impuesto por país
      const taxConfig = await TaxModel.getTaxByCountry(countryCode);

      // Si no hay configuración o país no cobra impuestos
      if (!taxConfig || taxConfig.tax_rate === 0) {
        return {
          taxRate: 0,
          taxAmount: 0,
          taxName: null,
          countryCode,
          total: roundToTwoDecimals(subtotal),
          appliesTax: false
        };
      }

      // Verificar si aplica según el tipo de item
      const shouldApplyTax = this.shouldApplyTax(taxConfig, itemType);

      if (!shouldApplyTax) {
        return {
          taxRate: 0,
          taxAmount: 0,
          taxName: taxConfig.tax_name,
          countryCode,
          total: roundToTwoDecimals(subtotal),
          appliesTax: false
        };
      }

      // Calcular impuesto
      const taxAmount = calculateTax(subtotal, taxConfig.tax_rate);
      const total = subtotal + taxAmount;

      logger.info({
        type: 'TAX_CALCULATION',
        countryCode,
        taxRate: taxConfig.tax_rate,
        subtotal,
        taxAmount,
        total
      });

      return {
        taxRate: taxConfig.tax_rate,
        taxAmount: roundToTwoDecimals(taxAmount),
        taxName: taxConfig.tax_name,
        countryCode,
        total: roundToTwoDecimals(total),
        appliesTax: true
      };

    } catch (error) {
      logger.error('Error calculando impuestos:', error);
      
      // En caso de error, usar configuración por defecto (Argentina)
      const defaultRate = paymentConfig.tax.defaultRate;
      const taxAmount = calculateTax(subtotal, defaultRate);
      
      return {
        taxRate: defaultRate,
        taxAmount: roundToTwoDecimals(taxAmount),
        taxName: 'IVA',
        countryCode: paymentConfig.tax.defaultCountry,
        total: roundToTwoDecimals(subtotal + taxAmount),
        appliesTax: true,
        fallback: true
      };
    }
  }

  /**
   * Determina si se debe aplicar impuesto según el tipo de item
   */
  static shouldApplyTax(taxConfig, itemType) {
    switch (itemType) {
      case 'membership':
        return taxConfig.apply_to_memberships;
      case 'talent_search':
      case 'consultancy':
      case 'people_partner':
      case 'service':
        return taxConfig.apply_to_services;
      default:
        return true;
    }
  }

  /**
   * Obtiene país desde IP (simplificado)
   * En producción usar servicio de geolocalización
   */
  static async getCountryFromIP(ip) {
    // TODO: Implementar con servicio real (ipapi.co, MaxMind, etc)
    // Por ahora retorna Argentina por defecto
    
    if (process.env.NODE_ENV === 'development') {
      return paymentConfig.tax.defaultCountry;
    }

    try {
      // Aquí iría la llamada al servicio de geolocalización
      return paymentConfig.tax.defaultCountry;
    } catch (error) {
      logger.error('Error obteniendo país desde IP:', error);
      return paymentConfig.tax.defaultCountry;
    }
  }

  /**
   * Valida código de país
   */
  static isValidCountryCode(countryCode) {
    return typeof countryCode === 'string' && 
           countryCode.length === 3 && 
           /^[A-Z]{3}$/.test(countryCode);
  }

  /**
   * Calcula breakdown de impuestos para múltiples items
   */
  static async calculateCartTaxes(items, countryCode) {
    try {
      let totalSubtotal = 0;
      let totalTaxAmount = 0;
      const itemsWithTax = [];

      for (const item of items) {
        const itemSubtotal = item.subtotal || (item.unit_price * item.quantity);
        totalSubtotal += itemSubtotal;

        const taxCalc = await this.calculateTaxes(
          itemSubtotal,
          countryCode,
          item.item_type
        );

        itemsWithTax.push({
          ...item,
          taxRate: taxCalc.taxRate,
          taxAmount: taxCalc.taxAmount,
          total: taxCalc.total
        });

        totalTaxAmount += taxCalc.taxAmount;
      }

      return {
        items: itemsWithTax,
        subtotal: roundToTwoDecimals(totalSubtotal),
        taxAmount: roundToTwoDecimals(totalTaxAmount),
        total: roundToTwoDecimals(totalSubtotal + totalTaxAmount),
        countryCode
      };

    } catch (error) {
      logger.error('Error calculando impuestos del carrito:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las configuraciones de impuestos (Admin)
   */
  static async getAllTaxConfigs() {
    try {
      return await TaxModel.getAllActiveTaxes();
    } catch (error) {
      logger.error('Error obteniendo configuraciones de impuestos:', error);
      throw error;
    }
  }

  /**
   * Crea nueva configuración de impuesto (Admin)
   */
  static async createTaxConfig(taxData) {
    try {
      if (!this.isValidCountryCode(taxData.country_code)) {
        throw new Error('Código de país inválido');
      }

      if (taxData.tax_rate < 0 || taxData.tax_rate > 100) {
        throw new Error('Tasa de impuesto debe estar entre 0 y 100');
      }

      const taxId = await TaxModel.createTax(taxData);
      
      logger.info({
        type: 'TAX_CONFIG_CREATED',
        taxId,
        countryCode: taxData.country_code
      });

      return taxId;
    } catch (error) {
      logger.error('Error creando configuración de impuesto:', error);
      throw error;
    }
  }

  /**
   * Actualiza configuración de impuesto (Admin)
   */
  static async updateTaxConfig(id, taxData) {
    try {
      if (taxData.tax_rate !== undefined && 
          (taxData.tax_rate < 0 || taxData.tax_rate > 100)) {
        throw new Error('Tasa de impuesto debe estar entre 0 y 100');
      }

      const updated = await TaxModel.updateTax(id, taxData);
      
      if (!updated) {
        throw new Error('Configuración de impuesto no encontrada');
      }

      logger.info({
        type: 'TAX_CONFIG_UPDATED',
        taxId: id
      });

      return true;
    } catch (error) {
      logger.error('Error actualizando configuración de impuesto:', error);
      throw error;
    }
  }
}

export default TaxService;
