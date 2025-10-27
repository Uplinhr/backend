import { Router } from 'express';
import CartController from './controller.js';
import { verifyToken } from '../../middlewares/auth.js';
import { cartValidators } from '../../utils/validators.js';

const router = Router();

// Rutas públicas para pruebas (sin autenticación)
router.post('/test', CartController.createTestCart);
router.post('/:cartId/test/items', CartController.addTestItem);
router.get('/:cartId/test/total', CartController.calculateTestTotal);

// Rutas protegidas (requieren autenticación)
router.use(verifyToken);

// Obtener carrito
router.get('/', CartController.getCart);

// Obtener resumen del carrito
router.get('/summary', CartController.getCartSummary);

// Agregar item al carrito
router.post('/items', cartValidators.addItem, CartController.addItem);

// Actualizar cantidad de item
router.put('/items/:itemId', cartValidators.updateItem, CartController.updateItemQuantity);

// Eliminar item del carrito
router.delete('/items/:itemId', cartValidators.removeItem, CartController.removeItem);

// Limpiar carrito
router.delete('/', CartController.clearCart);

export default router;
