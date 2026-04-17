import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi Cuenta — Glak',
  description: 'Accedé a tu cuenta Glak. Historial de pedidos y datos personales.',
};

export default function MiCuentaPage() {
  return (
    <div className="container" style={{
      padding: '3rem 1rem',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</span>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: '0.5rem' }}>
        Mi Cuenta
      </h1>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: 380, marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Próximamente vas a poder iniciar sesión, ver tu historial de compras y gestionar tus datos.
      </p>
      <Link href="/tienda" className="btn btn-primary" style={{ borderRadius: 'var(--radius-xl)' }}>
        Seguir comprando
      </Link>
    </div>
  );
}
