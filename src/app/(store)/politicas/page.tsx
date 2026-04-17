import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Políticas — Glak',
  description: 'Términos y condiciones, política de devoluciones y botón de arrepentimiento de Glak.',
};

export default function PoliticasPage() {
  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: '2rem' }}>
        Políticas de Glak
      </h1>

      {/* Términos y Condiciones */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-primary)' }}>
          Términos y Condiciones
        </h2>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <p>Al realizar una compra en <strong>glak.com.ar</strong>, el usuario acepta los siguientes términos:</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Los productos exhibidos están sujetos a disponibilidad de stock.</li>
            <li>Los precios publicados incluyen IVA y están expresados en Pesos Argentinos (ARS).</li>
            <li>Las imágenes son ilustrativas. Pueden existir leves variaciones de color según la pantalla del dispositivo.</li>
            <li>Glak se reserva el derecho de cancelar pedidos en los que se detecten irregularidades.</li>
            <li>La confirmación de compra se envía por correo electrónico una vez procesado el pago.</li>
          </ul>
        </div>
      </section>

      {/* Medios de Pago */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-primary)' }}>
          Medios de Pago
        </h2>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <p>Aceptamos los siguientes medios de pago a través de <strong>Mercado Pago</strong>:</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Tarjetas de crédito (Visa, Mastercard, American Express) — hasta 3 cuotas sin interés</li>
            <li>Tarjetas de débito</li>
            <li>Transferencia bancaria / CBU</li>
            <li>Billetera Mercado Pago</li>
          </ul>
        </div>
      </section>

      {/* Envíos */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-primary)' }}>
          Envíos
        </h2>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Envío gratis</strong> en compras superiores a $25.000.</li>
            <li>Paraná y alrededores: entrega en 24-48 horas hábiles.</li>
            <li>Interior del país: envío por correo, 5 a 10 días hábiles.</li>
            <li>Una vez despachado el pedido, recibirás el código de seguimiento por email.</li>
          </ul>
        </div>
      </section>

      {/* Devoluciones */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-primary)' }}>
          Política de Devoluciones
        </h2>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <p>De acuerdo con la Ley de Defensa del Consumidor N° 24.240:</p>
          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Disponés de <strong>10 días corridos</strong> desde la recepción del producto para solicitar una devolución.</li>
            <li>El producto debe estar sin uso, con etiquetas originales y en su empaque.</li>
            <li>Para iniciar una devolución, contactanos por email o WhatsApp indicando el número de pedido.</li>
            <li>El reembolso se procesará por el mismo medio de pago utilizado, en un plazo de 5 a 10 días hábiles.</li>
          </ul>
        </div>
      </section>

      {/* Botón de Arrepentimiento */}
      <section id="arrepentimiento" style={{
        marginBottom: '3rem',
        padding: '2rem',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
      }}>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
          🔄 Botón de Arrepentimiento
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1rem' }}>
          En cumplimiento del Art. 34 de la Ley 24.240 de Defensa del Consumidor, podés arrepentirte de tu compra online dentro de los <strong>10 días corridos</strong> posteriores a la recepción del producto, sin necesidad de justificación.
        </p>
        <a
          href="mailto:adrigglak@gmail.com?subject=Botón de Arrepentimiento - Quiero devolver mi compra&body=Hola, quiero ejercer mi derecho de arrepentimiento.%0D%0A%0D%0ANúmero de pedido:%0D%0AProducto:%0D%0AMotivo (opcional):"
          className="btn btn-primary"
          style={{ borderRadius: 'var(--radius-xl)', display: 'inline-block' }}
        >
          Solicitar devolución por arrepentimiento
        </a>
      </section>

      {/* Defensa del consumidor */}
      <section style={{ padding: '1.5rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          Para consultas o reclamos, podés comunicarte con la Dirección Nacional de Defensa del Consumidor:{' '}
          <a
            href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}
          >
            www.argentina.gob.ar/defensadelconsumidor
          </a>
        </p>
      </section>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link href="/" style={{ color: 'var(--accent-primary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
