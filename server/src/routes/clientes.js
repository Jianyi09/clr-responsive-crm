import express from 'express';
import { getClientesApi} from '../controllers/clientesController.js';

const router = express.Router();

router.get('/', getClientesApi);

export default router;
