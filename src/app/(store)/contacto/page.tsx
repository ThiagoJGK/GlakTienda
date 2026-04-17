import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto — Glak',
  description: 'Contactanos por WhatsApp, email o Instagram. Estamos para ayudarte.',
};

export default function ContactoPage() {
  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: '0.5rem' }}>
        Contacto
      </h1>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
        ¿Tenés alguna duda sobre un producto, un pedido o tu talle? Estamos para ayudarte.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {/* WhatsApp */}
        <a
          href="https://wa.me/5491169675050"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            textDecoration: 'none',
            color: 'var(--text-primary)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          <span style={{ fontSize: '2rem' }}>💬</span>
          <div>
            <strong style={{ display: 'block', marginBottom: 2 }}>WhatsApp</strong>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Escribinos y te respondemos en minutos
            </span>
          </div>
        </a>

        {/* Email */}
        <a
          href="mailto:adrigglak@gmail.com"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            textDecoration: 'none',
            color: 'var(--text-primary)',
          }}
        >
          <span style={{ fontSize: '2rem' }}>📧</span>
          <div>
            <strong style={{ display: 'block', marginBottom: 2 }}>Email</strong>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              adrigglak@gmail.com
            </span>
          </div>
        </a>

        {/* Instagram */}
        <a
          href="https://instagram.com/glak_tienda"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            textDecoration: 'none',
            color: 'var(--text-primary)',
          }}
        >
          <span style={{ fontSize: '2rem' }}>📸</span>
          <div>
            <strong style={{ display: 'block', marginBottom: 2 }}>Instagram</strong>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              @glak_tienda
            </span>
          </div>
        </a>
      </div>

      <div style={{
        padding: '1rem 1.5rem',
        background: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-lg)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-tertiary)',
      }}>
        🕐 <strong>Horario de atención:</strong> Lunes a Viernes de 9:00 a 18:00 hs
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link href="/" style={{ color: 'var(--accent-primary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
