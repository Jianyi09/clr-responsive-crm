import { Modelo, Marca, Repuesto, RepuestoModelo, TipoEquipo } from '../data/mockData';
import { API_BASE_URL } from './api';

export interface ModelosDashboard {
  marcas: Marca[];
  tiposEquipo: TipoEquipo[];
  modelos: Modelo[];
  repuestos: Repuesto[];
  links: RepuestoModelo[];
}

/**
 * 1. OBTENER TODOS LOS MODELOS (GET /api/modelos)
 * Conectado con: modelosController.getAllModelos
 */
export async function getModelosApi(): Promise<ModelosDashboard> {
  const response = await fetch(`${API_BASE_URL}/api/modelos/dashboard`);
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Error al obtener el listado de modelos del servidor.');
  }
  
  const data = await response.json();

  return {
    marcas: (data.marcas || []).map((m: any) => ({
      id: String(m.id_marca),
      marcaNombre: m.marcaNombre,
    })),
    modelos: (data.modelos || []).map((mod: any) => ({
      id: String(mod.id_modelo),
      marcaId: String(mod.id_marca),
      tipoEquipoId: String(mod.id_tipo_equipo),
      nombre: mod.nombre,
      anoVersion: mod.anoVersion || '',
      numeroSerie: mod.numeroSerie || '',
      marcaNombre: mod.marcaNombre || '',
      tipoNombre: mod.tipoNombre || '',
    })),
    tiposEquipo: (data.tiposEquipo || []).map((t: any) => ({
      id: String(t.id_tipo_equipo),
      tipoNombre: t.tipoNombre,
    })),
    repuestos: (data.repuestos || []).map((r: any) => ({
      id: String(r.id),
      nombre: r.nombre,
      codigoParte: r.codigoParte,
      infoTecnica: r.infoTecnica || '',
    })),
    links: (data.links || data.repuestosModelos || []).map((l: any) => ({
      id: String(l.id_repuesto_modelo),
      modeloId: String(l.id_modelo),
      repuestoId: String(l.id_repuesto),
    })),
  };
}

/**
 * 2. GUARDAR O ACTUALIZAR MODELO (POST o PUT)
 * Conectado con: modelosController.createModelo y modelosController.updateModelo
 */
export async function saveModeloApi(
    modeloData: Omit<Modelo, 'id'>, 
    id?: string
  ): Promise<string> {
    const url = id ? `${API_BASE_URL}/api/modelos/${id}` : `${API_BASE_URL}/api/modelos`;
    const method = id ? 'PUT' : 'POST';
  
    // TRADUCCIÓN: De camelCase (Front) a snake_case (lo que espera tu controlador de Equipos)
    const bodyBackend = {
      nombre: modeloData.nombre,
      marcaId: modeloData.marcaId,
      tipoEquipoId: modeloData.tipoEquipoId,
      anoVersion: modeloData.anoVersion,
      numeroSerie: modeloData.numeroSerie, 
      infoTecnica: modeloData.infoTecnica,
      enlaceFichaTecnica: (modeloData as any).enlaceFichaTecnica || null // Alineado al controlador
    };
  
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyBackend), 
    });
  
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Error al procesar la solicitud del equipo en el servidor.');
    }
    
    const resData = await response.json();
    return String(resData.id);
  }

/**
 * 3. ELIMINAR MODELO (DELETE /api/modelos/:id)
 * Conectado con: modelosController.deleteModelo
 */
export async function deleteModeloApi(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/modelos/${id}`, { 
    method: 'DELETE' 
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