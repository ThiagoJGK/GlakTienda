/**
 * Centralized utility functions for Glak Tienda
 */

/**
 * Format a price in Argentine Pesos (ARS)
 * Consistent format across the entire app
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
