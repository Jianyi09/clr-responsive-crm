/// <reference types="vite/client" />
import { type Cliente, Equipo, Modelo, Marca, TipoEquipo } from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Error ${response.status}: ${message}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  throw new Error(`Expected JSON response but received: ${text.slice(0,200)}`);
}

export async function getClientes(): Promise<Cliente[]> {
  return fetchJson<Cliente[]>('/api/data/clientes');
}

// Llama al endpoint que ejecuta la consulta definida en clientesController.js
export async function getClientesApi(): Promise<Cliente[]> {
  return fetchJson<Cliente[]>('/api/clientes');
}

export async function getEquipos(): Promise<Equipo[]> {
  return fetchJson<Equipo[]>('/api/data/equipos');
}

export async function getModelos(): Promise<Modelo[]> {
  return fetchJson<Modelo[]>('/api/data/modelos');
}

export async function getMarcas(): Promise<Marca[]> {
  return fetchJson<Marca[]>('/api/data/marcas');
}

export async function getTiposEquipo(): Promise<TipoEquipo[]> {
  return fetchJson<TipoEquipo[]>('/api/data/tiposEquipo');
}
