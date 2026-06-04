/**
 * Constantes globales de la aplicación CRM
 */

export const APP_NAME = 'Flota Clientes La Romana';
export const APP_SHORT_NAME = 'Flota Clientes';
export const APP_LOCATION = 'La Romana';

/**
 * Paleta de colores del tema
 */
export const COLORS = {
  primary: {
    main: '#0066CC',
    hover: '#0052A3',
    light: '#0066CC10',
  },
  secondary: {
    main: '#FF6B35',
    hover: '#E5582C',
    light: '#FF6B3510',
  },
  success: {
    main: '#10B981',
    hover: '#059669',
  },
  danger: {
    main: '#EF4444',
    hover: '#DC2626',
  },
  warning: {
    main: '#F59E0B',
    hover: '#D97706',
  },
} as const;

/**
 * Rutas de la aplicación
 */
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  CLIENTES: '/clientes',
  EQUIPOS: '/equipos',
  MODELOS: '/modelos',
} as const;

/**
 * Mensajes de la aplicación
 */
export const MESSAGES = {
  LOGIN: {
    SUCCESS: 'Inicio de sesión exitoso',
    ERROR: 'Usuario o contraseña incorrectos',
    REQUIRED: 'Por favor, ingrese usuario y contraseña',
  },
  CLIENTE: {
    CREATED: 'Cliente creado exitosamente',
    UPDATED: 'Cliente actualizado exitosamente',
    DELETED: 'Cliente eliminado exitosamente',
    DUPLICATE_RIF: 'Ya existe un cliente con este RIF/DNI',
  },
  EQUIPO: {
    CREATED: 'Equipo creado exitosamente',
    UPDATED: 'Equipo actualizado exitosamente',
    DELETED: 'Equipo eliminado exitosamente',
    DUPLICATE_SERIAL: 'Ya existe un equipo con este serial y marca',
  },
  MODELO: {
    CREATED: 'Modelo creado exitosamente',
    UPDATED: 'Modelo actualizado exitosamente',
    DELETED: 'Modelo eliminado exitosamente',
  },
  MARCA: {
    CREATED: 'Marca creada exitosamente',
  },
  VALIDATION: {
    FORM_ERROR: 'Por favor, corrija los errores en el formulario',
    REQUIRED_FIELD: 'Este campo es requerido',
    INVALID_EMAIL: 'El correo no es válido',
    INVALID_URL: 'La URL no es válida',
  },
} as const;

/**
 * Roles de usuario
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  USUARIO: 'usuario',
} as const;

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  USER: 'crm_user',
} as const;
