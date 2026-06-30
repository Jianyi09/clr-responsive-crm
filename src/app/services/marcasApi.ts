// services/marcasApi.ts
import { Marca } from '../data/mockData'; // Ajusta la ruta relativa según tu proyecto
import { API_BASE_URL } from './api';

/**
 * 1. CREAR NUEVA MARCA (POST /api/marcas)
 * Conectado con: crearMarca(req, res) en el controlador de marcas
 * Registro express asíncrono desde la asignación o creación rápida de equipos.
 */
export async function saveMarcaApi(marcaNombre: string): Promise<Marca> {
  const url = `${API_BASE_URL}/api/marcas`;

  // Cuerpo adaptado al backend (se envía directamente la propiedad que espera el controlador)
  const bodyBackend = {
    marcaNombre: marcaNombre
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyBackend),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Error al intentar registrar la marca en el servidor.');
  }

  const data = await response.json();

  // Mapeamos explícitamente garantizando consistencia total con tus interfaces y tipados
  return {
    id: String(data.id),
    marcaNombre: data.marcaNombre || ''
  };
}