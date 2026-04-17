import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Configuración — Admin Glak' };

export default function ConfiguracionAdminPage() {
  return (
    <div style={{ padding: '2rem 0', textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</span>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: '0.5rem' }}>Configuración</h1>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.6 }}>
        Próximamente vas a poder configurar datos de tu tienda, medios de pago, envíos y notificaciones.
      </p>
    </div>
  );
}
