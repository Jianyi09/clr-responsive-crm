import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db/index.js';
import registerRoutes from './routes/index.js';

dotenv.config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use((req, res, next) => {
  req.db = pool;
  next();
});

registerRoutes(app);

export default app;
