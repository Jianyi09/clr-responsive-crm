import express from 'express';
import { getClientesApi, postCliente, putCliente, deleteCliente } from '../controllers/clientesController.js';

const router = express.Router();

router.get('/', getClientesApi);
router.post('/', postCliente);
router.put('/:id', putCliente);
router.delete('/:id', deleteCliente);

export default router;
