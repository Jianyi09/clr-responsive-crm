import { Modelo, Repuesto, RepuestoModelo } from '../data/mockData';

const API_BASE_URL = 'http://localhost:4000';

/**
 * 1. OBTENER TODOS LOS MODELOS (GET /api/modelos)
 * Conectado con: modelosController.getAllModelos
 */
export async function getModelosApi(): Promise<Modelo[]> {
  const response = await fetch(`${API_BASE_URL}/api/modelos`);
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Error al obtener el listado de modelos del servidor.');
  }
  
  const data = await response.json();

  // Aseguramos que los tipos de datos e IDs vengan estructurados como strings para evitar fallas en el Front
  return data.map((m: any) => ({
    id: String(m.id),
    nombre: m.nombre || '',
    anoVersion: m.anoVersion || '',
    numeroSerie: m.numeroSerie || '', // Mapeado directamente desde la columna "Serie" de la BD
    linkFichTecn: m.linkFichTecn || '',
    infoTecnica: m.infoTecnica || '',
    marcaId: String(m.marcaId),
    tipoEquipoId: String(m.tipoEquipoId),
  }));
}

/**
 * 2. GUARDAR O ACTUALIZAR MODELO (POST o PUT)
 * Conectado con: modelosController.createModelo y modelosController.updateModelo
 */
export async function saveModeloApi(
  modeloData: Omit<Modelo, 'id'>, 
  id?: string
): Promise<Modelo> {
  const url = id ? `${API_BASE_URL}/api/modelos/${id}` : `${API_BASE_URL}/api/modelos`;
  const method = id ? 'PUT' : 'POST';

  // Traducimos lo que viene de la UI al formato plano exacto que espera el req.body del controlador
  const bodyBackend = {
    nombre: modeloData.nombre,
    anoVersion: modeloData.anoVersion,
    numeroSerie: modeloData.numeroSerie, // Viaja como numeroSerie al backend
    linkFichTecn: (modeloData as any).linkFichTecn || null, // Atributo opcional de ficha técnica
    infoTecnica: modeloData.infoTecnica,
    marcaId: Number(modeloData.marcaId),
    tipoEquipoId: Number(modeloData.tipoEquipoId)
  };

  const response = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyBackend),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Error al procesar la solicitud del modelo en el servidor.');
  }

  const resData = await response.json();
  
  // Retornamos el objeto insertado/actualizado normalizado para actualizar el estado local de React
  return {
    id: String(resData.id),
    nombre: resData.nombre,
    anoVersion: resData.anoVersion || '',
    numeroSerie: resData.numeroSerie || '',
    linkFichTecn: resData.linkFichTecn || '',
    infoTecnica: resData.infoTecnica || '',
    marcaId: String(resData.marcaId),
    tipoEquipoId: String(resData.tipoEquipoId)
  };
}

/**
 * 3. ELIMINAR MODELO (DELETE /api/modelos/:id)
 * Conectado con: modelosController.deleteModelo
 */
export async function deleteModeloApi(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/modelos/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'No se pudo eliminar el modelo del servidor.');
  }
}

/**
 * 4. VINCULAR UN REPUESTO CON UN MODELO (POST /api/modelos/repuestos)
 * Conectado con: modelosController.linkRepuestoToModelo
 */
export async function linkRepuestoToModeloApi(modeloId: string, repuestoId: string): Promise<RepuestoModelo> {
  const response = await fetch(`${API_BASE_URL}/api/modelos/repuestos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modeloId: Number(modeloId),
      repuestoId: Number(repuestoId)
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Error al asociar el repuesto con el modelo.');
  }

  const resData = await response.json();
  
  return {
    modeloId: String(resData.modeloId),
    repuestoId: String(resData.repuestoId)
  };
}

/**
 * 5. OBTENER TODAS LAS RELACIONES DE COMPONENTES ACTIVAS (GET /api/modelos/repuestos/links)
 * Conectado con: modelosController.getAllRepuestosModelosLinks
 */
export async function getAllRepuestosModelosLinksApi(): Promise<RepuestoModelo[]> {
  const response = await fetch(`${API_BASE_URL}/api/modelos/repuestos/links`);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Error al obtener la lista de relaciones de repuestos.');
  }

  const data = await response.json();
  
  return data.map((link: any) => ({
    modeloId: String(link.modeloId),
    repuestoId: String(link.repuestoId)
  }));
}