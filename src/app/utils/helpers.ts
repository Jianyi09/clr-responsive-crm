/**
 * Formatea un RIF/DNI para mostrar
 */
export function formatRifDni(rifDni: string): string {
  return rifDni.toUpperCase();
}

/**
 * Formatea un número de teléfono
 */
export function formatPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

/**
 * Valida un correo electrónico
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida una URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Trunca un texto a un número máximo de caracteres
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalize(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formatea una fecha
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Genera un ID único basado en timestamp
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
