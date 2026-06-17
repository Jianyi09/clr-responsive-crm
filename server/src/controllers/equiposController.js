// server/src/controllers/equiposController.js
import pool from '../db/index.js';

// GET /api/equipos/dashboard
export async function getEquiposDashboardApi(req, res) {
  try {
    // Usamos req.db para mantener consistencia con el middleware global
    const db = req.db || pool;

    // Ejecutamos en paralelo todas las consultas necesarias
    const [resultadoEquipos, resultadoClientes, resultadoMarcas, resultadoModelos, resultadoTipos] = await Promise.all([
      db.query('SELECT id_equipo, id_cliente, id_tipo_equipo, id_marca, id_modelo, alias_interno, "Observacion" AS "observacion", serial, informacion_tecnica AS "info_tecnica" FROM "Equipos_Clientes" ORDER BY id_equipo DESC'),
      db.query('SELECT id_clientes, razon_social FROM "Clientes" ORDER BY razon_social ASC'),
      db.query('SELECT id_marca, marca AS "marcaNombre" FROM "Marcas_Equipos" ORDER BY marca ASC'),
      db.query('SELECT id_modelo, id_marca, id_tipo_equipo, modelo AS "nombre" FROM "Modelos_Equipos" ORDER BY modelo ASC'),
      db.query('SELECT id_tipo_equipo, nombre_tipo_equipo AS "tipoNombre" FROM "Tipos_Equipos" ORDER BY nombre_tipo_equipo ASC')
    ]);

    res.json({
      equipos: resultadoEquipos.rows,
      clientes: resultadoClientes.rows,
      marcas: resultadoMarcas.rows,
      modelos: resultadoModelos.rows,
      tiposEquipo: resultadoTipos.rows
    });
  } catch (err) {
    console.error('Database Error en Equipos Dashboard:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Error consultando los datos de equipos en la base de datos' });
  }
}

// POST /api/equipos
export async function crearEquipo(req, res) {
  const { 
    clienteId, tipoEquipoId, marcaId, modeloId, 
    aliasInterno, observacion, serial, infoTecnica 
  } = req.body;

  try {
    const insertQuery = `
      INSERT INTO "Equipos_Clientes" (
        id_cliente, id_tipo_equipo, id_marca, id_modelo, 
        alias_interno, "Observacion", serial, informacion_tecnica
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id_equipo
    `;

    const db = req.db || pool;
    const result = await db.query(insertQuery, [
      clienteId, tipoEquipoId, marcaId, modeloId, 
      aliasInterno, observacion, serial, infoTecnica
    ]);

    res.status(201).json({ id: result.rows[0].id_equipo });
  } catch (error) {
    console.error('Error al crear equipo:', error);
    res.status(500).json({ error: 'Error interno al registrar el equipo' });
  }
}

// PUT /api/equipos/:id
export async function actualizarEquipo(req, res) {
  const id = req.params.id;
  const { 
    clienteId, tipoEquipoId, marcaId, modeloId, 
    aliasInterno, observacion, serial, infoTecnica 
  } = req.body;

  try {
    const updateQuery = `
      UPDATE "Equipos_Clientes"
      SET 
        id_cliente = $1, 
        id_tipo_equipo = $2, 
        id_marca = $3, 
        id_modelo = $4, 
        alias_interno = $5, 
        "Observacion" = $6, 
        serial = $7, 
        informacion_tecnica = $8
      WHERE id_equipo = $9
      RETURNING id_equipo
    `;

    const db = req.db || pool;
    const result = await db.query(updateQuery, [
      clienteId, tipoEquipoId, marcaId, modeloId, 
      aliasInterno, observacion, serial, infoTecnica, 
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.json({ id: result.rows[0].id_equipo });
  } catch (error) {
    console.error('Error al actualizar equipo:', error);
    res.status(500).json({ error: 'Error interno al actualizar el equipo' });
  }
}

// DELETE /api/equipos/:id
export async function eliminarEquipo(req, res) {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM "Equipos_Clientes" WHERE id_equipo = $1';
    
    const db = req.db || pool;
    const result = await db.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.json({ message: 'Equipo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    res.status(500).json({ error: 'Error al intentar eliminar el equipo' });
  }
}