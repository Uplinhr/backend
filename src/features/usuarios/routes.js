import express from 'express'
import { 
  getUsuarioById,
  getUsuarios,
  deleteUsuarioById
} from './controller.js';
import { authRequired, checkRole } from '../../middlewares/auth.js';
const router = express.Router()

// Rutas protegidas
router.get('/', authRequired, getUsuarios);
router.get('/:id', authRequired, getUsuarioById)
/* PRIMERO HAY QUE CREAR updateUsuario
router.put('/:id', 
  authRequired, 
  (req, res, next) => {
    if (req.user.id !== parseInt(req.params.id) && req.user.rol !== 'admin') {
      return res.status(403).json({ message: "Solo puedes editar tu perfil" });
    }
    next();
  }, 
  updateUsuario
);
*/

// Rutas solo para admin
router.delete('/:id', authRequired, checkRole(['admin']), deleteUsuarioById)

export default router