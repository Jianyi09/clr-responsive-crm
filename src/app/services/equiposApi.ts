// services/equipoApi.ts
import { Cliente, Equipo, Marca, Modelo, TipoEquipo } from '../data/mockData'; // Ajusta la ruta relativa según tu proyecto

// Interfaz exclusiva para la respuesta unificada del dashboard de equipos
export interface EquiposDashboardPayload {
  equipos: Equipo[];
  clientes: Cliente[];
  marcas: Marca[];
  modelos: Modelo[];
  tiposEquipo: TipoEquipo[];
}

const API_BASE_URL = 'http://localhost:4000';

/**
 * 1. LEER DATOS INICIALES DEL DASHBOARD (GET /api/equipos/dashboard)
 * Conectado con: getEquiposDashboardApi(req, res)
 */
export async function getEquiposInitData(): Promise<EquiposDashboardPayload> {
  const response = await fetch(`${API_BASE_URL}/api/equipos/dashboard`);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Error al obtener los datos de los equipos del servidor.');
  }
  const data = await response.json();

  // Mapeamos los campos de snake_case (BD) a camelCase (Front) garantizando consistencia con tus interfaces
  return {
    equipos: (data.equipos || []).map((e: any) => ({
      id: String(e.id_equipo),
      clienteId: String(e.id_cliente),
      tipoEquipoId: String(e.id_tipo_equipo),
      marcaId: String(e.id_marca),
      modeloId: String(e.id_modelo),
      aliasInterno: e.alias_interno || '',
      observacion: e.observacion || '',
      serial: e.serial || '',
      infoTecnica: e.info_tecnica || '',
      tipoCombustible: '', // Campo requerido por tu interfaz en el front
    })),
    clientes: (data.clientes || []).map((c: any) => ({
      id: String(c.id_clientes),
      razonSocial: c.razon_social,
      rifDni: c.rif_dni || '',
      ciudad: c.ciudad || null,
      estado: c.estado || '',
      numeroTelefonico: c.numero_telefonico || '',
      correoElectronico: c.correo_electronico || '',
      contacto: c.contacto || '',
      direccion: c.direccion || '',
      equiposRegistrados: Number(c.equipos_registrados || 0)
    })),
    marcas: (data.marcas || []).map((m: any) => ({
      id: String(m.id_marca),
      nombre: m.nombre,
    })),
    modelos: (data.modelos || []).map((mod: any) => ({
      id: String(mod.id_modelo),
      marcaId: String(mod.id_marca),
      tipoEquipoId: String(mod.id_tipo_equipo),
      nombre: mod.nombre,
    })),
    tiposEquipo: (data.tiposEquipo || []).map((t: any) => ({
      id: String(t.id_tipo_equipo),
      nombre: t.nombre,
    })),
  };
}

/**
 * 2. GUARDAR / ACTUALIZAR EQUIPO (POST o PUT)
 * Conectado con: crearEquipo(req, res) y actualizarEquipo(req, res)
 */
export async function saveEquipoApi(
  equipoData: Omit<Equipo, 'id'>, 
  id?: string
): Promise<string> {
  const url = id ? `${API_BASE_URL}/api/equipos/${id}` : `${API_BASE_URL}/api/equipos`;
  const method = id ? 'PUT' : 'POST';

  // TRADUCCIÓN: De camelCase (Front) a snake_case (lo que espera tu controlador de Equipos)
  const bodyBackend = {
    clienteId: equipoData.clienteId,
    tipoEquipoId: equipoData.tipoEquipoId,
    marcaId: equipoData.marcaId,
    modeloId: equipoData.modeloId,
    aliasInterno: equipoData.aliasInterno,
    observacion: equipoData.observacion,
    serial: equipoData.serial,
    infoTecnica: equipoData.infoTecnica || ''
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
 * 3. ELIMINAR EQUIPO (DELETE /api/equipos/:id)
 * Conectado con: eliminarEquipo(req, res)
 */
export async function eliminarEquipoApi(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/equipos/${id}`, { 
    method: 'DELETE' 
  });
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'No se pudo eliminar el equipo del servidor.');
  }
}