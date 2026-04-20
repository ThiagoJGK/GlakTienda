import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guía de Talles — Glak',
  description: 'Encontrá tu talle ideal con nuestra guía de medidas. Moda femenina Glak.',
};

export default function TallesPage() {
  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: '0.5rem' }}>
        Guía de Talles
      </h1>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
        Antes de ver la tabla tradicional, tené en cuenta cómo se diseña nuestra colección europea.
      </p>

      {/* Italian Fashion Manifesto Info */}
      <div style={{
        padding: '1.5rem',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--accent-primary)',
        marginBottom: '2rem',
        boxShadow: '0 4px 12px rgba(86, 130, 3, 0.05)'
      }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-primary)' }}>
          🇮🇹 Nota sobre la Colección Italiana
        </h2>
        <div style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <p style={{marginBottom: '1rem'}}>
            Fiel a su estética y caída natural europea, nuestra <strong>Colección de Lino Italiano se maneja en "Talle Único" orgánico.</strong>
          </p>
          <p>
            Esto significa que las prendas tienen un corte diseñado específicamente de forma holgada.
            Gracias al peso y caída premium de la tela, <strong>se adaptan y estilizan al instante cualquier figura</strong>, garantizando comodidad sin apretar ni marcar.
          </p>
        </div>
      </div>

      {/* Size table */}
      <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'var(--text-sm)',
          minWidth: 400,
        }}>
          <thead>
            <tr style={{ background: 'var(--accent-primary)', color: '#fff' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Talle</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Busto (cm)</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Cintura (cm)</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600 }}>Cadera (cm)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { talle: 'XS', busto: '80-84', cintura: '62-66', cadera: '86-90' },
              { talle: 'S', busto: '84-88', cintura: '66-70', cadera: '90-94' },
              { talle: 'M', busto: '88-92', cintura: '70-74', cadera: '94-98' },
              { talle: 'L', busto: '92-96', cintura: '74-78', cadera: '98-102' },
              { talle: 'XL', busto: '96-100', cintura: '78-82', cadera: '102-106' },
            ].map((row, i) => (
              <tr key={row.talle} style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-primary)',
              }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--accent-primary)' }}>{row.talle}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>{row.busto}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>{row.cintura}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>{row.cadera}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* How to measure */}
      <div style={{
        padding: '1.5rem',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '1rem' }}>
          📏 ¿Cómo tomarse las medidas?
        </h2>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Busto:</strong> Medí la parte más ancha del pecho, pasando la cinta por debajo de las axilas.</li>
            <li><strong>Cintura:</strong> Medí la parte más angosta del torso, generalmente a la altura del ombligo.</li>
            <li><strong>Cadera:</strong> Medí la parte más ancha de la cadera.</li>
          </ol>
        </div>
      </div>

      {/* Tip */}
      <div style={{
        padding: '1rem 1.5rem',
        background: 'rgba(86, 130, 3, 0.08)',
        borderRadius: 'var(--radius-lg)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        marginBottom: '2rem',
      }}>
        💡 <strong>Tip:</strong> Si estás entre dos talles, te recomendamos elegir el más grande para mayor comodidad.
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/tienda" style={{ color: 'var(--accent-primary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
          ← Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
