import TaxService from './service.js';
import { successResponse, errorResponse } from '../../utils/helpers.js';

class TaxController {
  /**
   * Calcula impuestos para un monto
   * POST /api/taxes/calculate
   */
  static async calculateTax(req, res) {
    try {
      const { subtotal, country_code, item_type } = req.body;

      if (!subtotal || subtotal <= 0) {
        return res.status(400).json(
          errorResponse('El subtotal debe ser mayor a 0', 'INVALID_AMOUNT')
        );
      }

      const countryCode = country_code || 
                         await TaxService.getCountryFromIP(req.ip);

      const result = await TaxService.calculateTaxes(
        subtotal,
        countryCode,
        item_type
      );

      return res.json(successResponse(result));
    } catch (error) {
      return res.status(500).json(
        errorResponse('Error calculando impuestos', 'TAX_CALCULATION_ERROR', error.message)
      );
    }
  }

  /**
   * Obtiene todas las configuraciones de impuestos
   * GET /api/taxes/config
   */
  static async getAllTaxConfigs(req, res) {
    try {
      const configs = await TaxService.getAllTaxConfigs();
      return res.json(successResponse(configs));
    } catch (error) {
      return res.status(500).json(
        errorResponse('Error obteniendo configuraciones', 'GET_CONFIGS_ERROR', error.message)
      );
    }
  }

  /**
   * Crea nueva configuración de impuesto (Admin)
   * POST /api/taxes/config
   */
  static async createTaxConfig(req, res) {
    try {
      const taxData = req.body;
      const taxId = await TaxService.createTaxConfig(taxData);
      
      return res.status(201).json(
        successResponse(
          { id: taxId },
          'Configuración de impuesto creada exitosamente'
        )
      );
    } catch (error) {
      return res.status(400).json(
        errorResponse('Error creando configuración', 'CREATE_CONFIG_ERROR', error.message)
      );
    }
  }

  /**
   * Actualiza configuración de impuesto (Admin)
   * PUT /api/taxes/config/:id
   */
  static async updateTaxConfig(req, res) {
    try {
      const { id } = req.params;
      const taxData = req.body;
      
      await TaxService.updateTaxConfig(id, taxData);
      
      return res.json(
        successResponse(null, 'Configuración actualizada exitosamente')
      );
    } catch (error) {
      return res.status(400).json(
        errorResponse('Error actualizando configuración', 'UPDATE_CONFIG_ERROR', error.message)
      );
    }
  }
}

export default TaxController;
