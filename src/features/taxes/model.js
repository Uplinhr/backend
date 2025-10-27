import pool from '../../database/database.js';
import logger from '../../config/logger.config.js';

class TaxModel {
  /**
   * Obtiene configuración de impuesto por país
   */
  static async getTaxByCountry(countryCode) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM tax_config WHERE country_code = ? AND active = TRUE',
        [countryCode]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Error obteniendo configuración de impuesto:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las configuraciones de impuestos activas
   */
  static async getAllActiveTaxes() {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM tax_config WHERE active = TRUE ORDER BY country_name'
      );
      return rows;
    } catch (error) {
      logger.error('Error obteniendo configuraciones de impuestos:', error);
      throw error;
    }
  }

  /**
   * Crea nueva configuración de impuesto
   */
  static async createTax(taxData) {
    try {
      const [result] = await pool.query(
        `INSERT INTO tax_config 
        (country_code, country_name, tax_name, tax_rate, active, apply_to_services, apply_to_memberships, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          taxData.country_code,
          taxData.country_name,
          taxData.tax_name,
          taxData.tax_rate,
          taxData.active ?? true,
          taxData.apply_to_services ?? true,
          taxData.apply_to_memberships ?? true,
          taxData.notes || null
        ]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Error creando configuración de impuesto:', error);
      throw error;
    }
  }

  /**
   * Actualiza configuración de impuesto
   */
  static async updateTax(id, taxData) {
    try {
      const [result] = await pool.query(
        `UPDATE tax_config SET 
          country_name = COALESCE(?, country_name),
          tax_name = COALESCE(?, tax_name),
          tax_rate = COALESCE(?, tax_rate),
          active = COALESCE(?, active),
          apply_to_services = COALESCE(?, apply_to_services),
          apply_to_memberships = COALESCE(?, apply_to_memberships),
          notes = COALESCE(?, notes)
        WHERE id = ?`,
        [
          taxData.country_name,
          taxData.tax_name,
          taxData.tax_rate,
          taxData.active,
          taxData.apply_to_services,
          taxData.apply_to_memberships,
          taxData.notes,
          id
        ]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error actualizando configuración de impuesto:', error);
      throw error;
    }
  }

  /**
   * Desactiva configuración de impuesto
   */
  static async deactivateTax(id) {
    try {
      const [result] = await pool.query(
        'UPDATE tax_config SET active = FALSE WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error desactivando configuración de impuesto:', error);
      throw error;
    }
  }
}

export default TaxModel;
