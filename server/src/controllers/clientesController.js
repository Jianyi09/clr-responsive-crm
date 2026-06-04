import pool from '../db/index.js';
import {
  extractFilterSelections,
  buildClientFilterConditions,
  addEquipmentFilterConditions,
  buildWhereClause,
  getEstadoIdPorNombre,
  getConteEquiposPorCliente,
} from '../utils/dbHelpers.js';

export async function getClientesApi(req, res) {
  try {
    const selections = extractFilterSelections(req.query);
    const { condiciones, valores } = buildClientFilterConditions(selections, 'c');
    addEquipmentFilterConditions(condiciones, valores, selections);

    const whereClause = buildWhereClause(condiciones);
    
    const query = `
      SELECT DISTINCT
        c.id_clientes, 
        c.razon_social, 
        c.rif_dni, 
        c.contacto,
        c.numero_telefonico,
        c.correo_electronico, 
        c.direccion,
        Est.estado,
        Ciu.ciudad
      FROM "Clientes" c
      INNER JOIN "Estados" Est ON c.id_estado = Est.id_estado
      LEFT JOIN "Ciudades" Ciu ON c.id_ciudad = Ciu.id_ciudad
      LEFT JOIN "Equipos_Clientes" E ON c.id_clientes = E.id_cliente
      ${whereClause}
      ORDER BY c.razon_social ASC
    `;

    // 1. Ejecutamos de forma paralela la consulta de clientes y el conteo de equipos (Optimiza el tiempo de respuesta)
    const [resultadoClientes, mapaEquipos] = await Promise.all([
      pool.query(query, valores),
      getConteoEquiposPorCliente()
    ]);

    // 2. "Asignamos" dinámicamente el conteo de equipos a cada cliente correspondiente
    const clientesConEquipos = resultadoClientes.rows.map(cliente => ({
      ...cliente,
      // Si el cliente tiene equipos registrados en el mapa coloca la cantidad, de lo contrario coloca 0
      equiposRegistrados: mapaEquipos[cliente.id_clientes] || 0
    }));

    res.json(clientesConEquipos || []);
  } catch (err) {
    console.error('Database Error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Error consultando la base de datos' });
  }
}