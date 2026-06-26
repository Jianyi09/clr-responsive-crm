import { type Cliente } from '../data/mockData';

// Configura aquí tu URL base si no estás usando un proxy en Vite.
// Si usas proxy, puedes dejarlo como '' (vacío).
const API_BASE_URL = 'http://localhost:4000';

/**
 * 1. LEER CLIENTES (GET /api/clientes)
 * Conectado con: getClientesApi(req, res)
 */
export async function getClientesApi(): Promise<Cliente[]> {
  const response = await fetch(`${API_BASE_URL}/api/clientes`);
  if (!response.ok) throw new Error('Error al obtener los clientes del servidor.');
  
  const dataRaw = await response.json();

  return dataRaw.map((item: any) => ({
    id: item.id_clientes.toString(),
    razonSocial: item.razon_social,
    rifDni: item.rif_dni,
    ciudad: item.ciudad || '', 
    estado: item.estado || '',
    numeroTelefonico: item.numero_telefonico || '',
    correoElectronico: item.correo_electronico || '',
    contacto: item.contacto || '',
    direccion: item.direccion || '',
    equiposRegistrados: Number(item.equiposRegistrados ?? 0)
  }));
}

/**
 * 2. GUARDAR / ACTUALIZAR CLIENTE (POST o PUT)
 * Conectado con: crearCliente(req, res) y actualizarCliente(req, res)
 */
export async function saveClienteApi(
  clienteData: Omit<Cliente, 'id_clientes' | 'equiposRegistrados'>,
  isCreating: boolean
): Promise<void> {
  // Determinamos la ruta exacta según la operación
  const url = isCreating 
    ? `${API_BASE_URL}/api/clientes` 
    : `${API_BASE_URL}/api/clientes/${clienteData.id}`;
    
  const method = isCreating ? 'POST' : 'PUT';

  // TRADUCCIÓN OBLIGATORIA: De camelCase (Front) a snake_case (lo que espera el controlador)
  const bodyBackend = {
    razon_social: clienteData.razonSocial,
    rif_dni: clienteData.rifDni,
    estado: clienteData.estado,
    ciudad: clienteData.ciudad || '',
    numero_telefonico: clienteData.numeroTelefonico || '',
    correo_electronico: clienteData.correoElectronico || '',
    contacto: clienteData.contacto || '',
    direccion: clienteData.direccion || ''
  };

  const response = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyBackend),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al procesar la solicitud en el servidor.');
  }
}

/**
 * 3. ELIMINAR CLIENTE (DELETE /api/clientes/:id)
 * Conectado con: eliminarCliente(req, res)
 */
export async function eliminarClienteApi(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/clientes/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'No se pudo eliminar el cliente.');
  }
}

/**
 * 4. LEER ESTADOS DESDE ENDPOINT EXCLUSIVO (GET /api/estados)
 * Obtiene directamente el arreglo de strings con los nombres ordenados de la DB
 */
export async function getEstadosApi(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clientes/estados`);
    
    if (!response.ok) {
      console.warn('La ruta de estados respondió con error, usando fallback vacío.');
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error de red al conectar con /api/clientes/estados:', error);
    return []; 
  }
}

