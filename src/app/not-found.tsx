import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌿</span>
      <h1 style={{ fontSize: 'var(--text-4xl)', fontWeight: 700, marginBottom: '0.5rem' }}>
        Ups, esta página no existe
      </h1>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: 420, marginBottom: '2rem', lineHeight: 1.6 }}>
        Puede que el enlace esté desactualizado o que la página haya sido movida. 
        Pero no te preocupes, tenemos mucho para mostrarte.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" className="btn btn-primary" style={{ borderRadius: 'var(--radius-xl)' }}>
          Volver al inicio
        </Link>
        <Link href="/tienda" className="btn btn-secondary" style={{ borderRadius: 'var(--radius-xl)' }}>
          Ir a la tienda
        </Link>
      </div>
    </div>
  );
}
