import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Favoritos — Glak',
  description: 'Tus productos favoritos de Glak.',
};

export default function FavoritosPage() {
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
      <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>❤️</span>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: '0.5rem' }}>
        Tus Favoritos
      </h1>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: 380, marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Próximamente vas a poder guardar tus prendas favoritas y encontrarlas rápidamente.
      </p>
      <Link href="/tienda" className="btn btn-primary" style={{ borderRadius: 'var(--radius-xl)' }}>
        Explorar la tienda
      </Link>
    </div>
  );
}
