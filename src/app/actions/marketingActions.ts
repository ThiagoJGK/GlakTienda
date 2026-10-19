'use server';

import { CartItem } from '@/stores/cartStore';
import { sendRecoveryEmail } from '@/lib/resend/client';

/**
 * Server Action to trigger a cart recovery email test.
 * This runs on the server (Edge/Node) and safely delegates to the lightweight Resend client.
 * 
 * @param email Recipient email address
 * @param firstName Recipient's first name
 * @param items List of CartItems left in their cart
 * @param baseUrl Base website URL for restoring cart links (e.g. 'https://glak.com.ar' or 'http://localhost:3000')
 */
export async function triggerTestRecoveryEmail(
  email: string,
  firstName: string,
  items: CartItem[],
  baseUrl: string
) {
  if (!email || !firstName || !items || items.length === 0) {
    return { success: false, error: 'Información de destinatario o carrito incompleta.' };
  }

  try {
    const result = await sendRecoveryEmail({
      to: email,
      firstName,
      cartItems: items,
      baseUrl: baseUrl || 'http://localhost:3000',
    });

    return result;
  } catch (error: any) {
    console.error('[Marketing Actions] Failed to trigger recovery email action:', error);
    return { success: false, error: error?.message || 'Error interno al enviar correo' };
  }
}
