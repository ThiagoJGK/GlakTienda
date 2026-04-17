import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout — Glak',
};

export default function CheckoutPage() {
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
      <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</span>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: '0.5rem' }}>
        Checkout
      </h1>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: 380, marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Estamos preparando la integración con Mercado Pago. Muy pronto vas a poder completar tu compra online.
      </p>
      <Link href="/tienda" className="btn btn-primary" style={{ borderRadius: 'var(--radius-xl)' }}>
        Seguir comprando
      </Link>
    </div>
  );
}
