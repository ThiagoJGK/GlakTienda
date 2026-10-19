import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local and .env
loadEnvConfig(process.cwd());

interface DiagnosticResult {
  step: string;
  status: "PASS" | "WARN" | "FAIL";
  message: string;
  details?: any;
}

async function runDiagnostics(): Promise<void> {
  console.log("\n=======================================================");
  console.log("  GLAK TIENDA — SUPABASE CONNECTIVITY & HEALTH CHECK");
  console.log("=======================================================\n");

  const results: DiagnosticResult[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Step 1: Environment Variables Check
  const dummyValues = ["your_supabase_url", "your_supabase_anon_key", ""];
  const isUrlConfigured = !!supabaseUrl && !dummyValues.includes(supabaseUrl.trim());
  const isAnonKeyConfigured = !!anonKey && !dummyValues.includes(anonKey.trim());
  const isServiceRoleConfigured = !!serviceRoleKey && !dummyValues.includes(serviceRoleKey.trim());

  if (!isUrlConfigured || !isAnonKeyConfigured) {
    results.push({
      step: "Environment Configuration",
      status: "FAIL",
      message: "Missing or dummy Supabase credentials in .env.local",
      details: {
        NEXT_PUBLIC_SUPABASE_URL: isUrlConfigured ? "Present" : "Missing / Dummy",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: isAnonKeyConfigured ? "Present" : "Missing / Dummy",
        SUPABASE_SERVICE_ROLE_KEY: isServiceRoleConfigured ? "Present" : "Missing (Optional)",
      },
    });

    printSummary(results);
    console.log("\nAction required: Add valid Supabase credentials to glak-tienda/.env.local\n");
    process.exit(1);
  }

  results.push({
    step: "Environment Configuration",
    status: "PASS",
    message: "Valid Supabase URL and Keys detected in environment.",
  });

  const sanitizedUrl = supabaseUrl.replace(/\/$/, "");

  // Step 2: DNS & Network Ping Check
  let dnsReachable = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const healthRes = await fetch(`${sanitizedUrl}/auth/v1/health`, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (healthRes.ok) {
      dnsReachable = true;
      results.push({
        step: "Host Reachability & DNS",
        status: "PASS",
        message: `Connected to Supabase endpoint (${healthRes.status} OK).`,
      });
    } else {
      dnsReachable = true;
      results.push({
        step: "Host Reachability & DNS",
        status: "WARN",
        message: `Endpoint reachable but returned HTTP ${healthRes.status}.`,
      });
    }
  } catch (err: any) {
    const isDnsError =
      err.code === "ENOTFOUND" ||
      (err.message && err.message.includes("ENOTFOUND")) ||
      (err.cause && String(err.cause).includes("ENOTFOUND"));

    results.push({
      step: "Host Reachability & DNS",
      status: "FAIL",
      message: isDnsError
        ? "DNS resolution failed (ENOTFOUND). Your Supabase project is likely PAUSED due to free-tier inactivity."
        : `Network connection failed: ${err.message}`,
      details: isDnsError
        ? "Go to https://supabase.com/dashboard -> select project -> click 'Restore project'."
        : undefined,
    });

    printSummary(results);
    process.exit(1);
  }

  // Step 3: PostgREST Database Query Check (Public anon client)
  if (dnsReachable) {
    try {
      const supabase = createClient(sanitizedUrl, anonKey, {
        auth: { persistSession: false },
      });

      const { data, error, status } = await supabase
        .from("products")
        .select("id, name, price")
        .limit(1);

      if (error) {
        if (error.code === "PGRST204" || error.message.includes("does not exist")) {
          results.push({
            step: "Database Query (products table)",
            status: "WARN",
            message: "PostgreSQL connected, but 'products' table does not exist yet. Run migrations.",
            details: error.message,
          });
        } else if (error.code === "42501") {
          results.push({
            step: "Database Query (products table)",
            status: "WARN",
            message: "Connected, but RLS denied public select on 'products'. Check RLS policies.",
            details: error.message,
          });
        } else {
          results.push({
            step: "Database Query (products table)",
            status: "WARN",
            message: `PostgREST query returned status ${status}: ${error.message}`,
          });
        }
      } else {
        results.push({
          step: "Database Query (products table)",
          status: "PASS",
          message: `PostgreSQL query executed successfully (${data?.length ?? 0} rows retrieved).`,
        });
      }
    } catch (err: any) {
      results.push({
        step: "Database Query (products table)",
        status: "FAIL",
        message: `Database query threw an exception: ${err.message}`,
      });
    }

    // Step 4: Auth Service Check
    try {
      const supabase = createClient(sanitizedUrl, anonKey, {
        auth: { persistSession: false },
      });
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        results.push({
          step: "Auth Service Health",
          status: "WARN",
          message: `Auth service responded with error: ${sessionError.message}`,
        });
      } else {
        results.push({
          step: "Auth Service Health",
          status: "PASS",
          message: "Auth service operational.",
        });
      }
    } catch (err: any) {
      results.push({
        step: "Auth Service Health",
        status: "FAIL",
        message: `Auth check threw: ${err.message}`,
      });
    }

    // Step 5: Service Role Key Administrative Access Check (if configured)
    if (isServiceRoleConfigured) {
      try {
        const adminClient = createClient(sanitizedUrl, serviceRoleKey!, {
          auth: { persistSession: false },
        });
        const { data: usersData, error: userError } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        });

        if (userError) {
          results.push({
            step: "Admin Service Role Access",
            status: "WARN",
            message: `Service role key provided but administrative user check returned: ${userError.message}`,
          });
        } else {
          results.push({
            step: "Admin Service Role Access",
            status: "PASS",
            message: `Service role key verified. Administrative access active (${usersData.users.length} users indexed).`,
          });
        }
      } catch (err: any) {
        results.push({
          step: "Admin Service Role Access",
          status: "WARN",
          message: `Service role test threw: ${err.message}`,
        });
      }
    } else {
      results.push({
        step: "Admin Service Role Access",
        status: "WARN",
        message: "SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local (Required for webhooks and background jobs).",
      });
    }
  }

  printSummary(results);
}

function printSummary(results: DiagnosticResult[]) {
  console.log("\n------------------ DIAGNOSTIC RESULTS ------------------");
  let hasFailures = false;

  for (const res of results) {
    const icon = res.status === "PASS" ? "✅ [PASS]" : res.status === "WARN" ? "⚠️  [WARN]" : "❌ [FAIL]";
    console.log(`${icon} ${res.step}: ${res.message}`);
    if (res.details) {
      console.log(`   Details:`, JSON.stringify(res.details, null, 2));
    }
    if (res.status === "FAIL") hasFailures = true;
  }

  console.log("--------------------------------------------------------\n");
  if (hasFailures) {
    console.log("❌ One or more critical checks failed. Follow instructions above to resolve.\n");
  } else {
    console.log("🎉 Supabase connectivity and core services are healthy!\n");
  }
}

runDiagnostics().catch((err) => {
  console.error("Unexpected error in diagnostics runner:", err);
  process.exit(1);
});
