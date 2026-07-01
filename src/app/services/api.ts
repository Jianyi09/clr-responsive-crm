// Toma la URL de producción configurada en Vite, o usa el puerto 4000 en desarrollo por defecto
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Helper opcional por si usas fetch nativo.
 * Te ayuda a no escribir la cabecera JSON ni el parseo del json() en cada archivo.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error en la petición: ${response.status}`);
  }

  return response.json();
}