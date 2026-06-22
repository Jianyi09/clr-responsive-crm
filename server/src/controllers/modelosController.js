// server/src/controllers/modelosController.js
import pool from '../db/index.js'; // Ajustado a la misma ruta de base de datos que usa tu controlador de Equipos

// 1. OBTENER TODOS LOS MODELOS
// Endpoint: GET /api/modelos
export async function getAllModelos(req, res) {
  try {
      // Usamos req.db para mantener consistencia con el middleware global
      const db = req.db || pool;

      // Ejecutamos en paralelo todas las consultas necesarias
      const [resultadosModelos, listaMarcas, listaTipos] = await Promise.all([
        db.query(`
          SELECT 
            m.id_modelo, 
            m.id_tipo_equipo, 
            m.id_marca, 
            m.modelo AS "nombre", 
            m.year AS "anoVersion", 
            m."Serie" AS "numeroSerie", 
            m.inf_tecnica AS "infoTecnica",  
            m.link_fich_tecn AS "enlaceFichaTecnica",
            ma.marca AS "marcaNombre",
            t.nombre_tipo_equipo AS "tipoNombre"
          FROM "Modelos_Equipos" m
          LEFT JOIN "Marcas_Equipos" ma ON m.id_marca = ma.id_marca
          LEFT JOIN "Tipos_Equipos" t ON m.id_tipo_equipo = t.id_tipo_equipo
          ORDER BY m.id_modelo ASC
        `),
        db.query('SELECT id_marca, marca AS "marcaNombre" FROM "Marcas_Equipos" ORDER BY marca ASC'),
        db.query('SELECT id_tipo_equipo, nombre_tipo_equipo AS "tipoNombre" FROM "Tipos_Equipos" ORDER BY nombre_tipo_equipo ASC')
      ]);

      res.json({
        marcas: listaMarcas.rows,
        modelos: resultadosModelos.rows,
        tiposEquipo: listaTipos.rows
      });
    } catch (err) {
      console.error('Database Error en Equipos Dashboard:', err && err.stack ? err.stack : err);
      res.status(500).json({ error: 'Error consultando los datos de modelos de equipos en la base de datos' });
    }
  }

// ==========================================
// 2. CREAR MODELO (CORREGIDO)
// ==========================================
export async function createModelo(req, res) {
  const { 
    nombre, marcaId, tipoEquipoId, anoVersion, numeroSerie, infoTecnica, enlaceFichaTecnica 
  } = req.body;

  try {
    const insertQuery = `
      INSERT INTO "Modelos_Equipos" ( 
        modelo, id_marca, id_tipo_equipo, year, "Serie", inf_tecnica, link_fich_tecn
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_modelo
    `;

    const db = req.db || pool;
    const result = await db.query(insertQuery, [
      nombre, marcaId, tipoEquipoId, anoVersion, numeroSerie, infoTecnica, enlaceFichaTecnica
    ]);

    res.status(201).json({ id: result.rows[0].id_equipo });
  } catch (error) {
    console.error('Error al crear modelo:', error);
    res.status(500).json({ error: 'Error interno al registrar el modelo' });
  }
}

// ==========================================
// 3. ACTUALIZAR MODELO (VERIFICADO)
// ==========================================
export async function updateModelo(req, res) {
  const id = req.params.id;
  const { nombre, marcaId, tipoEquipoId, anoVersion, numeroSerie, infoTecnica, enlaceFichaTecnica } = req.body;

  try {
    const updateQuery = `
      UPDATE "Modelos_Equipos"
      SET 
        modelo = $1, 
        id_marca = $2, 
        id_tipo_equipo = $3, 
        year = $4, 
        "Serie" = $5, 
        inf_tecnica = $6, 
        link_fich_tecn = $7
      WHERE id_modelo = $8
      RETURNING id_modelo
    `;

    const db = req.db || pool;
    const result = await db.query(updateQuery, [
      nombre, marcaId, tipoEquipoId, anoVersion, numeroSerie, infoTecnica, enlaceFichaTecnica, id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'modelo no encontrado' });
    }

    res.json({ id: result.rows[0].id_modelo });
  } catch (error) {
    console.error('Error al actualizar el modelo:', error);
    res.status(500).json({ error: 'Error interno al actualizar el modelo' });
  }
}

// 4. ELIMINAR MODELO
// Endpoint: DELETE /api/modelos/:id
export async function deleteModelo(req, res) {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM "Modelos_Equipos" WHERE id_modelo = $1';
    
    const db = req.db || pool;
    const result = await db.query(query, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'modelo no encontrado' });
    }
    res.json({ message: 'modelo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el modelo:', error);
    res.status(500).json({ error: 'Error al intentar eliminar el modelo' });
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