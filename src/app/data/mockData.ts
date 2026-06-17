export interface Cliente {
  id: string; // O number, según cómo manejes tus IDs unificados en el front
  razonSocial: string; // Cambiado para que coincida con cliente.razonSocial del front
  rifDni: string;
  ciudad: string | null; // Opcional, ya que ahora permitimos nulos
  estado: string;
  numeroTelefonico: string;
  correoElectronico: string;
  contacto: string;
  direccion: string;
  equiposRegistrados: number;
}

export interface TipoEquipo {
  id: string;
  tipoNombre: string;
}

export interface Marca {
  id: string;
  marcaNombre: string;
}

export interface Modelo {
  id: string;
  nombre: string;
  marcaId: string;
  tipoEquipoId: string;
  anoVersion: string;
  numeroSerie: string;
  infoTecnica: string;
  enlaceFichaTecnica: string;
  marcaNombre: string;
  tipoNombre: string;
}

export interface Equipo {
  id: string;
  clienteId: string;
  tipoEquipoId: string;
  marcaId: string;
  modeloId: string;
  aliasInterno: string;
  serial: string;
  observacion: string;
  infoTecnica: string;
  tipoCombustible?: string;   
}

export interface Repuesto {
  id: string;
  nombre: string;
  codigoParte: string;
  infoTecnica: string;
}

export interface RepuestoModelo {
  id: string;
  modeloId: string;
  repuestoId: string;
}

export const ESTADOS = ['La Romana', 'Santo Domingo', 'Santiago', 'La Vega', 'San Pedro'];

export const CIUDADES: Record<string, string[]> = {
  'La Romana': ['Centro', 'Este', 'Norte', 'Sur'],
  'Santo Domingo': ['Nacional', 'Oriental', 'Norte', 'Este'],
  'Santiago': ['Centro', 'Norte', 'Sur'],
  'La Vega': ['Centro', 'Este'],
  'San Pedro': ['Centro', 'Industrial'],
};

