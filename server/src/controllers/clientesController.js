import pool from '../db/index.js';
import {
  extractFilterSelections,
  buildClientFilterConditions,
  addEquipmentFilterConditions,
  buildWhereClause,
  getEstadoIdPorNombre,
  getConteoEquiposPorCliente,
  getUbicationCatalogHelper,
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

// Endpoint conectado a la ruta GET /api/clientes/ubicaciones
export const getUbicationCatalog = async (req, res) => {
  try {
    const catalog = await getUbicationCatalogHelper();
    res.json(catalog);
  } catch (error) {
    console.error('Error en controlador al obtener catálogo de ubicaciones:', error);
    res.status(500).json({ error: 'Error interno al procesar el catálogo geográfico' });
  }
};

// Registrar nuevo cliente (POST)
export const crearCliente = async (req, res) => {
  const { razon_social, rif_dni, estado, ciudad, numero_telefonico, correo_electronico, contacto, direccion } = req.body;
  
  try {
    const query = `
      INSERT INTO "Clientes" 
      (razon_social, rif_dni, estado, ciudad, numero_telefonico, correo_electronico, contacto, direccion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [razon_social, rif_dni, estado, ciudad, numero_telefonico, correo_electronico, contacto, direccion];
    const result = await pool.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error interno al registrar el cliente' });
  }
};

// Editar un cliente existente (PUT)
export const actualizarCliente = async (req, res) => {
  const { id } = req.params;
  const { razon_social, rif_dni, estado, ciudad, numero_telefonico, correo_electronico, contacto, direccion } = req.body;

  try {
    const query = `
      UPDATE "Clientes"
      SET razon_social = $1, rif_dni = $2, estado = $3, ciudad = $4, 
          numero_telefonico = $5, correo_electronico = $6, contacto = $7, direccion = $8
      WHERE id_clientes = $9
      RETURNING *
    `;
    const values = [razon_social, rif_dni, estado, ciudad, numero_telefonico, correo_electronico, contacto, direccion, id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error interno al actualizar el cliente' });
  }
};

// 4. Eliminar un cliente (DELETE)
export const eliminarCliente = async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM "Clientes" WHERE id_clientes = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error al intentar eliminar el registro' });
  }
};

