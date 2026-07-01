// Usa la URL de la API configurada en Vite.
// En desarrollo la API corre en localhost:4000.
// En producción, si no hay VITE_API_URL, usa directamente el backend de Render.
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:4000' : 'https://clr-responsive-crm.onrender.com');

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