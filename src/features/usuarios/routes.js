import express from 'express'
import { 
  getUsuarioById, 
  getUsuarios, 
  createUsuario, 
  deleteUsuarioById 
} from './controller.js';
const router = express.Router()

router.get('/', getUsuarios);
router.get('/:id', getUsuarioById)
router.post('/', createUsuario)
router.delete('/:id', deleteUsuarioById)

export default router