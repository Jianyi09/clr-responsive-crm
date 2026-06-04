import pool from '../db/index.js';
/**
 * @returns {Promise<Object>} Un objeto con la estructura { [id_cliente]: cantidad_equipos }
 */
export async function getConteEquiposPorCliente() {
  const query = `
    SELECT id_cliente, COUNT(id_equipo)::INT AS total 
    FROM "Equipos_Clientes" 
    GROUP BY id_cliente
  `;
  const res = await pool.query(query);
  
  // Convertimos el array de filas en un objeto indexado para búsquedas instantáneas O(1)
  const conteoMap = {};
  res.rows.forEach(row => {
    conteoMap[row.id_cliente] = row.total;
  });
  
  return conteoMap;
}

export function extractFilterSelections(query) {
  return {
    search: query.search || null,
    estado: query.estado || null,
    tipoEquipoId: query.tipoEquipoId || query.tipo || null,
    modeloId: query.modeloId || null,
    marcaId: query.marcaId || null,
    equipoId: query.equipoId || null,
  };
}

export function buildClientFilterConditions(selections, alias = 'c') {
  const condiciones = [];
  const valores = [];

  if (selections.search) {
    valores.push(`%${selections.search}%`);
    valores.push(`%${selections.search}%`);
    condiciones.push(`(LOWER(${alias}.razon_social) LIKE LOWER($${valores.length - 1}) OR LOWER(${alias}.rif_dni) LIKE LOWER($${valores.length}))`);
  }

  if (selections.estado) {
    valores.push(selections.estado);
    condiciones.push(`Est.estado ILIKE $${valores.length}`);
  }

  return { condiciones, valores };
}

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

export function buildWhereClause(condiciones) {
  if (!condiciones || condiciones.length === 0) return '';
  return `WHERE ${condiciones.join(' AND ')}`;
}

export async function getEstadoIdPorNombre(nombre) {
  if (!nombre) return null;
  const res = await pool.query(`SELECT id_estado FROM "Estados" WHERE LOWER(TRIM(estado)) = LOWER(TRIM($1)) LIMIT 1`, [nombre]);
  if (res.rows.length === 0) return null;
  return res.rows[0].id_estado;
}
