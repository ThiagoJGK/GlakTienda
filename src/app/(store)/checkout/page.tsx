import type { Metadata } from 'next';
import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout — Glak',
  description: 'Completá tu pedido de indumentaria de alta costura de forma segura a través de Mercado Pago.',
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ paddingBlock: 'var(--space-12)', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: 'var(--text-xl)' }}>Cargando checkout...</h2>
      </div>
    }>
      <CheckoutClient />
    </Suspense>
  );
}
