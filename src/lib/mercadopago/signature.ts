/**
 * Cryptographically verifies incoming Mercado Pago Webhook signatures.
 * 
 * Mercado Pago sends:
 *  - `x-signature`: "ts=...,v1=..."
 *  - `x-request-id`: UUID
 * 
 * The signed manifest format is:
 *  `id:[data.id];request-id:[x-request-id];ts:[ts];`
 * 
 * Implemented using Web Cryptography API (`crypto.subtle`) for native Cloudflare Edge
 * and Node.js runtime compatibility with zero external dependencies.
 */
export async function verifyMercadoPagoWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string | undefined;
  maxTimestampDeltaSeconds?: number;
}): Promise<{ isValid: boolean; reason?: string }> {
  const {
    xSignature,
    xRequestId,
    dataId,
    secret,
    maxTimestampDeltaSeconds = 600, // 10 minutes replay protection
  } = params;

  if (!secret) {
    return { isValid: false, reason: "Missing MERCADOPAGO_WEBHOOK_SECRET environment variable" };
  }

  if (!xSignature) {
    return { isValid: false, reason: "Missing x-signature header" };
  }

  // Parse ts and v1 from x-signature: "ts=1700000000,v1=abcdef..."
  const parts = xSignature.split(",").map((p) => p.trim());
  let ts: string | undefined;
  let v1: string | undefined;

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }

  if (!ts || !v1) {
    return { isValid: false, reason: "Invalid x-signature header structure (missing ts or v1)" };
  }

  // Replay Attack Protection: Ensure timestamp is within tolerance
  const parsedTs = parseInt(ts, 10);
  if (isNaN(parsedTs)) {
    return { isValid: false, reason: "Invalid timestamp in x-signature header" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - parsedTs) > maxTimestampDeltaSeconds) {
    return { isValid: false, reason: `Timestamp out of acceptable window (delta: ${Math.abs(nowSeconds - parsedTs)}s)` };
  }

  // Build manifest string according to official Mercado Pago documentation:
  // Format: id:[data.id];request-id:[x-request-id];ts:[ts];
  let manifest = "";
  if (dataId) {
    manifest += `id:${dataId};`;
  }
  if (xRequestId) {
    manifest += `request-id:${xRequestId};`;
  }
  manifest += `ts:${ts};`;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(manifest);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const calculatedHash = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time XOR comparison to prevent timing attacks
    if (calculatedHash.length !== v1.length) {
      return { isValid: false, reason: "Hash length mismatch" };
    }

    let mismatch = 0;
    for (let i = 0; i < calculatedHash.length; i++) {
      mismatch |= calculatedHash.charCodeAt(i) ^ v1.charCodeAt(i);
    }

    if (mismatch !== 0) {
      return { isValid: false, reason: "Signature mismatch" };
    }

    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, reason: `Cryptographic verification failed: ${err.message}` };
  }
}
