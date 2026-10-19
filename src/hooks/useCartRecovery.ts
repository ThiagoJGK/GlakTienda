import { useEffect } from 'react';
import { useCartStore, CartItem } from '@/stores/cartStore';

/**
 * Hook to dynamically restore the user's shopping cart when clicking a recovery email link.
 * It decodes a base64-encoded cart array from the `recover_cart` query parameter,
 * restores the items inside the Zustand store, opens the drawer, and cleans the URL.
 */
export function useCartRecovery() {
  const restoreCart = useCartStore((state) => state.restoreCart);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const recoverCartParam = params.get('recover_cart');

    if (recoverCartParam) {
      try {
        // Decode base64 URL parameter to JSON string
        const decodedJson = atob(decodeURIComponent(recoverCartParam));
        const items = JSON.parse(decodedJson) as CartItem[];

        if (Array.isArray(items) && items.length > 0) {
          // Restore items in the Zustand store and open the drawer
          restoreCart(items);

          // Clean up the URL query parameter silently without reloading
          params.delete('recover_cart');
          const cleanSearch = params.toString();
          const cleanUrl = `${window.location.pathname}${cleanSearch ? '?' + cleanSearch : ''}${window.location.hash}`;
          window.history.replaceState(null, '', cleanUrl);
        }
      } catch (error) {
        console.error('[Cart Recovery] Failed to decode recovery cart:', error);
      }
    }
  }, [restoreCart]);
}
