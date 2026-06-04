const catalogs = {
  clientes: { table: 'Clientes', orderBy: 'id_clientes' },
  equipos: { table: 'Equipos_Clientes', orderBy: 'id_equipo' },
  modelos: { table: 'Modelos_Equipos', orderBy: 'id_modelo' },
  marcas: { table: 'Marcas', orderBy: 'id_marca' },
  tiposEquipo: { table: 'Tipos_Equipo', orderBy: 'id_tipo_equipo' },
};

export async function getCatalogData(req, res) {
  const name = req.params.name;
  const catalog = catalogs[name];

  if (!catalog) {
    return res.status(404).json({ error: 'Catálogo no encontrado' });
  }

  try {
    const result = await req.db.query(
      `SELECT * FROM "${catalog.table}" ORDER BY ${catalog.orderBy}`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(`Error al obtener ${name}:`, error);
    res.status(500).json({ error: `Error al obtener ${name}` });
  }
}
