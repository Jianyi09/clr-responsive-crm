import express from 'express';
import { getCatalogData } from '../controllers/dataController.js';

const router = express.Router();

router.get('/:name', getCatalogData);

export default router;
