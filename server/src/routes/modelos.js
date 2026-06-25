import express from 'express';
import { getAllModelos, createModelo, updateModelo, deleteModelo, asociarRepuesto } from '../controllers/modelosController.js';

const router = express.Router();

router.get('/dashboard', getAllModelos);

router.get('/repuestos/links', async (req, res) => {
  try {
    const basePool = req.db || pool;
    const result = await basePool.query('SELECT * FROM "Repuesto_Modelo"');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los enlaces' });
  }
});

router.post('/:id/repuestos', asociarRepuesto);

router.post('/', createModelo);

router.put('/:id', updateModelo);

router.delete('/:id', deleteModelo);

export default router;