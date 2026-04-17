'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
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
      <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚡</span>
      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: '0.5rem' }}>
        Algo salió mal
      </h1>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: 420, marginBottom: '2rem', lineHeight: 1.6 }}>
        Ocurrió un error inesperado. Estamos trabajando para solucionarlo.
      </p>
      <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-xl)' }} onClick={() => reset()}>
        Reintentar
      </button>
    </div>
  );
}
