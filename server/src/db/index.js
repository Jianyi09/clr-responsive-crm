import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Falta la variable DATABASE_URL en el archivo .env');
}

const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Error en el pool de PostgreSQL:', err);
});

export async function query(text, params) {
  return pool.query(text, params);
}

export default pool;
