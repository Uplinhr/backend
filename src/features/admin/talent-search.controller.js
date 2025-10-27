import TalentSearchServiceManager from '../admin/talent-search-manager.js';
import { successResponse, errorResponse } from '../../utils/helpers.js';

/**
 * Controlador administrativo para gestión de servicios de búsqueda de talento
 */
class AdminTalentSearchController {

  /**
   * GET /api/admin/talent-search-services
   * Obtener todos los servicios de búsqueda de talento
   */
  static async getAllServices(req, res) {
    try {
      const services = await TalentSearchServiceManager.getAllServices();

      return res.json(successResponse(services, 'Servicios obtenidos exitosamente'));
    } catch (error) {
      return res.status(500).json(
        errorResponse('Error obteniendo servicios', 'GET_SERVICES_ERROR', error.message)
      );
    }
  }

  /**
   * POST /api/admin/talent-search-services
   * Crear nuevo servicio de búsqueda
   */
  static async createService(req, res) {
    try {
      const serviceData = req.body;

      // Validar datos
      const validationErrors = TalentSearchServiceManager.validateServiceData(serviceData);
      if (validationErrors.length > 0) {
        return res.status(400).json(
          errorResponse('Datos inválidos', 'VALIDATION_ERROR', validationErrors)
        );
      }

      const newService = await TalentSearchServiceManager.createService(serviceData);

      return res.status(201).json(
        successResponse(newService, 'Servicio creado exitosamente')
      );
    } catch (error) {
      const statusCode = error.message.includes('Ya existe') ? 409 : 500;
      return res.status(statusCode).json(
        errorResponse('Error creando servicio', 'CREATE_SERVICE_ERROR', error.message)
      );
    }
  }

  /**
   * PUT /api/admin/talent-search-services/:serviceId
   * Actualizar servicio existente
   */
  static async updateService(req, res) {
    try {
      const { serviceId } = req.params;
      const updateData = req.body;

      // Validar datos si se proporcionan
      if (Object.keys(updateData).length > 0) {
        const validationErrors = TalentSearchServiceManager.validateServiceData(updateData);
        if (validationErrors.length > 0) {
          return res.status(400).json(
            errorResponse('Datos inválidos', 'VALIDATION_ERROR', validationErrors)
          );
        }
      }

      await TalentSearchServiceManager.updateService(serviceId, updateData);

      return res.json(
        successResponse(true, 'Servicio actualizado exitosamente')
      );
    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 500;
      return res.status(statusCode).json(
        errorResponse('Error actualizando servicio', 'UPDATE_SERVICE_ERROR', error.message)
      );
    }
  }

  /**
   * DELETE /api/admin/talent-search-services/:serviceId
   * Eliminar servicio (desactivar)
   */
  static async deleteService(req, res) {
    try {
      const { serviceId } = req.params;

      await TalentSearchServiceManager.deleteService(serviceId);

      return res.json(
        successResponse(true, 'Servicio eliminado exitosamente')
      );
    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 500;
      return res.status(statusCode).json(
        errorResponse('Error eliminando servicio', 'DELETE_SERVICE_ERROR', error.message)
      );
    }
  }

  /**
   * GET /api/admin/talent-search-services/stats
   * Obtener estadísticas de uso de servicios
   */
  static async getServiceStats(req, res) {
    try {
      const { serviceId } = req.query;

      const stats = await TalentSearchServiceManager.getServiceStats(serviceId);

      return res.json(successResponse(stats, 'Estadísticas obtenidas exitosamente'));
    } catch (error) {
      return res.status(500).json(
        errorResponse('Error obteniendo estadísticas', 'GET_STATS_ERROR', error.message)
      );
    }
  }

  /**
   * POST /api/admin/talent-search-services/:serviceId/activate
   * Activar servicio
   */
  static async activateService(req, res) {
    try {
      const { serviceId } = req.params;

      await TalentSearchServiceManager.updateService(serviceId, { active: true });

      return res.json(
        successResponse(true, 'Servicio activado exitosamente')
      );
    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 500;
      return res.status(statusCode).json(
        errorResponse('Error activando servicio', 'ACTIVATE_SERVICE_ERROR', error.message)
      );
    }
  }

  /**
   * POST /api/admin/talent-search-services/:serviceId/deactivate
   * Desactivar servicio
   */
  static async deactivateService(req, res) {
    try {
      const { serviceId } = req.params;

      await TalentSearchServiceManager.updateService(serviceId, { active: false });

      return res.json(
        successResponse(true, 'Servicio desactivado exitosamente')
      );
    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 500;
      return res.status(statusCode).json(
        errorResponse('Error desactivando servicio', 'DEACTIVATE_SERVICE_ERROR', error.message)
      );
    }
  }
}

export default AdminTalentSearchController;
