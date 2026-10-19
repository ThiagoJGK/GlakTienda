/**
 * Empirical Verification & Adversarial Stress Test Harness
 * Milestone M1: Security, Webhook HMAC, Next.js 16 Proxy, Keep-Awake Workflow, Supabase Diagnostics
 * 
 * Run with: npx tsx scripts/test-empirical-m1.ts
 */

import { createHmac } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { NextRequest } from "next/server";
import { verifyMercadoPagoWebhookSignature } from "../src/lib/mercadopago/signature";
import { proxy } from "../src/proxy";

let passedTests = 0;
let failedTests = 0;

function assert(condition: unknown, testName: string, detail?: string) {
  if (Boolean(condition)) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ""}`);
    failedTests++;
  }
}

// Helper to generate Mercado Pago HMAC SHA-256 signatures
function createMpSignature(
  secret: string,
  dataId: string | null,
  requestId: string | null,
  ts: number
): { manifest: string; hash: string; xSignature: string } {
  let manifest = "";
  if (dataId) {
    manifest += `id:${dataId};`;
  }
  if (requestId) {
    manifest += `request-id:${requestId};`;
  }
  manifest += `ts:${ts};`;

  const hmac = createHmac("sha256", secret);
  hmac.update(manifest);
  const hash = hmac.digest("hex");
  return {
    manifest,
    hash,
    xSignature: `ts=${ts},v1=${hash}`,
  };
}

async function runTarget1WebhookSignatureTests() {
  console.log("\n=======================================================");
  console.log("  TARGET 1: MERCADO PAGO WEBHOOK SIGNATURE ADVERSARIAL TESTS");
  console.log("=======================================================\n");

  const testSecret = "mp_webhook_secret_for_test_123456789";
  const validDataId = "payment_9988776655";
  const validRequestId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
  const now = Math.floor(Date.now() / 1000);

  // 1. Valid signature
  const validSig = createMpSignature(testSecret, validDataId, validRequestId, now);
  const resValid = await verifyMercadoPagoWebhookSignature({
    xSignature: validSig.xSignature,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(resValid.isValid === true, "Valid HMAC-SHA256 signature is accepted", resValid.reason);

  // 2. Valid signature without dataId
  const sigNoData = createMpSignature(testSecret, null, validRequestId, now);
  const resNoData = await verifyMercadoPagoWebhookSignature({
    xSignature: sigNoData.xSignature,
    xRequestId: validRequestId,
    dataId: null,
    secret: testSecret,
  });
  assert(resNoData.isValid === true, "Valid signature without dataId is accepted", resNoData.reason);

  // 3. Valid signature without requestId
  const sigNoReq = createMpSignature(testSecret, validDataId, null, now);
  const resNoReq = await verifyMercadoPagoWebhookSignature({
    xSignature: sigNoReq.xSignature,
    xRequestId: null,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(resNoReq.isValid === true, "Valid signature without requestId is accepted", resNoReq.reason);

  // 4. Altered payload: dataId changed
  const resTamperedData = await verifyMercadoPagoWebhookSignature({
    xSignature: validSig.xSignature,
    xRequestId: validRequestId,
    dataId: "payment_TAMPERED_000000",
    secret: testSecret,
  });
  assert(
    resTamperedData.isValid === false && resTamperedData.reason === "Signature mismatch",
    "Altered dataId payload is rejected with 'Signature mismatch'",
    `Received: ${JSON.stringify(resTamperedData)}`
  );

  // 5. Altered requestId
  const resTamperedReq = await verifyMercadoPagoWebhookSignature({
    xSignature: validSig.xSignature,
    xRequestId: "00000000-0000-0000-0000-000000000000",
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resTamperedReq.isValid === false && resTamperedReq.reason === "Signature mismatch",
    "Altered xRequestId is rejected with 'Signature mismatch'",
    `Received: ${JSON.stringify(resTamperedReq)}`
  );

  // 6. Altered secret
  const resWrongSecret = await verifyMercadoPagoWebhookSignature({
    xSignature: validSig.xSignature,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: "completely_different_attacker_secret",
  });
  assert(
    resWrongSecret.isValid === false && resWrongSecret.reason === "Signature mismatch",
    "Altered secret is rejected with 'Signature mismatch'",
    `Received: ${JSON.stringify(resWrongSecret)}`
  );

  // 7. Expired timestamp (>600 seconds in past)
  const expiredPastTs = now - 601;
  const expiredPastSig = createMpSignature(testSecret, validDataId, validRequestId, expiredPastTs);
  const resExpiredPast = await verifyMercadoPagoWebhookSignature({
    xSignature: expiredPastSig.xSignature,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resExpiredPast.isValid === false && resExpiredPast.reason?.includes("Timestamp out of acceptable window"),
    "Expired timestamp (>600s in past) is rejected",
    `Received: ${JSON.stringify(resExpiredPast)}`
  );

  // 8. Future timestamp (>600 seconds in future)
  const expiredFutureTs = now + 605;
  const expiredFutureSig = createMpSignature(testSecret, validDataId, validRequestId, expiredFutureTs);
  const resExpiredFuture = await verifyMercadoPagoWebhookSignature({
    xSignature: expiredFutureSig.xSignature,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resExpiredFuture.isValid === false && resExpiredFuture.reason?.includes("Timestamp out of acceptable window"),
    "Future timestamp (>600s in future) is rejected",
    `Received: ${JSON.stringify(resExpiredFuture)}`
  );

  // 9. Boundary timestamp right within window (now - 590s)
  const boundaryTs = now - 590;
  const boundarySig = createMpSignature(testSecret, validDataId, validRequestId, boundaryTs);
  const resBoundary = await verifyMercadoPagoWebhookSignature({
    xSignature: boundarySig.xSignature,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(resBoundary.isValid === true, "Boundary timestamp within window (590s) is accepted", resBoundary.reason);

  // 10. Custom tolerance window (e.g. 60s max, delta 70s)
  const customDeltaTs = now - 70;
  const customDeltaSig = createMpSignature(testSecret, validDataId, validRequestId, customDeltaTs);
  const resCustomDelta = await verifyMercadoPagoWebhookSignature({
    xSignature: customDeltaSig.xSignature,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
    maxTimestampDeltaSeconds: 60,
  });
  assert(
    resCustomDelta.isValid === false && resCustomDelta.reason?.includes("Timestamp out of acceptable window"),
    "Custom tolerance delta (60s max) correctly enforces tighter window",
    `Received: ${JSON.stringify(resCustomDelta)}`
  );

  // 11. Missing secret (undefined or empty)
  const resNoSecret = await verifyMercadoPagoWebhookSignature({
    xSignature: validSig.xSignature,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: undefined,
  });
  assert(
    resNoSecret.isValid === false && resNoSecret.reason === "Missing MERCADOPAGO_WEBHOOK_SECRET environment variable",
    "Missing secret returns descriptive failure",
    `Received: ${JSON.stringify(resNoSecret)}`
  );

  // 12. Missing xSignature header (null)
  const resNoSigHeader = await verifyMercadoPagoWebhookSignature({
    xSignature: null,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resNoSigHeader.isValid === false && resNoSigHeader.reason === "Missing x-signature header",
    "Missing x-signature header returns descriptive failure",
    `Received: ${JSON.stringify(resNoSigHeader)}`
  );

  // 13. Malformed xSignature missing v1
  const resNoV1 = await verifyMercadoPagoWebhookSignature({
    xSignature: `ts=${now}`,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resNoV1.isValid === false && resNoV1.reason === "Invalid x-signature header structure (missing ts or v1)",
    "Malformed x-signature missing v1 returns descriptive failure",
    `Received: ${JSON.stringify(resNoV1)}`
  );

  // 14. Malformed xSignature missing ts
  const resNoTs = await verifyMercadoPagoWebhookSignature({
    xSignature: `v1=${validSig.hash}`,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resNoTs.isValid === false && resNoTs.reason === "Invalid x-signature header structure (missing ts or v1)",
    "Malformed x-signature missing ts returns descriptive failure",
    `Received: ${JSON.stringify(resNoTs)}`
  );

  // 15. Malformed non-numeric timestamp
  const resNonNumericTs = await verifyMercadoPagoWebhookSignature({
    xSignature: `ts=NOT_A_NUMBER,v1=${validSig.hash}`,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resNonNumericTs.isValid === false && resNonNumericTs.reason === "Invalid timestamp in x-signature header",
    "Non-numeric timestamp in x-signature returns descriptive failure",
    `Received: ${JSON.stringify(resNonNumericTs)}`
  );

  // 16. Constant-time XOR comparison against length tampering (truncated hash)
  const truncatedHash = validSig.hash.slice(0, 32); // 32 chars instead of 64
  const resTruncated = await verifyMercadoPagoWebhookSignature({
    xSignature: `ts=${now},v1=${truncatedHash}`,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resTruncated.isValid === false && resTruncated.reason === "Hash length mismatch",
    "Truncated v1 hash (32 chars) rejected with 'Hash length mismatch'",
    `Received: ${JSON.stringify(resTruncated)}`
  );

  // 17. Constant-time XOR comparison against length tampering (extended hash)
  const extendedHash = validSig.hash + "01"; // 66 chars
  const resExtended = await verifyMercadoPagoWebhookSignature({
    xSignature: `ts=${now},v1=${extendedHash}`,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resExtended.isValid === false && resExtended.reason === "Hash length mismatch",
    "Extended v1 hash (66 chars) rejected with 'Hash length mismatch'",
    `Received: ${JSON.stringify(resExtended)}`
  );

  // 18. Constant-time XOR single-bit alterations with exact length (64 chars)
  // 18a. Alter first char
  const tamperedFirstChar = (validSig.hash[0] === "a" ? "b" : "a") + validSig.hash.slice(1);
  const resTamperedFirst = await verifyMercadoPagoWebhookSignature({
    xSignature: `ts=${now},v1=${tamperedFirstChar}`,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resTamperedFirst.isValid === false && resTamperedFirst.reason === "Signature mismatch",
    "Single char flip at index 0 rejected with 'Signature mismatch'",
    `Received: ${JSON.stringify(resTamperedFirst)}`
  );

  // 18b. Alter middle char
  const mid = Math.floor(validSig.hash.length / 2);
  const tamperedMidChar = validSig.hash.slice(0, mid) + (validSig.hash[mid] === "0" ? "1" : "0") + validSig.hash.slice(mid + 1);
  const resTamperedMid = await verifyMercadoPagoWebhookSignature({
    xSignature: `ts=${now},v1=${tamperedMidChar}`,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resTamperedMid.isValid === false && resTamperedMid.reason === "Signature mismatch",
    "Single char flip at index 32 rejected with 'Signature mismatch'",
    `Received: ${JSON.stringify(resTamperedMid)}`
  );

  // 18c. Alter last char
  const last = validSig.hash.length - 1;
  const tamperedLastChar = validSig.hash.slice(0, last) + (validSig.hash[last] === "f" ? "e" : "f");
  const resTamperedLast = await verifyMercadoPagoWebhookSignature({
    xSignature: `ts=${now},v1=${tamperedLastChar}`,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(
    resTamperedLast.isValid === false && resTamperedLast.reason === "Signature mismatch",
    "Single char flip at index 63 rejected with 'Signature mismatch'",
    `Received: ${JSON.stringify(resTamperedLast)}`
  );

  // 19. Header whitespace resilience (standard space after comma)
  const resWhitespace = await verifyMercadoPagoWebhookSignature({
    xSignature: `ts=${now}, v1=${validSig.hash}`,
    xRequestId: validRequestId,
    dataId: validDataId,
    secret: testSecret,
  });
  assert(resWhitespace.isValid === true, "Header with space after comma ('ts=..., v1=...') parsed cleanly", resWhitespace.reason);
}

async function runTarget2ProxyTests() {
  console.log("\n=======================================================");
  console.log("  TARGET 2: NEXT.JS 16 PROXY & EDGE SECURITY TESTS");
  console.log("=======================================================\n");

  const originalEnvUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalEnvAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalNodeEnv = process.env.NODE_ENV;

  try {
    // 20. Public non-admin route bypasses proxy without requiring auth or env vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const reqPublic = new NextRequest("http://localhost:3000/tienda/vestidos");
    const resPublic = await proxy(reqPublic);
    assert(
      resPublic.status === 200 && !resPublic.headers.get("location"),
      "Public route (/tienda/vestidos) is not intercepted by admin proxy"
    );

    // 21. Fail-closed: Missing NEXT_PUBLIC_SUPABASE_URL redirects to /login?error=config_missing
    const reqAdminNoUrl = new NextRequest("http://localhost:3000/admin/productos");
    const resAdminNoUrl = await proxy(reqAdminNoUrl);
    const locationNoUrl = resAdminNoUrl.headers.get("location");
    assert(
      resAdminNoUrl.status >= 300 && resAdminNoUrl.status < 400 && locationNoUrl?.includes("/login") && locationNoUrl?.includes("error=config_missing"),
      "Missing NEXT_PUBLIC_SUPABASE_URL redirects to /login?error=config_missing (fail-closed)",
      `Status: ${resAdminNoUrl.status}, Location: ${locationNoUrl}`
    );

    // 22. Fail-closed: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY redirects to /login?error=config_missing
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const reqAdminNoKey = new NextRequest("http://localhost:3000/admin/productos");
    const resAdminNoKey = await proxy(reqAdminNoKey);
    const locationNoKey = resAdminNoKey.headers.get("location");
    assert(
      resAdminNoKey.status >= 300 && resAdminNoKey.status < 400 && locationNoKey?.includes("/login") && locationNoKey?.includes("error=config_missing"),
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY redirects to /login?error=config_missing (fail-closed)",
      `Status: ${resAdminNoKey.status}, Location: ${locationNoKey}`
    );

    // 23. Adversarial dev_admin_bypass cookie with missing credentials
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    (process.env as any).NODE_ENV = "development";
    const reqBypassNoEnv = new NextRequest("http://localhost:3000/admin/dashboard", {
      headers: {
        cookie: "dev_admin_bypass=true",
      },
    });
    const resBypassNoEnv = await proxy(reqBypassNoEnv);
    const locationBypassNoEnv = resBypassNoEnv.headers.get("location");
    assert(
      resBypassNoEnv.status >= 300 && locationBypassNoEnv?.includes("error=config_missing"),
      "dev_admin_bypass cookie is completely ignored when env is missing",
      `Location: ${locationBypassNoEnv}`
    );

    // 24. Now test with credentials present and Supabase Auth session token in cookie
    const mockRef = "mockglak";
    process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${mockRef}.supabase.co`;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-jwt-key-123456789";

    // Create a mock session object as saved by Supabase SSR
    const mockSession = {
      access_token: "mock_jwt_access_token_xyz",
      refresh_token: "mock_refresh_token_xyz",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: "usr_mock_id",
        email: "test@glaktienda.com",
      },
    };
    const sessionCookieValue = encodeURIComponent(JSON.stringify(mockSession));
    const cookieName = `sb-${mockRef}-auth-token`;

    const originalFetch = globalThis.fetch;

    // Test 24a: No session / session expired (no cookie present)
    const reqNoSession = new NextRequest("http://localhost:3000/admin/dashboard");
    const resNoSession = await proxy(reqNoSession);
    const locNoSession = resNoSession.headers.get("location");
    assert(
      resNoSession.status >= 300 &&
      locNoSession?.includes("/login") &&
      locNoSession?.includes("next=%2Fadmin%2Fdashboard") &&
      locNoSession?.includes("error=session_expired"),
      "Unauthenticated request (no session cookie) to /admin/dashboard redirects to /login with session_expired error",
      `Location: ${locNoSession}`
    );

    // Test 24b: Adversarial dev_admin_bypass cookie with unauthenticated session
    (process.env as any).NODE_ENV = "development";
    const reqBypassCookie = new NextRequest("http://localhost:3000/admin/dashboard", {
      headers: {
        cookie: "dev_admin_bypass=true",
      },
    });
    const resBypassCookie = await proxy(reqBypassCookie);
    const locBypassCookie = resBypassCookie.headers.get("location");
    assert(
      resBypassCookie.status >= 300 && locBypassCookie?.includes("/login"),
      "dev_admin_bypass cookie is ignored even with NODE_ENV=development and credentials present",
      `Location: ${locBypassCookie}`
    );

    // Test 24c: User authenticated as regular customer (no admin claim)
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("/auth/v1/user")) {
        return new Response(
          JSON.stringify({
            id: "usr_customer_123",
            aud: "authenticated",
            role: "authenticated",
            email: "customer@example.com",
            app_metadata: {
              provider: "email",
              role: "customer",
              is_admin: false,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return originalFetch(input);
    };

    const reqCustomer = new NextRequest("http://localhost:3000/admin/inventario", {
      headers: {
        cookie: `${cookieName}=${sessionCookieValue}`,
      },
    });
    const resCustomer = await proxy(reqCustomer);
    const locCustomer = resCustomer.headers.get("location");
    assert(
      resCustomer.status >= 300 && locCustomer?.includes("/login") && locCustomer?.includes("error=unauthorized"),
      "Authenticated user without admin claim is rejected with /login?error=unauthorized",
      `Location: ${locCustomer}`
    );

    // Test 24d: Customer trying to tamper via user_metadata (editable by user)
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("/auth/v1/user")) {
        return new Response(
          JSON.stringify({
            id: "usr_attacker_tamper",
            aud: "authenticated",
            role: "authenticated",
            email: "attacker@example.com",
            user_metadata: {
              is_admin: true, // Injected by malicious user into client-editable user_metadata
              role: "admin",
            },
            app_metadata: {
              provider: "email",
              role: "customer", // Server-controlled claim is not admin
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return originalFetch(input);
    };

    const reqTamperUserMetadata = new NextRequest("http://localhost:3000/admin/inventario", {
      headers: {
        cookie: `${cookieName}=${sessionCookieValue}`,
      },
    });
    const resTamperUserMetadata = await proxy(reqTamperUserMetadata);
    const locTamper = resTamperUserMetadata.headers.get("location");
    assert(
      resTamperUserMetadata.status >= 300 && locTamper?.includes("error=unauthorized"),
      "Attacker spoofing is_admin in user_metadata is rejected (only app_metadata checked)",
      `Location: ${locTamper}`
    );

    // Test 24e: Legitimate Admin with app_metadata.is_admin === true
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("/auth/v1/user")) {
        return new Response(
          JSON.stringify({
            id: "usr_admin_001",
            aud: "authenticated",
            role: "authenticated",
            email: "admin@glaktienda.com",
            app_metadata: {
              provider: "email",
              is_admin: true,
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return originalFetch(input);
    };

    const reqAdminUser = new NextRequest("http://localhost:3000/admin/productos", {
      headers: {
        cookie: `${cookieName}=${sessionCookieValue}`,
      },
    });
    const resAdminUser = await proxy(reqAdminUser);
    assert(
      resAdminUser.status === 200 && !resAdminUser.headers.get("location"),
      "User with app_metadata.is_admin === true is permitted access (HTTP 200, no redirect)"
    );

    // Test 24f: Legitimate Admin with app_metadata.role === 'admin'
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("/auth/v1/user")) {
        return new Response(
          JSON.stringify({
            id: "usr_admin_002",
            aud: "authenticated",
            role: "authenticated",
            email: "admin2@glaktienda.com",
            app_metadata: {
              provider: "email",
              role: "admin",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return originalFetch(input);
    };

    const reqAdminRoleUser = new NextRequest("http://localhost:3000/admin/estandarizar", {
      headers: {
        cookie: `${cookieName}=${sessionCookieValue}`,
      },
    });
    const resAdminRoleUser = await proxy(reqAdminRoleUser);
    assert(
      resAdminRoleUser.status === 200 && !resAdminRoleUser.headers.get("location"),
      "User with app_metadata.role === 'admin' is permitted access (HTTP 200, no redirect)"
    );

    // Test 24g: Network error or fetch exception during auth fails closed
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("/auth/v1/user")) {
        throw new Error("DNS resolution ENOTFOUND or Edge timeout");
      }
      return originalFetch(input);
    };

    const reqAuthCrash = new NextRequest("http://localhost:3000/admin/pedidos", {
      headers: {
        cookie: `${cookieName}=${sessionCookieValue}`,
      },
    });
    const resAuthCrash = await proxy(reqAuthCrash);
    const locCrash = resAuthCrash.headers.get("location");
    assert(
      resAuthCrash.status >= 300 &&
      locCrash?.includes("/login") &&
      (locCrash?.includes("error=session_expired") || locCrash?.includes("error=auth_error")),
      "Network exception during auth check is handled safely and redirects to /login (fail-closed)",
      `Location: ${locCrash}`
    );

    // Restore original global.fetch
    globalThis.fetch = originalFetch;

  } finally {
    // Restore environment variables
    if (originalEnvUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnvUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (originalEnvAnon) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalEnvAnon;
    else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (originalNodeEnv) (process.env as any).NODE_ENV = originalNodeEnv;
    else delete (process.env as any).NODE_ENV;
  }
}

function runTarget3KeepAwakeWorkflowTests() {
  console.log("\n=======================================================");
  console.log("  TARGET 3: KEEP-AWAKE WORKFLOW SYNTAX & CONFIGURATION");
  console.log("=======================================================\n");

  const workflowPath = path.resolve(process.cwd(), ".github/workflows/keep-alive.yml");
  assert(fs.existsSync(workflowPath), "Keep-alive workflow file exists at .github/workflows/keep-alive.yml");

  const content = fs.readFileSync(workflowPath, "utf-8");

  // 1. Cron schedule
  assert(
    content.includes("cron: '0 12 * * *'") || content.includes('cron: "0 12 * * *"'),
    "Workflow includes daily cron schedule at 12:00 UTC ('0 12 * * *')"
  );

  // 2. Manual workflow dispatch
  assert(content.includes("workflow_dispatch:"), "Workflow includes workflow_dispatch for manual trigger");

  // 3. Fallback secrets
  assert(
    content.includes("${{ secrets.SUPABASE_URL || secrets.NEXT_PUBLIC_SUPABASE_URL }}"),
    "Workflow provides URL fallback: ${{ secrets.SUPABASE_URL || secrets.NEXT_PUBLIC_SUPABASE_URL }}"
  );
  assert(
    content.includes("secrets.SUPABASE_SERVICE_ROLE_KEY || secrets.SUPABASE_ANON_KEY || secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    "Workflow provides Key fallback: SERVICE_ROLE_KEY -> ANON_KEY -> NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );

  // 4. Missing variables validation and fail-fast
  assert(
    content.includes('[ -z "$SUPABASE_URL" ]') && content.includes('[ -z "$SUPABASE_KEY" ]'),
    "Workflow checks for missing URL and Key and prints GitHub Actions error annotations"
  );

  // 5. Canonical headers in curl
  assert(content.includes('-H "apikey: $SUPABASE_KEY"'), "curl command includes canonical 'apikey: $SUPABASE_KEY' header");
  assert(
    content.includes('-H "Authorization: Bearer $SUPABASE_KEY"'),
    "curl command includes canonical 'Authorization: Bearer $SUPABASE_KEY' header"
  );
  assert(content.includes('-H "Content-Type: application/json"'), "curl command includes 'Content-Type: application/json' header");

  // 6. Resilient timeouts
  assert(content.includes("--connect-timeout 10"), "curl enforces --connect-timeout 10");
  assert(content.includes("--max-time 15"), "curl enforces --max-time 15");

  // 7. Status code diagnostics
  assert(content.includes('"$HTTP_STATUS" -ge 200'), "Workflow handles 2xx responses as active");
  assert(content.includes('"$HTTP_STATUS" -eq 401'), "Workflow handles 401/403 responses with warning");
  assert(content.includes('"$HTTP_STATUS" -eq 000'), "Workflow handles 000 (DNS/timeout) error with actionable prompt to restore project");
}

function runTarget4DiagnosticScriptTests() {
  console.log("\n=======================================================");
  console.log("  TARGET 4: SUPABASE DIAGNOSTIC SCRIPT & PACKAGE.JSON");
  console.log("=======================================================\n");

  const scriptPath = path.resolve(process.cwd(), "scripts/test-supabase.ts");
  assert(fs.existsSync(scriptPath), "Diagnostic script exists at scripts/test-supabase.ts");

  const pkgJsonPath = path.resolve(process.cwd(), "package.json");
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
  assert(
    pkgJson.scripts && pkgJson.scripts["test:supabase"] === "npx tsx scripts/test-supabase.ts",
    "package.json scripts contains 'test:supabase': 'npx tsx scripts/test-supabase.ts'"
  );

  const scriptContent = fs.readFileSync(scriptPath, "utf-8");
  assert(
    scriptContent.includes("ENOTFOUND"),
    "Diagnostic script explicitly handles ENOTFOUND DNS error code"
  );
  assert(
    scriptContent.includes("Restore project") || scriptContent.includes("dashboard"),
    "Diagnostic script guides the user to the Supabase dashboard to restore the paused project"
  );
  assert(
    scriptContent.includes("runDiagnostics().catch"),
    "Diagnostic script has top-level catch handler preventing unhandled promise rejections"
  );
}

async function main() {
  console.log("\n==================================================================");
  console.log("  CHALLENGER 1: EMPIRICAL CORRECTNESS & ADVERSARIAL STRESS SUITE");
  console.log("==================================================================");

  await runTarget1WebhookSignatureTests();
  await runTarget2ProxyTests();
  runTarget3KeepAwakeWorkflowTests();
  runTarget4DiagnosticScriptTests();

  console.log("\n==================================================================");
  console.log("  FINAL RESULTS SUMMARY");
  console.log("==================================================================");
  console.log(`  Total Tests Run: ${passedTests + failedTests}`);
  console.log(`  Passed Tests:    ${passedTests}`);
  console.log(`  Failed Tests:    ${failedTests}`);

  if (failedTests > 0) {
    console.error(`\n❌ SUITE FAILED with ${failedTests} failure(s)!\n`);
    process.exit(1);
  } else {
    console.log(`\n✅ ALL ${passedTests} EMPIRICAL TESTS PASSED WITH 0 FAILURES!\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
