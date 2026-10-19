import { CartItem } from '@/stores/cartStore';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

interface SendRecoveryEmailParams {
  to: string;
  firstName: string;
  cartItems: CartItem[];
  baseUrl: string;
}

/**
 * Encodes the cart items array into a base64-encoded JSON string.
 * Uses a safe polyfill that works in both standard Node.js and pure Edge worker V8 runtimes.
 * 
 * @param items Array of cart items from Zustand store
 * @returns Base64-encoded URL safe string
 */
export function encodeCartToBase64(items: CartItem[]): string {
  const jsonStr = JSON.stringify(items);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(jsonStr).toString('base64');
  }
  // Fallback for V8 isolate edge environment without Buffer
  return btoa(
    encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/**
 * Formats a numeric price to Argentinian Pesos (ARS).
 * 
 * @param price Price amount
 * @returns Formatted currency string
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Sends an email using Resend's REST API.
 * This is fully compatible with Edge runtimes as it uses standard fetch instead of the heavy Resend SDK.
 * 
 * @param params Email settings containing recipient, subject, and HTML body
 * @returns Result status containing success boolean
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string; mock?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;

  // Graceful recovery for local sandbox testing when API Key is missing
  if (!apiKey) {
    console.warn('[Resend Client] RESEND_API_KEY is not defined. Simulating dispatch in sandbox mode.');
    console.log('============= MOCK EMAIL DISPATCH =============');
    console.log(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`Subject: ${subject}`);
    console.log('================================================');
    return { success: true, mock: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GLak Tienda <onboarding@resend.dev>', // Free tier default sandbox sender
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Resend Client] Error sending email via REST API:', error);
    return { success: false, error: error?.message || 'Unknown send error' };
  }
}

/**
 * Dispatches a highly aesthetic, premium high-fashion recovery email
 * containing the shopping cart items and the promo code RECOVERY10.
 * 
 * @param params Recover parameters containing customer details, cart, and base storefront URL
 */
export async function sendRecoveryEmail({ to, firstName, cartItems, baseUrl }: SendRecoveryEmailParams) {
  if (!cartItems || cartItems.length === 0) {
    return { success: false, error: 'No items in the cart to recover' };
  }

  // 1. Generate recovery link with base64 encoded cart items
  const base64Cart = encodeCartToBase64(cartItems);
  const recoveryLink = `${baseUrl}/tienda?recover_cart=${encodeURIComponent(base64Cart)}`;

  // 2. Compute cart totals
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 3. Render high-fashion aesthetic email template matching GLak's warm Ivory/Avocado palette
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dejaste algo hermoso en tu bolso</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #FDFBF5;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #375501;
          -webkit-font-smoothing: antialiased;
        }
        table {
          border-collapse: collapse;
          width: 100%;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        .wrapper {
          width: 100%;
          background-color: #FDFBF5;
          padding: 40px 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #FFFFFF;
          border: 1px solid rgba(86, 130, 3, 0.12);
          border-radius: 24px;
          box-shadow: 0 8px 24px rgba(86, 130, 3, 0.04);
          overflow: hidden;
        }
        .header {
          padding: 40px 20px 20px;
          text-align: center;
        }
        .logo {
          font-family: "Playfair Display", "Georgia", "Times New Roman", serif;
          font-size: 32px;
          letter-spacing: 6px;
          font-style: italic;
          color: #568203;
          margin: 0 0 10px;
          font-weight: 300;
        }
        .subtitle {
          font-size: 13px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #568203;
          margin-bottom: 20px;
        }
        .divider {
          height: 1px;
          background-color: rgba(86, 130, 3, 0.1);
          margin: 0 40px;
        }
        .content {
          padding: 30px 40px;
        }
        .headline {
          font-family: "Outfit", "Segoe UI", sans-serif;
          font-size: 24px;
          font-weight: 500;
          color: #375501;
          text-align: center;
          margin-bottom: 16px;
          line-height: 1.3;
        }
        .intro-text {
          font-size: 15px;
          color: #4A5D2E;
          line-height: 1.6;
          text-align: center;
          margin-bottom: 30px;
        }
        .cart-title {
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #568203;
          font-weight: bold;
          margin-bottom: 15px;
          border-bottom: 1px solid rgba(86, 130, 3, 0.08);
          padding-bottom: 5px;
        }
        .item-row {
          margin-bottom: 15px;
          border-bottom: 1px solid rgba(86, 130, 3, 0.05);
          padding-bottom: 15px;
        }
        .item-image {
          width: 70px;
          height: 70px;
          border-radius: 12px;
          object-fit: cover;
          border: 1px solid rgba(86, 130, 3, 0.08);
        }
        .item-name {
          font-size: 15px;
          font-weight: 600;
          color: #375501;
          margin: 0 0 4px;
        }
        .item-meta {
          font-size: 12px;
          color: #8C9E75;
          margin: 0;
        }
        .item-price {
          font-size: 15px;
          font-weight: bold;
          color: #568203;
          text-align: right;
        }
        .total-box {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid rgba(86, 130, 3, 0.12);
        }
        .total-label {
          font-size: 16px;
          font-weight: 600;
          color: #375501;
        }
        .total-price {
          font-size: 18px;
          font-weight: bold;
          color: #568203;
          text-align: right;
        }
        .promo-card {
          background-color: #FFF8B9;
          border: 2px dashed rgba(86, 130, 3, 0.25);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          margin: 30px 0;
        }
        .promo-title {
          font-size: 12px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #568203;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .promo-code {
          font-size: 26px;
          font-weight: bold;
          color: #375501;
          letter-spacing: 3px;
          margin: 10px 0;
        }
        .promo-desc {
          font-size: 13px;
          color: #657D43;
          margin: 0;
        }
        .cta-container {
          text-align: center;
          margin: 35px 0 15px;
        }
        .cta-button {
          display: inline-block;
          background-color: #568203;
          color: #FFFFFF !important;
          text-decoration: none;
          font-family: "Outfit", sans-serif;
          font-size: 15px;
          font-weight: bold;
          letter-spacing: 1.5px;
          padding: 16px 40px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(86, 130, 3, 0.15);
          transition: background-color 0.2s ease;
        }
        .footer {
          background-color: #F8F6EF;
          padding: 30px 40px;
          text-align: center;
          font-size: 12px;
          color: #8C9E75;
          line-height: 1.6;
        }
        .footer-logo {
          font-family: serif;
          font-size: 18px;
          letter-spacing: 4px;
          color: #568203;
          margin-bottom: 15px;
        }
        .footer-links a {
          color: #568203;
          text-decoration: none;
          margin: 0 10px;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <!-- Logo & Header -->
          <div class="header">
            <h1 class="logo">G L a k</h1>
            <div class="subtitle">Alta costura & diseño editorial</div>
          </div>
          <div class="divider"></div>

          <!-- Main Content -->
          <div class="content">
            <h2 class="headline">Dejaste algo hermoso en tu bolso</h2>
            <p class="intro-text">
              Hola, <strong>${firstName}</strong>. Sabemos que tenés un ojo exquisito para el diseño. Tus prendas favoritas de la temporada todavía están reservadas en tu armario virtual. Para ayudarte a completar tu look perfecto, te ofrecemos un beneficio único.
            </p>

            <h3 class="cart-title">Tu Bolso Reservado</h3>
            
            <!-- Items Table -->
            <table cellpadding="0" cellspacing="0" border="0">
              ${cartItems.map(item => `
                <tr class="item-row">
                  <td style="padding: 10px 0; width: 80px;" valign="top">
                    <img src="${item.image}" alt="${item.name}" class="item-image" />
                  </td>
                  <td style="padding: 10px 15px;" valign="top">
                    <h4 class="item-name">${item.name}</h4>
                    <p class="item-meta">Color: ${item.color} &nbsp;·&nbsp; Talle: ${item.size}</p>
                    <p class="item-meta">Cant: ${item.quantity}</p>
                  </td>
                  <td style="padding: 10px 0; text-align: right;" valign="top">
                    <span class="item-price">${formatPrice(item.price)}</span>
                  </td>
                </tr>
              `).join('')}
            </table>

            <!-- Total -->
            <table cellpadding="0" cellspacing="0" border="0" class="total-box">
              <tr>
                <td style="padding: 15px 0;" class="total-label">Subtotal de tu Bolso</td>
                <td style="padding: 15px 0; text-align: right;" class="total-price">${formatPrice(totalAmount)}</td>
              </tr>
            </table>

            <!-- Promo Card -->
            <div class="promo-card">
              <div class="promo-title">Tu Regalo de Bienvenida</div>
              <div class="promo-code">RECOVERY10</div>
              <p class="promo-desc">
                Ingresá este código en el checkout para disfrutar de un <strong>10% de descuento adicional</strong> y envío prioritario.
              </p>
            </div>

            <!-- Call to Action -->
            <div class="cta-container">
              <a href="${recoveryLink}" target="_blank" class="cta-button">RETOMAR MI COMPRA</a>
            </div>
            <p style="font-size: 11px; text-align: center; color: #8C9E75; margin-top: 10px;">
              El enlace restaurará automáticamente tus prendas exactas en tu bolsa de compras con un solo clic.
            </p>
          </div>

          <!-- Footer Section -->
          <div class="footer">
            <div class="footer-logo">GLak Tienda</div>
            <p>Boutique online de alta costura inspirada en la sofisticación italiana.</p>
            <p class="footer-links">
              <a href="${baseUrl}/tienda">Ver Nueva Colección</a> | 
              <a href="${baseUrl}/politicas">Políticas de Envío</a> | 
              <a href="${baseUrl}/contacto">Contacto</a>
            </p>
            <p style="margin-top: 20px; font-size: 10px; opacity: 0.8;">
              © ${new Date().getFullYear()} GLak Tienda. Todos los derechos reservados.<br />
              Recibiste este correo de transacciones como parte de tu proceso de reserva.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // 4. Send the email via Resend's REST API client
  const sendResult = await sendEmail({
    to,
    subject: 'GLak — Dejaste algo hermoso en tu bolso',
    html: emailHtml,
  });

  return {
    ...sendResult,
    recoveryLink,
  };
}
