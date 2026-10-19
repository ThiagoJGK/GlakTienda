'use server';

import { createClient } from "@/lib/supabase/server";
import { CartItem } from "@/stores/cartStore";

export interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zipCode: string;
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  city: string;
  state: string;
  shippingMethod: string;
  shippingCost: number;
}

/**
 * Initiates the checkout process: locks inventory, registers the order and its items,
 * and creates a Mercado Pago Pro Preference.
 * 
 * @param items The items in the shopping cart.
 * @param shipping The shipping details of the customer.
 * @param sessionId The active session or token ID of the customer.
 * @returns An object indicating success, error, and the initPoint URL to redirect to MP.
 */
export async function initiateCheckoutAction(
  items: CartItem[], 
  shipping: ShippingDetails, 
  sessionId: string
): Promise<{ success: boolean; initPoint?: string; preferenceId?: string; error?: string }> {
  const supabase = await createClient();

  // 1. Critical Phase: Try to lock inventory in database for each item
  const locks: string[] = [];
  try {
    for (const item of items) {
      const { data: lockResult, error } = await supabase.rpc('lock_inventory_item', {
        p_product_id: item.id,
        p_size: item.size,
        p_color: item.color,
        p_quantity: item.quantity,
        p_session_id: sessionId
      });

      if (error || !lockResult) {
        console.error("Database error during item lock:", error);
        throw new Error(`Error en base de datos al reservar ${item.name}`);
      }

      const res = lockResult as { success: boolean; lock_id?: string; message: string };
      if (!res.success) {
        // If an item does not have enough stock, abort and throw error
        throw new Error(res.message);
      }
      if (res.lock_id) locks.push(res.lock_id);
    }
  } catch (err: any) {
    // If lock fails for any item, release all previously created locks in this session
    for (const lockId of locks) {
      await supabase.rpc('release_inventory_lock', { p_lock_id: lockId, p_session_id: sessionId });
    }
    return { success: false, error: err.message || "No hay stock suficiente de algún producto seleccionado." };
  }

  // 2. Create the Order in Supabase
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + shipping.shippingCost;

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert([{
      email: shipping.email,
      first_name: shipping.firstName,
      last_name: shipping.lastName,
      phone: shipping.phone,
      shipping_method: shipping.shippingMethod,
      shipping_cost: shipping.shippingCost,
      shipping_address: {
        street: shipping.street,
        number: shipping.number,
        floor: shipping.floor,
        apartment: shipping.apartment,
        city: shipping.city,
        state: shipping.state,
        zip_code: shipping.zipCode
      },
      subtotal,
      total,
      status: 'pending',
      payment_status: 'pending',
      metadata: { session_id: sessionId }
    }])
    .select('id')
    .single();

  if (orderErr || !order) {
    console.error("Order creation failed:", orderErr);
    // Release locks if order cannot be saved
    for (const lockId of locks) {
      await supabase.rpc('release_inventory_lock', { p_lock_id: lockId, p_session_id: sessionId });
    }
    return { success: false, error: "Error al registrar el pedido. Intente nuevamente." };
  }

  // 3. Register the Order Items
  const orderItemsData = items.map(item => ({
    order_id: order.id,
    product_id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size,
    color: item.color
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsData);
  if (itemsErr) {
    console.error("Order items registration failed:", itemsErr);
    // Release locks
    for (const lockId of locks) {
      await supabase.rpc('release_inventory_lock', { p_lock_id: lockId, p_session_id: sessionId });
    }
    return { success: false, error: "Error al asociar los productos a tu pedido." };
  }

  // 4. Create Preference in Mercado Pago REST API
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return { success: false, error: "La plataforma de pagos no está configurada correctamente en el servidor." };
  }

  // Build items formatted for Mercado Pago
  const mpItems = items.map(item => ({
    id: item.id,
    title: `${item.name} (${item.color} - ${item.size})`,
    quantity: item.quantity,
    unit_price: item.price,
    currency_id: 'ARS',
    picture_url: item.image
  }));

  // Add shipping cost as a line item if greater than 0
  if (shipping.shippingCost > 0) {
    mpItems.push({
      id: 'shipping_cost',
      title: `Costo de envío - ${shipping.shippingMethod.replace('_', ' ').toUpperCase()}`,
      quantity: 1,
      unit_price: shipping.shippingCost,
      currency_id: 'ARS',
      picture_url: 'https://cdn-icons-png.flaticon.com/512/709/709790.png'
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://glak-tienda-web.pages.dev';

  const payload = {
    items: mpItems,
    back_urls: {
      success: `${appUrl}/checkout/confirmacion?order_id=${order.id}`,
      failure: `${appUrl}/checkout?error=payment_failed`,
      pending: `${appUrl}/checkout/confirmacion?order_id=${order.id}&status=pending`
    },
    auto_return: 'approved',
    external_reference: order.id,
    notification_url: `${appUrl}/api/mercadopago/webhook`,
    payment_methods: {
      excluded_payment_types: [
        { id: "ticket" } // Exclude cash payments for immediate digital locks validation
      ],
      installments: 6 // Enable up to 6 installments
    }
  };

  try {
    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!mpRes.ok) {
      const errBody = await mpRes.text();
      throw new Error(`Mercado Pago API error: ${errBody}`);
    }

    const mpData = await mpRes.json();

    // Update the order with preference_id
    await supabase
      .from('orders')
      .update({ preference_id: mpData.id })
      .eq('id', order.id);

    return {
      success: true,
      initPoint: mpData.init_point, // URL to redirect
      preferenceId: mpData.id
    };
  } catch (err: any) {
    console.error("Error creating Mercado Pago Preference:", err);
    // Release locks on communication failure
    for (const lockId of locks) {
      await supabase.rpc('release_inventory_lock', { p_lock_id: lockId, p_session_id: sessionId });
    }
    return { success: false, error: "Error de comunicación con la pasarela de pagos." };
  }
}

/**
 * Synchronizes the abandoned cart state to the database.
 * If a cartId is provided, it updates that cart. Otherwise, it inserts a new cart row.
 */
export async function syncAbandonedCartAction(
  cartId: string | null,
  email: string,
  firstName: string,
  lastName: string,
  cartItems: CartItem[]
): Promise<{ success: boolean; cartId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://glak-tienda-web.pages.dev';
    const baseCheckoutUrl = `${appUrl}/checkout?recover_session=`;

    if (cartId) {
      const { data, error } = await supabase
        .from('abandoned_carts')
        .update({
          email,
          first_name: firstName,
          last_name: lastName,
          cart_items: cartItems as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartId)
        .select('id')
        .single();

      if (error) {
        console.error("Error updating abandoned cart:", error);
        return { success: false, error: error.message };
      }
      return { success: true, cartId: data.id };
    } else {
      // First try to check if there is an active 'abandoned' cart for this email
      // to avoid creating duplicate carts in the same checkout session
      const { data: existingCart } = await supabase
        .from('abandoned_carts')
        .select('id')
        .eq('email', email)
        .eq('status', 'abandoned')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingCart) {
        const { data, error } = await supabase
          .from('abandoned_carts')
          .update({
            first_name: firstName,
            last_name: lastName,
            cart_items: cartItems as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCart.id)
          .select('id')
          .single();

        if (!error && data) {
          return { success: true, cartId: data.id };
        }
      }

      // If no existing or update failed, insert a new record
      const { data, error } = await supabase
        .from('abandoned_carts')
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          cart_items: cartItems as any,
          checkout_url: baseCheckoutUrl,
          status: 'abandoned',
          recovery_count: 0
        })
        .select('id')
        .single();

      if (error) {
        console.error("Error creating abandoned cart:", error);
        return { success: false, error: error.message };
      }
      return { success: true, cartId: data.id };
    }
  } catch (err: any) {
    console.error("syncAbandonedCartAction exception:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

/**
 * Retrieves an abandoned cart session from the database.
 */
export async function getAbandonedCartAction(
  cartId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('id', cartId)
      .single();

    if (error) {
      console.error("Error retrieving abandoned cart:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error("getAbandonedCartAction exception:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

/**
 * Marks an abandoned cart session as converted/recovered.
 */
export async function markCartAsConvertedAction(
  cartId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('abandoned_carts')
      .update({
        status: 'converted',
        updated_at: new Date().toISOString()
      })
      .eq('id', cartId);

    if (error) {
      console.error("Error marking cart as converted:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("markCartAsConvertedAction exception:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}
