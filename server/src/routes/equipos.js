import express from 'express';
import { getEquiposDashboardApi, crearEquipo, actualizarEquipo, eliminarEquipo } from '../controllers/equiposController.js';

const router = express.Router();

router.get('/dashboard', getEquiposDashboardApi); // Endpoint específico para obtener todos los datos necesarios para el dashboard de equipos
router.post('/', crearEquipo);
router.put('/:id', actualizarEquipo);
router.delete('/:id', eliminarEquipo);

export default router;
