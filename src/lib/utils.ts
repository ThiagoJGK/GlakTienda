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

/**
 * Format a price safely for both SSR and CSR to mitigate hydration warnings.
 * Uses dot as thousands separator manually to guarantee deterministic output.
 */
export function formatCurrencySafe(price: number): string {
  const rounded = Math.round(price);
  const parts = rounded.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${parts[0]}`;
}

