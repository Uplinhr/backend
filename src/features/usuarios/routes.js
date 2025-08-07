import express from 'express'
import { getUsuarioById, getUsuarios, createUsuario } from './controller.js';
const router = express.Router()

router.get('/', getUsuarios);
router.get('/:id', getUsuarioById)
router.post('/', createUsuario)

export default router