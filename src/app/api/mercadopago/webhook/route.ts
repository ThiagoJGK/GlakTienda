import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyMercadoPagoWebhookSignature } from '@/lib/mercadopago/signature';

export const runtime = 'edge';

// Lazily get Supabase administrative client to prevent build-time crashes when env vars are unset
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase admin credentials missing (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
  }
  return createClient(url, key);
}

/**
 * Webhook route handler called by Mercado Pago IPN/Webhooks.
 * Validates payments server-to-server and triggers order fulfillment or stock release.
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic') || searchParams.get('type');
    const paymentId = searchParams.get('id') || searchParams.get('data.id');

    // Mercado Pago sends webhooks for different topics (merchant_order, etc.) - we process only 'payment'
    if (topic !== 'payment' || !paymentId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Cryptographic HMAC Verification
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET;
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    const signatureVerification = await verifyMercadoPagoWebhookSignature({
      xSignature,
      xRequestId,
      dataId: paymentId,
      secret: webhookSecret,
    });

    if (!signatureVerification.isValid) {
      console.error("Mercado Pago Webhook rejected: Unauthorized signature -", signatureVerification.reason);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid signature', reason: signatureVerification.reason },
        { status: 401 }
      );
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("Missing MERCADOPAGO_ACCESS_TOKEN env variable in webhook");
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    // 1. Fetch payment details from MP REST API securely
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!mpRes.ok) {
      console.error(`Failed to fetch payment details from MP API for ID: ${paymentId}`);
      return NextResponse.json({ error: 'Failed to fetch payment details' }, { status: 400 });
    }

    const payment = await mpRes.json();
    const orderId = payment.external_reference; // Retrieve the order UUID
    const status = payment.status; // 'approved', 'rejected', 'cancelled', 'pending', etc.

    if (!orderId) {
      console.error("Order external_reference ID not found in payment response");
      return NextResponse.json({ error: 'Order ID not found in transaction' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Fetch current order status to prevent double-processing
    const { data: order, error: orderFetchErr } = await supabaseAdmin
      .from('orders')
      .select('payment_status')
      .eq('id', orderId)
      .single();

    if (orderFetchErr || !order) {
      console.error(`Order ${orderId} not found in database:`, orderFetchErr);
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 });
    }

    if (order.payment_status === 'approved') {
      return NextResponse.json({ message: 'Order already processed and approved' }, { status: 200 });
    }

    if (status === 'approved') {
      // 3. APPROVED: Consolidate order, deduct inventory in database, complete locks
      const { data: deductResult, error: rpcErr } = await supabaseAdmin.rpc('confirm_and_deduct_inventory', {
        p_order_id: orderId
      });

      if (rpcErr || !deductResult) {
        console.error("Critical error: Stock deduction failed for approved order:", orderId, rpcErr);
        // Continue even if stock consolidation failed to avoid failing the webhook after payment
      }

      // 4. Update order details to approved and processing
      const { error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({
          payment_id: paymentId,
          payment_status: 'approved',
          status: 'processing', // Shift to fulfillment
          payment_status_detail: payment.status_detail || ''
        })
        .eq('id', orderId);

      if (updateErr) {
        console.error(`Error updating order status for ${orderId}:`, updateErr);
        return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
      }

    } else if (status === 'rejected' || status === 'cancelled') {
      // 5. REJECTED / CANCELLED: Cancel order record and release inventory locks
      const { error: cancelErr } = await supabaseAdmin
        .from('orders')
        .update({
          payment_id: paymentId,
          payment_status: status as any,
          status: 'cancelled',
          payment_status_detail: payment.status_detail || ''
        })
        .eq('id', orderId);

      if (cancelErr) {
        console.error(`Error cancelling order ${orderId}:`, cancelErr);
      }

      // Fetch order metadata to get session_id for stock releasing
      const { data: ord } = await supabaseAdmin
        .from('orders')
        .select('metadata')
        .eq('id', orderId)
        .single();
        
      if (ord?.metadata?.session_id) {
        const { error: releaseErr } = await supabaseAdmin
          .from('inventory_locks')
          .update({ status: 'released' })
          .eq('session_id', ord.metadata.session_id)
          .eq('status', 'active');

        if (releaseErr) {
          console.error(`Error releasing locks for session ${ord.metadata.session_id}:`, releaseErr);
        }
      }
    } else {
      // For pending or other intermediate statuses, just update the status details
      await supabaseAdmin
        .from('orders')
        .update({
          payment_id: paymentId,
          payment_status: status as any,
          payment_status_detail: payment.status_detail || ''
        })
        .eq('id', orderId);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error("Mercado Pago Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
