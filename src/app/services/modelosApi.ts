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

  // MAPEÓ CRUCIAL: Pasamos los alias que configuramos en el controlador al Front
  return data.map((m: any) => ({
    id: String(m.id_modelo || m.id),
    nombre: m.nombre || '',
    anoVersion: m.anoVersion || '',
    numeroSerie: m.numeroSerie || '', 
    enlaceFichaTecnica: m.enlaceFichaTecnica || '', 
    infoTecnica: m.infoTecnica || '',
    marcaId: String(m.marcaId),
    tipoEquipoId: String(m.tipoEquipoId),
    marcaNombre: m.marcaNombre || 'Sin Marca',
    tipoNombre: m.tipoNombre || 'Sin Tipo'
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
    numeroSerie: modeloData.numeroSerie, 
    enlaceFichaTecnica: (modeloData as any).enlaceFichaTecnica || null, // Alineado al controlador
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
  
  // Tu controlador retorna RETURNING * (o el mapeo seguro). Traducimos las columnas de la BD al objeto del Frontend
  return {
    id: String(resData.id_modelo || resData.id),
    nombre: resData.modelo || resData.nombre,
    anoVersion: resData.year || resData.anoVersion || '',
    numeroSerie: resData.Serie || resData.numeroSerie || '',
    enlaceFichaTecnica: resData.link_fich_tecn || resData.enlaceFichaTecnica || '',
    infoTecnica: resData.inf_tecnica || resData.infoTecnica || '',
    marcaId: String(resData.id_marca || resData.marcaId),
    tipoEquipoId: String(resData.id_tipo_equipo || resData.tipoEquipoId),
    marcaNombre: resData.marcaNombre || 'Sin Marca',
    tipoNombre: resData.tipoNombre || 'Sin Tipo'
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

// Estructura de retorno esperada para la actualización de estados de los modales en React
interface AssociationResponse {
  message: string;
  tipo: 'existing' | 'new';
  link: RepuestoModelo;
  repuesto: Repuesto | null; 
}

/**
 * 4. ASOCIAR UN REPUESTO EXISTENTE O NUEVO (POST /api/modelos/:id/repuestos)
 * Conectado con: modelosController.asociarRepuesto
 */
export async function asociarRepuestoApi(
  modeloId: string,
  payload: {
    tipo: 'existing' | 'new';
    repuestoId: string | null;
    nuevoRepuesto?: Omit<Repuesto, 'id'>;
  }
): Promise<AssociationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/modelos/${modeloId}/repuestos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo: payload.tipo,
      repuestoId: payload.repuestoId ? Number(payload.repuestoId) : null,
      nuevoRepuesto: payload.nuevoRepuesto ? {
        nombre: payload.nuevoRepuesto.nombre,
        codigoParte: payload.nuevoRepuesto.codigoParte,
        infoTecnica: payload.nuevoRepuesto.infoTecnica
      } : null
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Error al procesar la asociación del repuesto en el servidor.');
  }

  const resData = await response.json();

  // Mapeamos y normalizamos las respuestas asegurando tipos string en los identificadores
  return {
    message: resData.message,
    tipo: resData.tipo,
    link: {
      id: String(resData.link.id_repuesto_modelo || resData.link.id),
      modeloId: String(resData.link.modeloId),
      repuestoId: String(resData.link.repuestoId)
    },
    repuesto: resData.repuesto ? {
      id: String(resData.repuesto.id_repuesto || resData.repuesto.id),
      nombre: resData.repuesto.nombre,
      codigoParte: resData.repuesto.codigoParte,
      infoTecnica: resData.repuesto.infoTecnica || ''
    } : null
  };
}

/**
 * 5. OBTENER TODAS LAS RELACIONES DE COMPONENTES ACTIVAS (GET /api/modelos/repuestos/links)
 * Nota: Asegúrate de tener este endpoint mapeado en tus rutas apuntando a una consulta SELECT * FROM "Repuesto_Modelo"
 */
export async function getAllRepuestosModelosLinksApi(): Promise<RepuestoModelo[]> {
  const response = await fetch(`${API_BASE_URL}/api/modelos/repuestos/links`);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Error al obtener la lista de relaciones de repuestos.');
  }

  const data = await response.json();
  
  return data.map((link: any) => ({
    id: String(link.id_repuesto_modelo || link.id),
    modeloId: String(link.id_modelo || link.modeloId),
    repuestoId: String(link.id_repuesto || link.repuestoId)
  }));
}