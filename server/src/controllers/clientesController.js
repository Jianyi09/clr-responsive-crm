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
export async function crearCliente(req, res) {
  const { 
    razon_social, rif_dni, estado, ciudad, 
    numero_telefonico, correo_electronico, contacto, direccion 
  } = req.body;

  try {
    // 1. Traducimos el texto del Estado (Este sigue siendo obligatorio)
    const estadoQuery = await req.db.query(
      `SELECT id_estado FROM "Estados" WHERE estado = $1`, 
      [estado]
    );
    
    if (estadoQuery.rows.length === 0) {
      return res.status(400).json({ error: 'El estado especificado no es válido.' });
    }
    const id_estado = estadoQuery.rows[0].id_estado;

    // 2. Lógica Reactiva para la Ciudad Opcional
    let id_ciudad = null; // Por defecto es null si el frontend no envía nada
    
    if (ciudad && ciudad.trim() !== "") {
      const ciudadQuery = await req.db.query(
        `SELECT id_ciudad FROM "Ciudades" WHERE ciudad = $1 AND id_estado = $2`, 
        [ciudad, id_estado]
      );
      
      if (ciudadQuery.rows.length === 0) {
        return res.status(400).json({ error: 'La ciudad especificada no pertenece al estado seleccionado.' });
      }
      id_ciudad = ciudadQuery.rows[0].id_ciudad;
    }

    // 3. Insertamos en la Base de Datos (id_ciudad pasará como entero o como NULL)
    const insertQuery = `
      INSERT INTO "Clientes" (
        razon_social, rif_dni, id_estado, id_ciudad, 
        numero_telefonico, correo_electronico, contacto, direccion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await req.db.query(insertQuery, [
      razon_social, rif_dni, id_estado, id_ciudad, 
      numero_telefonico, correo_electronico, contacto, direccion
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error interno al registrar el cliente' });
  }
}

// Actualizar cliente existente (PUT)
export async function actualizarCliente(req, res) {
  const id = req.params.id;
  const { 
    razon_social, rif_dni, estado, ciudad, 
    numero_telefonico, correo_electronico, contacto, direccion 
  } = req.body;

  try {
    // 1. Validamos el Estado
    const estadoQuery = await req.db.query(
      `SELECT id_estado FROM "Estados" WHERE estado = $1`, 
      [estado]
    );
    
    if (estadoQuery.rows.length === 0) {
      return res.status(400).json({ error: 'El estado especificado no es válido.' });
    }
    const id_estado = estadoQuery.rows[0].id_estado;

    // 2. Evaluamos la Ciudad Opcional
    let id_ciudad = null;
    if (ciudad && ciudad.trim() !== "") {
      const ciudadQuery = await req.db.query(
        `SELECT id_ciudad FROM "Ciudades" WHERE ciudad = $1 AND id_estado = $2`, 
        [ciudad, id_estado]
      );
      
      if (ciudadQuery.rows.length === 0) {
        return res.status(400).json({ error: 'La ciudad especificada no es válida.' });
      }
      id_ciudad = ciudadQuery.rows[0].id_ciudad;
    }

    // 3. Ejecutamos la actualización física
    const updateQuery = `
      UPDATE "Clientes" 
      SET 
        razon_social = $1, 
        rif_dni = $2, 
        id_estado = $3, 
        id_ciudad = $4, 
        numero_telefonico = $5, 
        correo_electronico = $6, 
        contacto = $7, 
        direccion = $8
      WHERE id_clientes = $9
      RETURNING *
    `;

    const result = await req.db.query(updateQuery, [
      razon_social, rif_dni, id_estado, id_ciudad, 
      numero_telefonico, correo_electronico, contacto, direccion, 
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error interno al actualizar el cliente' });
  }
}

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

