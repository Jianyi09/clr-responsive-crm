export interface Cliente {
  id_clientes: number;
  razon_social: string;
  rif_dni: string;
  estado: string;
  numero_telefonico: string;
  correo_electronico: string;
  contacto: string;
  direccion: string;
  equiposRegistrados: number;
}

export interface TipoEquipo {
  id: string;
  nombre: string;
}

export interface Marca {
  id: string;
  nombre: string;
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
}

export interface Equipo {
  id: string;
  clienteId: string;
  tipoEquipoId: string;
  marcaId: string;
  modeloId: string;
  aliasInterno: string;
  observacion: string;
  serial: string;
  infoTecnica: string;
}

export const ESTADOS = ['La Romana', 'Santo Domingo', 'Santiago', 'La Vega', 'San Pedro'];

export const ZONAS: Record<string, string[]> = {
  'La Romana': ['Centro', 'Este', 'Norte', 'Sur'],
  'Santo Domingo': ['Nacional', 'Oriental', 'Norte', 'Este'],
  'Santiago': ['Centro', 'Norte', 'Sur'],
  'La Vega': ['Centro', 'Este'],
  'San Pedro': ['Centro', 'Industrial'],
};

export const tiposEquipo: TipoEquipo[] = [
  { id: '1', nombre: 'Excavadora' },
  { id: '2', nombre: 'Camión' },
  { id: '3', nombre: 'Grúa' },
  { id: '4', nombre: 'Montacargas' },
];

export const marcas: Marca[] = [
  { id: '1', nombre: 'Caterpillar' },
  { id: '2', nombre: 'Komatsu' },
  { id: '3', nombre: 'Volvo' },
  { id: '4', nombre: 'Toyota' },
  { id: '5', nombre: 'Hyundai' },
];

export const modelos: Modelo[] = [
  {
    id: '1',
    nombre: 'CAT 320D',
    marcaId: '1',
    tipoEquipoId: '1',
    anoVersion: '2020',
    numeroSerie: 'CAT320D-2020',
    infoTecnica: 'Motor C4.4, 121 HP, peso 20.5 ton',
    enlaceFichaTecnica: 'https://example.com/cat320d',
  },
  {
    id: '2',
    nombre: 'PC210',
    marcaId: '2',
    tipoEquipoId: '1',
    anoVersion: '2019',
    numeroSerie: 'PC210-2019',
    infoTecnica: 'Motor SAA4D107E-1, 148 HP',
    enlaceFichaTecnica: 'https://example.com/pc210',
  },
  {
    id: '3',
    nombre: 'FH16',
    marcaId: '3',
    tipoEquipoId: '2',
    anoVersion: '2021',
    numeroSerie: 'FH16-2021',
    infoTecnica: 'Motor D16K, 750 HP, 16.1L',
    enlaceFichaTecnica: 'https://example.com/fh16',
  },
];

export const equipos: Equipo[] = [
  {
    id: '1',
    clienteId: '1',
    tipoEquipoId: '1',
    marcaId: '1',
    modeloId: '1',
    aliasInterno: 'EXC-001',
    observacion: 'Uso diario en obra principal',
    serial: 'CAT320D2020-XYZ123',
    infoTecnica: 'Mantenimiento al día, última revisión: 15/05/2026',
  },
  {
    id: '2',
    clienteId: '1',
    tipoEquipoId: '1',
    marcaId: '2',
    modeloId: '2',
    aliasInterno: 'EXC-002',
    observacion: 'Asignada a proyecto Costa Este',
    serial: 'PC210-2019-ABC456',
    infoTecnica: 'Requiere cambio de filtros próximamente',
  },
  {
    id: '3',
    clienteId: '2',
    tipoEquipoId: '2',
    marcaId: '3',
    modeloId: '3',
    aliasInterno: 'CAM-101',
    observacion: 'Ruta nacional',
    serial: 'FH16-2021-DEF789',
    infoTecnica: 'Neumáticos nuevos instalados',
  },
  {
    id: '4',
    clienteId: '4',
    tipoEquipoId: '1',
    marcaId: '1',
    modeloId: '1',
    aliasInterno: 'MIN-EXC-01',
    observacion: 'Operación en mina principal',
    serial: 'CAT320D2020-MIN001',
    infoTecnica: 'Equipo reforzado para trabajo pesado',
  },
];
