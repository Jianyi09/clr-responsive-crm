import clientesRouter from './clientes.js';
import dataRouter from './data.js';
import equiposRouter from './equipos.js';
import { ROUTES } from '../config/routes.js';


export default function registerRoutes(app) {
  app.get('/', (req, res) => {
    res.send('CRM Flota Clientes API en Express');
  });

  app.use(ROUTES.clientes, clientesRouter);
  app.use(ROUTES.data, dataRouter);
  app.use(ROUTES.equipos, equiposRouter);

  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
  });
}
