import pool from '../db/index.js';

/**
 * Registra una nueva marca en la base de datos si no existe.
 */
export const crearMarca = async (req, res) => {
  const { marcaNombre } = req.body;

  // 1. Validación básica de la entrada
  if (!marcaNombre || !marcaNombre.trim()) {
    return res.status(400).json({ 
      error: 'El nombre de la marca es requerido obligatorio.' 
    });
  }

  try {
    const nombreLimpio = marcaNombre.trim();

    // 2. Verificar si la marca ya existe (Case-Insensitive)
    const existeMarca = await pool.query(
      'SELECT id_marca, marca FROM "Marcas_Equipos" WHERE LOWER(marca) = LOWER($1)',
      [nombreLimpio]
    );

    if (existeMarca.rows.length > 0) {
      // Si existe, retornamos amigablemente el registro existente sin duplicar
      return res.status(200).json({
        id: String(existeMarca.rows[0].id_marca),
        marcaNombre: existeMarca.rows[0].marca
      });
    }

    // 3. Insertar la nueva marca y retornar el ID generado por el SERIAL
    const query = `
      INSERT INTO "Marcas_Equipos" (marca) 
      VALUES ($1) 
      RETURNING id_marca, marca;
    `;
    
    const nuevoRegistro = await pool.query(query, [nombreLimpio]);
    
    // 4. Mapear la respuesta a camelCase para mantener la consistencia con el Frontend
    res.status(201).json({
      id: String(nuevoRegistro.rows[0].id_marca),
      marcaNombre: nuevoRegistro.rows[0].marca_nombre
    });

  } catch (error) {
    console.error('Error en crearMarca:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al registrar la marca.' 
    });
  }
};