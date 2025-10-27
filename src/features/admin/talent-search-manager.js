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
      const [services] = await pool.query(`
        SELECT
          id,
          service_name,
          base_price,
          discount_percentage,
          hires_included,
          description,
          features,
          active,
          display_order,
          fecha_alta,
          ultima_mod
        FROM talent_search_services
        ORDER BY display_order, service_name
      `);

      return services.map(service => ({
        id: service.id,
        name: service.service_name,
        basePrice: parseFloat(service.base_price),
        discountPercentage: parseFloat(service.discount_percentage),
        hiresIncluded: service.hires_included,
        description: service.description,
        features: JSON.parse(service.features || '{}'),
        active: Boolean(service.active),
        displayOrder: service.display_order,
        createdAt: service.fecha_alta,
        updatedAt: service.ultima_mod,
        // Calcular precio final con descuento aplicado
        finalPrice: parseFloat(service.base_price) * (1 - parseFloat(service.discount_percentage) / 100)
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
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const {
        name,
        basePrice,
        discountPercentage = 0,
        hiresIncluded = 1,
        description = '',
        features = {},
        displayOrder = 0
      } = serviceData;

      // Verificar que el nombre no exista
      const [existing] = await connection.query(
        'SELECT id FROM talent_search_services WHERE service_name = ?',
        [name]
      );

      if (existing.length > 0) {
        throw new Error('Ya existe un servicio con ese nombre');
      }

      // Insertar nuevo servicio
      const [result] = await connection.query(`
        INSERT INTO talent_search_services (
          service_name, base_price, discount_percentage, hires_included,
          description, features, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        name,
        basePrice,
        discountPercentage,
        hiresIncluded,
        description,
        JSON.stringify(features),
        displayOrder
      ]);

      await connection.commit();

      logger.info({
        type: 'TALENT_SEARCH_SERVICE_CREATED',
        serviceId: result.insertId,
        serviceName: name,
        basePrice,
        discountPercentage
      });

      return {
        id: result.insertId,
        name,
        basePrice,
        discountPercentage,
        hiresIncluded,
        description,
        features,
        displayOrder,
        active: true
      };

    } catch (error) {
      await connection.rollback();
      logger.error('Error creando servicio de búsqueda:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Actualizar servicio existente
   */
  static async updateService(serviceId, updateData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const {
        name,
        basePrice,
        discountPercentage,
        hiresIncluded,
        description,
        features,
        active,
        displayOrder
      } = updateData;

      // Verificar que el servicio existe
      const [existing] = await connection.query(
        'SELECT id FROM talent_search_services WHERE id = ?',
        [serviceId]
      );

      if (existing.length === 0) {
        throw new Error('Servicio no encontrado');
      }

      // Si se cambia el nombre, verificar que no exista otro con ese nombre
      if (name) {
        const [nameCheck] = await connection.query(
          'SELECT id FROM talent_search_services WHERE service_name = ? AND id != ?',
          [name, serviceId]
        );

        if (nameCheck.length > 0) {
          throw new Error('Ya existe otro servicio con ese nombre');
        }
      }

      // Construir query de actualización dinámicamente
      const updates = [];
      const values = [];

      if (name !== undefined) {
        updates.push('service_name = ?');
        values.push(name);
      }
      if (basePrice !== undefined) {
        updates.push('base_price = ?');
        values.push(basePrice);
      }
      if (discountPercentage !== undefined) {
        updates.push('discount_percentage = ?');
        values.push(discountPercentage);
      }
      if (hiresIncluded !== undefined) {
        updates.push('hires_included = ?');
        values.push(hiresIncluded);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (features !== undefined) {
        updates.push('features = ?');
        values.push(JSON.stringify(features));
      }
      if (active !== undefined) {
        updates.push('active = ?');
        values.push(active);
      }
      if (displayOrder !== undefined) {
        updates.push('display_order = ?');
        values.push(displayOrder);
      }

      if (updates.length === 0) {
        throw new Error('No hay datos para actualizar');
      }

      values.push(serviceId);

      await connection.query(`
        UPDATE talent_search_services
        SET ${updates.join(', ')}, ultima_mod = CURRENT_TIMESTAMP
        WHERE id = ?
      `, values);

      await connection.commit();

      logger.info({
        type: 'TALENT_SEARCH_SERVICE_UPDATED',
        serviceId,
        updates: Object.keys(updateData)
      });

      return true;

    } catch (error) {
      await connection.rollback();
      logger.error('Error actualizando servicio de búsqueda:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Eliminar servicio (soft delete cambiando estado a inactivo)
   */
  static async deleteService(serviceId) {
    try {
      const [result] = await pool.query(
        'UPDATE talent_search_services SET active = FALSE WHERE id = ?',
        [serviceId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Servicio no encontrado');
      }

      logger.info({
        type: 'TALENT_SEARCH_SERVICE_DELETED',
        serviceId
      });

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
      let whereClause = '';
      let params = [];

      if (serviceId) {
        whereClause = 'WHERE ci.item_id = ?';
        params = [serviceId];
      }

      const [stats] = await pool.query(`
        SELECT
          tss.id,
          tss.service_name,
          COUNT(ci.id) as times_used,
          SUM(ci.quantity) as total_hires,
          SUM(ci.total) as total_revenue,
          AVG(ci.unit_price) as avg_unit_price,
          MAX(ci.fecha_alta) as last_used
        FROM talent_search_services tss
        LEFT JOIN cart_items ci ON (
          ci.item_type = 'talent_search' AND
          ci.item_id = tss.id AND
          ci.fecha_alta >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        )
        ${whereClause}
        GROUP BY tss.id, tss.service_name
        ORDER BY times_used DESC, total_revenue DESC
      `, params);

      return stats.map(stat => ({
        serviceId: stat.id,
        serviceName: stat.service_name,
        timesUsed: parseInt(stat.times_used) || 0,
        totalHires: parseInt(stat.total_hires) || 0,
        totalRevenue: parseFloat(stat.total_revenue) || 0,
        avgUnitPrice: parseFloat(stat.avg_unit_price) || 0,
        lastUsed: stat.last_used
      }));

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

    if (!data.basePrice || data.basePrice <= 0) {
      errors.push('El precio base debe ser mayor a 0');
    }

    if (data.discountPercentage < 0 || data.discountPercentage > 100) {
      errors.push('El porcentaje de descuento debe estar entre 0 y 100');
    }

    if (data.hiresIncluded < 1) {
      errors.push('Debe incluir al menos 1 contratación');
    }

    return errors;
  }
}

export default TalentSearchServiceManager;
