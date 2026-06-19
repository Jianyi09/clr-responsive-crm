import express from 'express';
import { getAllModelos, createModelo, updateModelo, deleteModelo, asociarRepuesto } from '../controllers/modelosController.js';

const router = express.Router();

// 1. OBTENER TODOS LOS MODELOS
// Endpoint: GET /api/modelos
router.get('/dashboard', getAllModelos);

// 2. CREAR MODELO
// Endpoint: POST /api/modelos
router.post('/', createModelo);

// 3. ACTUALIZAR MODELO
// Endpoint: PUT /api/modelos/:id
router.put('/:id', updateModelo);

// 4. ELIMINAR MODELO
// Endpoint: DELETE /api/modelos/:id
router.delete('/:id', deleteModelo);

// 5. ASOCIAR REPUESTO EXISTENTE O NUEVO
// Endpoint: POST /api/modelos/:id/repuestos
router.post('/:id/repuestos', asociarRepuesto);

export default router;