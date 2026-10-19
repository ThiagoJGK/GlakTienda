import { createClient } from "./server";
import { User, SupabaseClient } from "@supabase/supabase-js";

export type AdminAuthContext = {
  supabase: SupabaseClient;
  user: User;
};

/**
 * Higher-order function to wrap a server action with admin authentication validation.
 * Cryptographically validates the session token and custom is_admin claim.
 */
export function withAdminAuth<TArgs extends any[], TResult>(
  action: (context: AdminAuthContext, ...args: TArgs) => Promise<TResult>
) {
  return async (...args: TArgs): Promise<{ success: false; error: string } | TResult> => {
    try {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      // Development-only bypass: Allow local testing when dev_admin_bypass cookie is set
      if (process.env.NODE_ENV === "development") {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        if (cookieStore.get("dev_admin_bypass")?.value === "true") {
          const devAdminUser: User = user || ({
            id: "dev-admin-user",
            app_metadata: { is_admin: true, role: "admin" },
            user_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User);
          return await action({ supabase, user: devAdminUser }, ...args);
        }
      }

      if (authError || !user) {
        console.error("Unauthorized: Session validation failed", authError);
        return { success: false, error: "No autorizado: Sesión inválida o expirada" };
      }

      const isAdmin =
        user.app_metadata?.is_admin === true ||
        user.app_metadata?.role === "admin";
      if (!isAdmin) {
        console.error(`Forbidden: User ${user.email} is not an administrator`);
        return { success: false, error: "No autorizado: Se requieren privilegios de administrador" };
      }

      return await action({ supabase, user }, ...args);
    } catch (error: any) {
      console.error("Internal Server Error in Server Action wrapper:", error);
      return { success: false, error: error?.message || "Error interno del servidor" };
    }
  };
}
