import express from 'express'
import { getUsuarioById, getUsuarios } from './controller.js';
const router = express.Router()

router.get('/', getUsuarios);
router.get('/:id', getUsuarioById)

export default router