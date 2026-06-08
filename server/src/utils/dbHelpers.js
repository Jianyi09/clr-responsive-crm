import pool from '../db/index.js';

/**
 * Catálogo Dinámico de Ubicaciones
 * Consulta la base de datos y une los Estados con sus respectivas Ciudades.
 * Transformamos las filas planas de SQL en un diccionario agrupado para el Frontend.
 * * @returns {Promise<Object>} Un objeto como: { 'Carabobo': ['Valencia', 'Guacara'], 'Aragua': ['Maracay'] }
 */
export async function getUbicationCatalogHelper() {
  // 1. Buscamos la relación exacta uniendo las tablas por su ID único
  const query = `
    SELECT e.estado AS estado, c.ciudad AS ciudad 
    FROM "Estados" e
    INNER JOIN "Ciudades" c ON e.id_estado = c.id_estado
    ORDER BY e.estado, c.ciudad
  `;
  
  const res = await pool.query(query);
  const ubicaciones = {};
  
  // 2. Agrupamos: Si el estado no existe en nuestro objeto, lo creamos como una lista vacía
  // y luego le empujamos (.push) su ciudad correspondiente.
  res.rows.forEach(row => {
    if (!ubicaciones[row.estado]) {
      ubicaciones[row.estado] = [];
    }
    if (!ubicaciones[row.estado].includes(row.ciudad)) {
      ubicaciones[row.estado].push(row.ciudad);
    }
  });

  return ubicaciones;
}

/**
 * HELPER: Conteo de Equipos (Para saber qué tiene cada cliente)
 * Va a la tabla relacional intermedia y cuenta cuántos generadores o vehículos tiene asignados cada cliente.
 * * @returns {Promise<Object>} Un mapa indexado rápido: { [id_cliente]: cantidad_equipos }
 */
export async function getConteoEquiposPorCliente() {
  const query = `
    SELECT id_cliente, COUNT(id_equipo)::INT AS total 
    FROM "Equipos_Clientes" 
    GROUP BY id_cliente
  `;
  const res = await pool.query(query);
  
  // Convertimos el array de filas en un objeto indexado para búsquedas instantáneas O(1)
  // En vez de buscar recorriendo un array gigante, JavaScript va directo a la "llave" del ID del cliente
  const conteoMap = {};
  res.rows.forEach(row => {
    conteoMap[row.id_cliente] = row.total;
  });
  
  return conteoMap;
}

/**
 * HELPER: Extractor de Parámetros de URL
 * Toma lo que el usuario escribió en la barra de direcciones o filtros (Query params)
 * y asegura que si algo no se seleccionó, se procese limpiamente como un valor nulo (null).
 */
export function extractFilterSelections(query) {
  return {
    search: query.search || null,                 // Texto libre (Ej: "Café")
    estado: query.estado || null,                 // Estado (Ej: "Carabobo")
    tipoEquipoId: query.tipoEquipoId || query.tipo || null,
    modeloId: query.modeloId || null,
    marcaId: query.marcaId || null,
    equipoId: query.equipoId || null,
  };
}

/**
 * HELPER: Constructor de Condiciones para Clientes
 * Es una "fábrica" de texto SQL. Si el usuario buscó por texto o estado, 
 * añade las cláusulas LIKE e ILIKE y guarda los parámetros en un orden seguro ($1, $2)
 * para evitar hackeos por inyección SQL.
 */
export function buildClientFilterConditions(selections, alias = 'c') {
  const condiciones = []; // Almacenará cadenas de texto como: ["LOWER(c.razon_social) LIKE $1"]
  const valores = [];     // Almacenará los datos reales ordenados como: ["%empresa%"]

  // Si el usuario usó la barra de búsqueda superior
  if (selections.search) {
    valores.push(`%${selections.search}%`);
    valores.push(`%${selections.search}%`);
    // Añade la condición dinámicamente mapeando el índice de los comodines $1, $2, etc.
    condiciones.push(`(LOWER(${alias}.razon_social) LIKE LOWER($${valores.length - 1}) OR LOWER(${alias}.rif_dni) LIKE LOWER($${valores.length}))`);
  }

  // Si el usuario seleccionó un filtro por Estado geográfico
  if (selections.estado) {
    valores.push(selections.estado);
    condiciones.push(`Est.estado ILIKE $${valores.length}`);
  }

  return { condiciones, valores };
}

/**
 * HELPER: Inyector de Filtros de Equipos Técnicos
 * Si los filtros también involucran maquinaria pesada o motores diésel del Dashboard,
 * este helper añade las condiciones a las listas existentes pasadas por referencia.
 */
export function addEquipmentFilterConditions(condiciones, valores, selections) {
  if (selections.tipoEquipoId) {
    valores.push(selections.tipoEquipoId);
    condiciones.push(`E.id_tipo_equipo = $${valores.length}`);
  }
  if (selections.modeloId) {
    valores.push(selections.modeloId);
    condiciones.push(`E.id_modelo = $${valores.length}`);
  }
  if (selections.marcaId) {
    valores.push(selections.marcaId);
    condiciones.push(`E.id_marca = $${valores.length}`);
  }
  if (selections.equipoId) {
    valores.push(selections.equipoId);
    condiciones.push(`E.id_equipo = $${valores.length}`);
  }
}

/**
 * HELPER: Pegamento del Bloque WHERE
 * Toma tu lista de condiciones separadas ["condicion1", "condicion2"] 
 * y las une con la palabra clave SQL para crear una consulta válida: "WHERE condicion1 AND condicion2"
 */
export function buildWhereClause(condiciones) {
  if (!condiciones || condiciones.length === 0) return '';
  return `WHERE ${condiciones.join(' AND ')}`;
}

/**
 * HELPER: Conversor de Texto a ID Numérico de Estado
 * Útil para cuando el Frontend te manda un string (como 'Carabobo') pero la base de datos 
 * necesita el id numérico de clave foránea (como 3) para guardarlo o buscarlo en los registros.
 */
export async function getEstadoIdPorNombre(nombre) {
  if (!nombre) return null;
  // Convierte todo a minúsculas y remueve espacios en blanco (TRIM) para evitar fallos tipográficos
  const res = await pool.query(`SELECT id_estado FROM "Estados" WHERE LOWER(TRIM(estado)) = LOWER(TRIM($1)) LIMIT 1`, [nombre]);
  if (res.rows.length === 0) return null;
  return res.rows[0].id_estado;
}