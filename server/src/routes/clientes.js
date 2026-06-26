import express from 'express';
import { getClientesApi, crearCliente, actualizarCliente, eliminarCliente, getUbicationCatalog, getEstadosLista } from '../controllers/clientesController.js';

const router = express.Router();

router.get('/', getClientesApi);    
router.get('/ubicaciones', getUbicationCatalog);
router.get('/estados', getEstadosLista);
router.post('/', crearCliente);
router.put('/:id', actualizarCliente);
router.delete('/:id', eliminarCliente);

export default router;
