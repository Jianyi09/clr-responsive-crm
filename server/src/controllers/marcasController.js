import pool from '../db/index.js';

/**
 * Registra una nueva marca en la base de datos si no existe.
 */
// server/src/controllers/marcasController.js

export const crearMarca = async (req, res) => {
  let { marcaNombre } = req.body;

  // 🛡️ CONTROL ULTRA SEGURO DE TIPOS DE DATOS:
  // Si por error del front llega como un objeto { marcaNombre: '...' } extraemos el string
  if (marcaNombre && typeof marcaNombre === 'object' && marcaNombre.marcaNombre) {
    marcaNombre = marcaNombre.marcaNombre;
  }

  // Si no es un string válido en este punto, lo forzamos a un string vacío para evitar que .trim() rompa el servidor
  if (typeof marcaNombre !== 'string') {
    marcaNombre = '';
  }

  // 1. Validación básica de la entrada (¡Ya no se romperá jamás!)
  if (!marcaNombre || !marcaNombre.trim()) {
    return res.status(400).json({ 
      error: 'El nombre de la marca es requerido obligatorio.' 
    });
  }

  try {
    const nombreLimpio = marcaNombre.trim();

    // 2. Verificar si la marca ya existe (Case-Insensitive)
    const existeMarca = await pool.query(
      'SELECT id_marca AS "id", marca AS "marcaNombre" FROM "Marcas_Equipos" WHERE LOWER(marca) = LOWER($1)',
      [nombreLimpio]
    );

    if (existeMarca.rows.length > 0) {
      return res.status(200).json({
        id: String(existeMarca.rows[0].id),
        marcaNombre: existeMarca.rows[0].marcaNombre
      });
    }

    // 3. Insertar la nueva marca
    const query = `
      INSERT INTO "Marcas_Equipos" (marca) 
      VALUES ($1) 
      RETURNING id_marca, marca;
    `;
    
    const nuevoRegistro = await pool.query(query, [nombreLimpio]);
    
    // 4. Mapear la respuesta de forma estricta usando las columnas de la BD
    res.status(201).json({
      id: String(nuevoRegistro.rows[0].id_marca),
      marcaNombre: nuevoRegistro.rows[0].marca
    });

  } catch (error) {
    console.error('Error en crearMarca:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al registrar la marca.' 
    });
  }
};