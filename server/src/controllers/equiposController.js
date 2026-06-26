// server/src/controllers/equiposController.js
import pool from '../db/index.js';
import {
  extractFilterSelections,
  buildWhereClause
} from '../utils/dbHelpers.js';

// GET /api/equipos/dashboard
export async function getEquiposDashboardApi(req, res) {
  try {
    const db = req.db || pool;

    const selections = extractFilterSelections(req.query);
    
    // Configuración para la Query de Equipos
    const condicionesEquipos = [];
    const valoresEquipos = [];

    if (selections.estado && selections.estado !== 'todos') {
      valoresEquipos.push(selections.estado);
      condicionesEquipos.push(`Est.estado = $${valoresEquipos.length}`);
    }

    if (selections.tipoEquipo && selections.tipoEquipo !== 'todos') {
      valoresEquipos.push(Number(selections.tipoEquipo));
      condicionesEquipos.push(`E.id_tipo_equipo = $${valoresEquipos.length}`);
    }

    const whereClauseEquipos = buildWhereClause(condicionesEquipos);

    const queryEquiposFiltrados = `
      SELECT 
        E.id_equipo, 
        E.id_cliente, 
        E.id_tipo_equipo, 
        E.id_marca, 
        E.id_modelo, 
        E.alias_interno, 
        E."Observacion" AS "observacion", 
        E.serial, 
        E.informacion_tecnica AS "info_tecnica" 
      FROM "Equipos_Clientes" E
      INNER JOIN "Clientes" C ON E.id_cliente = C.id_clientes
      INNER JOIN "Estados" Est ON C.id_estado = Est.id_estado
      ${whereClauseEquipos}
      ORDER BY E.id_equipo DESC
    `;

    let queryClientesFiltrados = `
      SELECT id_clientes, razon_social 
      FROM "Clientes" 
      ORDER BY razon_social ASC
    `;
    const valoresClientes = [];

    // Si hay un estado seleccionado, limitamos también los clientes devueltos para que el front mapee correctamente
    if (selections.estado && selections.estado !== 'todos') {
      valoresClientes.push(selections.estado);
      queryClientesFiltrados = `
        SELECT C.id_clientes, C.razon_social 
        FROM "Clientes" C
        INNER JOIN "Estados" Est ON C.id_estado = Est.id_estado
        WHERE Est.estado = $1
        ORDER BY C.razon_social ASC
      `;
    }

    // Ejecución paralela con ambas estructuras sincronizadas
    const [resultadoEquipos, resultadoClientes, resultadoMarcas, resultadoModelos, resultadoTipos] = await Promise.all([
      db.query(queryEquiposFiltrados, valoresEquipos),
      db.query(queryClientesFiltrados, valoresClientes),
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
    clienteId, tipoEquipoId, marcaId, modeloId, aliasInterno, observacion, serial, infoTecnica } = req.body;

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