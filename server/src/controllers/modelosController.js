// server/src/controllers/modelosController.js
import pool from '../db/index.js'; // Ajustado a la misma ruta de base de datos que usa tu controlador de Equipos

// 1. OBTENER TODOS LOS MODELOS
// Endpoint: GET /api/modelos
export async function getAllModelos(req, res) {
  try {
    const db = req.db || pool;
    const query = `
      SELECT 
        m.id_modelo AS id, 
        m.modelo AS nombre,
        m.year AS anoVersion,
        m."Serie" AS numeroSerie,
        m.inf_tecnica AS infoTecnica,
        m.link_fich_tecn AS enlaceFichaTecnica,
        m.id_marca AS marcaId,
        m.id_tipo_equipo AS tipoEquipoId,
        ma.marca AS marcaNombre, 
        te.nombre_tipo_equipo AS tipoNombre
      FROM "Modelos_Equipos" m
      JOIN "Marcas_Equipos" ma ON m.id_marca = ma.id_marca
      JOIN "Tipos_Equipos" te ON m.id_tipo_equipo = te.id_tipo_equipo
      ORDER BY m.modelo ASC;
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Database Error en getAllModelos:', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Error al obtener los modelos' });
  }
}

// 2. CREAR MODELO
// Endpoint: POST /api/modelos
export async function createModelo(req, res) {
  try {
    const { nombre, marcaId, tipoEquipoId, anoVersion, numeroSerie, infoTecnica, enlaceFichaTecnica } = req.body;
    const query = `
      INSERT INTO "Modelos_Equipos" (modelo, id_marca, id_tipo_equipo, year, "Serie", inf_tecnica, link_fich_tecn)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `;
    const db = req.db || pool;
    const { rows } = await db.query(query, [nombre, marcaId, tipoEquipoId, anoVersion, numeroSerie, infoTecnica, enlaceFichaTecnica]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error al crear el modelo:', error);
    res.status(500).json({ error: 'Error al crear el modelo' });
  }
}

// 3. ACTUALIZAR MODELO
// Endpoint: PUT /api/modelos/:id
export async function updateModelo(req, res) {
  try {
    const { id } = req.params;
    const { nombre, marcaId, tipoEquipoId, anoVersion, numeroSerie, infoTecnica, enlaceFichaTecnica } = req.body;
    const query = `
      UPDATE "Modelos_Equipos" 
      SET modelo = $1, id_marca = $2, id_tipo_equipo = $3, year = $4, "Serie" = $5, inf_tecnica = $6, link_fich_tecn = $7
      WHERE id_modelo = $8 RETURNING *;
    `;
    const db = req.db || pool;
    const { rows } = await db.query(query, [nombre, marcaId, tipoEquipoId, anoVersion, numeroSerie, infoTecnica, enlaceFichaTecnica, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Modelo no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al actualizar el modelo:', error);
    res.status(500).json({ error: 'Error al actualizar el modelo' });
  }
}

// 4. ELIMINAR MODELO
// Endpoint: DELETE /api/modelos/:id
export async function deleteModelo(req, res) {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM "Modelos_Equipos" WHERE id_modelo = $1';
    
    const db = req.db || pool;
    const result = await db.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Modelo no encontrado' });
    }
    res.json({ message: 'Modelo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el modelo:', error);
    res.status(500).json({ error: 'Error al eliminar el modelo' });
  }
}

// 5. ASOCIAR REPUESTO EXISTENTE O NUEVO
// Endpoint: POST /api/modelos/:id/repuestos
export async function asociarRepuesto(req, res) {
  const { id: modeloId } = req.params;
  const { tipo, repuestoId, nuevoRepuesto } = req.body;

  // Si tu middleware inyecta una pool diferente, la usamos para el .connect() de la transacción
  const basePool = req.db || pool;
  const client = await basePool.connect();
  
  try {
    await client.query('BEGIN'); // Iniciamos la transacción de forma segura

    let finalRepuestoId = repuestoId;
    let repuestoCreado = null;

    if (tipo === 'new') {
      const insertRepuestoQuery = `
        INSERT INTO "Lista_Repuestos" (tipo_repuesto, modelo_repuesto, inf_tecnica)
        VALUES ($1, $2, $3) 
        RETURNING id_repuesto, tipo_repuesto AS nombre, modelo_repuesto AS codigoParte, inf_tecnica AS infoTecnica;
      `;
      const resRepuesto = await client.query(insertRepuestoQuery, [
        nuevoRepuesto.nombre,      
        nuevoRepuesto.codigoParte,
        nuevoRepuesto.infoTecnica
      ]);
      
      repuestoCreado = resRepuesto.rows[0];
      finalRepuestoId = repuestoCreado.id_repuesto;
    }

    const insertLinkQuery = `
      INSERT INTO "Repuesto_Modelo" (id_modelo, id_repuesto)
      VALUES ($1, $2) 
      RETURNING id_repuesto_modelo, id_modelo AS "modeloId", id_repuesto AS "repuestoId";
    `;
    const resLink = await client.query(insertLinkQuery, [modeloId, finalRepuestoId]);

    await client.query('COMMIT'); // Confirmamos los cambios si todo salió bien
    
    res.status(201).json({
      message: 'Repuesto asociado con éxito',
      tipo: tipo,
      link: resLink.rows[0],
      repuesto: repuestoCreado
    });
  } catch (error) {
    await client.query('ROLLBACK'); // Cancelamos todo el bloque en caso de fallo
    console.error('Error en la transacción de asociación de repuesto:', error);
    res.status(500).json({ error: 'Error al procesar la asociación del repuesto' });
  } finally {
    client.release(); // Liberamos el cliente de vuelta al pool
  }
}