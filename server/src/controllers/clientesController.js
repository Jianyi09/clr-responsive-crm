import pool from '../db/index.js';
import {
  extractFilterSelections,
  buildClientFilterConditions,
  addEquipmentFilterConditions,
  buildWhereClause,
  getEstadoIdPorNombre,
} from '../utils/dbHelpers.js';

export async function getClientesApi(req, res) {
  try {
    const selections = extractFilterSelections(req.query);
    const { condiciones, valores } = buildClientFilterConditions(selections, 'c');
    addEquipmentFilterConditions(condiciones, valores, selections);

    const whereClause = buildWhereClause(condiciones);
    const query = `
      SELECT 
        c.id_clientes, 
        c.razon_social, 
        c.rif_dni, 
        c.contacto,
        Est.estado, 
        c.numero_telefonico,
        c.correo_electronico, 
        c.direccion,pm
        COUNT(E.id_equipo)::INT AS "equiposRegistrados"
      FROM "Clientes" c
      INNER JOIN "Estados" Est ON c.id_estado = Est.id_estado
      LEFT JOIN "Equipos_Clientes" E ON c.id_clientes = E.id_cliente
      ${whereClause}
      GROUP BY c.id_clientes, c.razon_social, c.rif_dni, c.contacto, Est.estado, c.numero_telefonico, c.correo_electronico, c.direccion
      ORDER BY c.razon_social ASC
    `;

    const resultado = await pool.query(query, valores);
    res.json(resultado.rows || []);
  } catch (err) {
    console.error('Database Error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Error consultando la base de datos' });
  }
}