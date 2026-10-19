import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge'; // Fully edge runtime compatible!

// Format currency in ARS
function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Helper to generate the email HTML content for Email 1 (2 hours recovery)
function getEmail1Html(firstName: string, cartItems: any[], recoveryLink: string) {
  const itemsHtml = cartItems
    .map(
      (item) => `
      <div style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eaeaea;">
        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />
        <div>
          <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #111;">${item.name}</h4>
          <p style="margin: 0; font-size: 12px; color: #666;">Talle: ${item.size} | Color: ${item.color}</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; font-weight: bold; color: #111;">${formatPrice(item.price)}</p>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #333; background-color: #fdfbf5; border-radius: 12px; border: 1px solid #eaeaea;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 32px; display: block; margin-bottom: 10px;">✨</span>
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #111; margin: 0; font-weight: 400; letter-spacing: 0.03em;">Glak</h1>
        <p style="font-size: 14px; color: #666; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Colección Exclusiva</p>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6; color: #333;">Hola ${firstName || 'allá'},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #333;">Notamos que dejaste algunas prendas hermosas seleccionadas en tu bolso. Queríamos asegurarnos de que no las pierdas:</p>
      
      <div style="margin: 25px 0; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eaeaea;">
        <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #111; border-bottom: 1px solid #eee; padding-bottom: 8px;">Tu Selección:</h3>
        ${itemsHtml}
      </div>
      
      <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
        <a href="${recoveryLink}" style="background-color: #568203; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 14px; display: inline-block; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 12px rgba(86, 130, 3, 0.2);">Retomar mi compra</a>
      </div>
      
      <p style="font-size: 13px; line-height: 1.6; color: #666; text-align: center; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px;">
        Glak Tienda · Alta Costura & Diseño Femenino<br/>
        Buenos Aires, Argentina
      </p>
    </div>
  `;
}

// Helper to generate the email HTML content for Email 2 (24 hours recovery + shipping promo)
function getEmail2Html(firstName: string, cartItems: any[], recoveryLink: string) {
  const itemsHtml = cartItems
    .map(
      (item) => `
      <div style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eaeaea;">
        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />
        <div>
          <h4 style="margin: 0 0 5px 0; font-size: 14px; color: #111;">${item.name}</h4>
          <p style="margin: 0; font-size: 12px; color: #666;">Talle: ${item.size} | Color: ${item.color}</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; font-weight: bold; color: #111;">${formatPrice(item.price)}</p>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; color: #333; background-color: #fdfbf5; border-radius: 12px; border: 1px solid #eaeaea;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 32px; display: block; margin-bottom: 10px;">🚚</span>
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #111; margin: 0; font-weight: 400; letter-spacing: 0.03em;">Glak</h1>
        <p style="font-size: 14px; color: #666; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Beneficio Exclusivo</p>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6; color: #333;">Hola ${firstName || 'allá'},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #333;">¡Queremos que estrenes lo que tanto te gustó! Para ayudarte a decidir, te regalamos el <strong>envío bonificado sin mínimo de compra</strong> para completar tu pedido en las próximas 24 horas:</p>
      
      <div style="background-color: #f5f8f0; border: 1px dashed #568203; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #568203; font-weight: 600;">Cupón de Envío Bonificado:</p>
        <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #111; letter-spacing: 0.1em;">ENVIOBONIFICADOGLAK</p>
      </div>
      
      <div style="margin: 25px 0; background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #eaeaea;">
        <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.05em; color: #111; border-bottom: 1px solid #eee; padding-bottom: 8px;">Tus favoritos guardados:</h3>
        ${itemsHtml}
      </div>
      
      <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
        <a href="${recoveryLink}" style="background-color: #568203; color: white; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 14px; display: inline-block; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 12px rgba(86, 130, 3, 0.2);">Completar con Envío Gratis</a>
      </div>
      
      <p style="font-size: 13px; line-height: 1.6; color: #666; text-align: center; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px;">
        Glak Tienda · Alta Costura & Diseño Femenino<br/>
        Buenos Aires, Argentina
      </p>
    </div>
  `;
}

// REST call to Resend API
async function sendEmailViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[Resend Mock] Envío simulado a: ${to} | Asunto: ${subject}`);
    return { success: true, mock: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'Glak Tienda <ventas@glak.com.ar>', // Make sure this is verified in Resend, or use 'onboarding@resend.dev' for test
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    console.error("Resend API returned error status:", response.status, errorDetails);
    return { success: false, error: errorDetails };
  }

  const data = await response.json();
  return { success: true, id: data.id };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET || 'glak_cron_secret_v1';

    // Verify secret query parameter to secure cron executions
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid cron secret token' }, { status: 401 });
    }

    const supabase = await createClient();

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const results = {
      fase1Sent: 0,
      fase2Sent: 0,
      errors: [] as string[],
    };

    // FASE 1: Checkout abandonado por más de 2 horas con recovery_count = 0
    const { data: fase1Carts, error: f1Error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('status', 'abandoned')
      .eq('recovery_count', 0)
      .lt('updated_at', twoHoursAgo);

    if (f1Error) {
      console.error("Error retrieving Fase 1 carts:", f1Error);
      results.errors.push(`Fase 1 retrieval error: ${f1Error.message}`);
    } else if (fase1Carts && fase1Carts.length > 0) {
      for (const cart of fase1Carts) {
        const recoveryLink = `${cart.checkout_url}${cart.id}`;
        const emailHtml = getEmail1Html(cart.first_name, cart.cart_items, recoveryLink);
        const emailRes = await sendEmailViaResend(
          cart.email,
          '¿Te guardamos tu bolso? ✨ — Glak',
          emailHtml
        );

        if (emailRes.success) {
          // Update recovery stage, last_contacted_at, and updated_at
          await supabase
            .from('abandoned_carts')
            .update({
              recovery_count: 1,
              last_contacted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', cart.id);

          results.fase1Sent++;
        } else {
          results.errors.push(`Fase 1 email fail for ${cart.email}: ${emailRes.error}`);
        }
      }
    }

    // FASE 2: Checkout abandonado por más de 24 horas con recovery_count = 1
    const { data: fase2Carts, error: f2Error } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('status', 'abandoned')
      .eq('recovery_count', 1)
      .lt('last_contacted_at', twentyFourHoursAgo);

    if (f2Error) {
      console.error("Error retrieving Fase 2 carts:", f2Error);
      results.errors.push(`Fase 2 retrieval error: ${f2Error.message}`);
    } else if (fase2Carts && fase2Carts.length > 0) {
      for (const cart of fase2Carts) {
        const recoveryLink = `${cart.checkout_url}${cart.id}`;
        const emailHtml = getEmail2Html(cart.first_name, cart.cart_items, recoveryLink);
        const emailRes = await sendEmailViaResend(
          cart.email,
          '🚚 Envío bonificado de regalo para tu compra en Glak',
          emailHtml
        );

        if (emailRes.success) {
          // Update recovery stage, last_contacted_at, and updated_at
          await supabase
            .from('abandoned_carts')
            .update({
              recovery_count: 2,
              last_contacted_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', cart.id);

          results.fase2Sent++;
        } else {
          results.errors.push(`Fase 2 email fail for ${cart.email}: ${emailRes.error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: results,
    });
  } catch (err: any) {
    console.error("Critical error in cron checker endpoint:", err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
