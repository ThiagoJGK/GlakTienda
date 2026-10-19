"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

/**
 * Inner Login Form Component.
 * Interacts with client-side Supabase client and supports custom claims parsing.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Extract router states from search parameters
  const errorParam = searchParams.get("error");
  const nextParam = searchParams.get("next") || "/admin";

  useEffect(() => {
    // If the middleware redirected with unauthorized error, show a custom detailed warning
    if (errorParam === "unauthorized") {
      setErrorMessage(
        "Acceso restringido. Tu cuenta no cuenta con permisos de administrador de GLak Tienda. Por favor, ingresá con un usuario autorizado."
      );
    }
  }, [errorParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage("Por favor, completá todos los campos.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Credenciales inválidas. Verificá tu correo y contraseña.");
        }
        throw error;
      }

      // Login succeeded, double-check claims in client session for visual feedback
      const user = data.user;
      const isAdmin =
        user?.app_metadata?.is_admin === true ||
        user?.app_metadata?.role === "admin";

      if (!isAdmin && nextParam.startsWith("/admin")) {
        // Logged in but not an admin, sign out or show restriction
        await supabase.auth.signOut();
        throw new Error(
          "El usuario ingresado no posee permisos administrativos en esta tienda."
        );
      }

      setSuccessMessage("¡Ingreso exitoso! Redirigiendo...");
      
      // Use window.location.href to perform a clean browser navigation.
      // This forces Next.js middleware to run and fetch new cookie contexts cleanly.
      setTimeout(() => {
        window.location.href = nextParam;
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Ocurrió un error inesperado al intentar ingresar.");
      setIsLoading(false);
    }
  };

  const handleDevBypass = () => {
    document.cookie = "dev_admin_bypass=true; path=/; max-age=86400";
    setSuccessMessage("⚡ Acceso temporal concedido. Redirigiendo al panel...");
    setTimeout(() => {
      window.location.href = "/admin";
    }, 400);
  };

  return (
    <div className={styles.loginCard}>
      {/* Orb ambient lighting */}
      <div className={styles.ambientOrb1} />
      <div className={styles.ambientOrb2} />

      <div className={styles.header}>
        <div className={styles.brandName}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          GLak
        </div>
        <div className={styles.editorialSubtitle}>
          Administración y Control de Catálogo
        </div>
      </div>

      {/* Visual Alerts */}
      {errorMessage && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <svg
            className={styles.alertIcon}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <svg
            className={styles.alertIcon}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className={styles.form}>
        {/* Email Field */}
        <div className={styles.formGroup}>
          <label htmlFor="email" className="label">
            Correo Electrónico
          </label>
          <div className={styles.inputWrapper}>
            <svg
              className={styles.inputIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <input
              id="email"
              type="email"
              placeholder="admin@glak.com.ar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.inputField}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className={styles.formGroup}>
          <label htmlFor="password" className="label">
            Contraseña
          </label>
          <div className={styles.inputWrapper}>
            <svg
              className={styles.inputIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.inputField}
              disabled={isLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Forgot Password link or secondary row */}
        <div className={styles.actionRow}>
          <a href="/contacto" className={styles.forgotLink}>
            ¿Problemas para ingresar? Contactar Soporte
          </a>
        </div>

        {/* Submit action */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className={styles.spinner} />
              <span>Verificando...</span>
            </>
          ) : (
            <span>Ingresar al Sistema</span>
          )}
        </button>

        {/* Temporary Dev Bypass Button */}
        <button
          type="button"
          onClick={handleDevBypass}
          className={styles.devBypassBtn}
        >
          ⚡ Entrar Directamente al Admin (Acceso Temporal Dev)
        </button>
      </form>

      <div className={styles.cardFooter}>
        Al ingresar, aceptás los términos de confidencialidad de datos.
        <br />
        <a href="/">Volver a la Tienda</a>
      </div>
    </div>
  );
}

/**
 * Standard Loading Skeleton for the Suspense Boundary.
 * Provides a high-fidelity visual preview during dynamic hydration of URL states.
 */
function LoginFallback() {
  return (
    <div className={styles.loginCard}>
      <div className={styles.header}>
        <div className={styles.brandName}>
          <div className="skeleton" style={{ width: "100px", height: "32px" }} />
        </div>
        <div className={styles.editorialSubtitle}>
          <div className="skeleton" style={{ width: "200px", height: "16px", margin: "8px auto 0" }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <div className="skeleton" style={{ width: "80px", height: "14px", marginBottom: "8px" }} />
          <div className="skeleton" style={{ width: "100%", height: "48px" }} />
        </div>
        <div>
          <div className="skeleton" style={{ width: "80px", height: "14px", marginBottom: "8px" }} />
          <div className="skeleton" style={{ width: "100%", height: "48px" }} />
        </div>
        <div className="skeleton" style={{ width: "100%", height: "48px", marginTop: "16px" }} />
      </div>
    </div>
  );
}

/**
 * Main Page Component.
 * Integrates a Suspense boundary to safe-guard dynamic routing hooks under Server Side Rendering.
 */
export default function LoginPage() {
  return (
    <section className={styles.loginSection}>
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
