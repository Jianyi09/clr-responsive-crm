import express from 'express';
import { crearMarca } from '../controllers/marcasController.js'; 

const router = express.Router()

// Definir ruta para registrar una nueva marca
router.post('/', crearMarca);

export default router;