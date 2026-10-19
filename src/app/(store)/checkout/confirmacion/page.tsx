import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Confirmación de Pedido — Glak',
  description: 'Estado del procesamiento de tu pedido en Glak Tienda.',
};

interface PageProps {
  searchParams: Promise<{
    order_id?: string;
    status?: string;
    payment_id?: string;
  }>;
}

export default async function ConfirmacionPage({ searchParams }: PageProps) {
  const { order_id: orderId, status } = await searchParams;

  if (!orderId) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', minHeight: '60vh' }}>
        <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>❌</span>
        <h1 className="font-editorial" style={{ fontSize: 'var(--text-3xl)', marginBottom: '1rem' }}>Falta información de la orden</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto 2rem auto' }}>
          No pudimos localizar la referencia de tu compra. Si creés que esto es un error, por favor contactate con soporte.
        </p>
        <Link href="/tienda" className="btn btn-primary">
          Volver a la Tienda
        </Link>
      </div>
    );
  }

  // Fetch the order from database to show authentic details
  const supabase = createPublicClient();
  const { data: order } = await supabase
    .from('orders')
    .select('first_name, last_name, email, total, shipping_cost, shipping_method, payment_status')
    .eq('id', orderId)
    .single();

  const isApproved = status === 'approved' || order?.payment_status === 'approved';
  const isPending = status === 'pending' || order?.payment_status === 'pending';

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-12)', minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-float" style={{
        maxWidth: '600px',
        width: '100%',
        padding: 'var(--space-8)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)'
      }}>
        {isApproved ? (
          <>
            <span style={{ fontSize: '4.5rem', display: 'block', animation: 'bounce 0.8s ease' }}>✨</span>
            <h1 className="font-editorial" style={{ fontSize: 'var(--text-3xl)', color: 'var(--accent-primary)', margin: 0 }}>
              ¡Gracias por tu compra!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', margin: '0 0 var(--space-2) 0' }}>
              Hola {order?.first_name || 'cliente'}, tu pago fue acreditado con éxito. Ya estamos preparando tu orden para ser despachada.
            </p>
          </>
        ) : isPending ? (
          <>
            <span style={{ fontSize: '4.5rem', display: 'block' }}>⏳</span>
            <h1 className="font-editorial" style={{ fontSize: 'var(--text-3xl)', color: 'var(--warning)', margin: 0 }}>
              Pago en Proceso
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', margin: '0 0 var(--space-2) 0' }}>
              Tu pago está siendo procesado por Mercado Pago. Recibirás una notificación por email en cuanto sea aprobado.
            </p>
          </>
        ) : (
          <>
            <span style={{ fontSize: '4.5rem', display: 'block' }}>❓</span>
            <h1 className="font-editorial" style={{ fontSize: 'var(--text-3xl)', color: 'var(--text-primary)', margin: 0 }}>
              Compra Registrada
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', margin: '0 0 var(--space-2) 0' }}>
              Estamos validando el estado del pago con la entidad financiera. Conservá tu número de orden para cualquier consulta.
            </p>
          </>
        )}

        {/* Detalles de la Orden */}
        <div style={{
          width: '100%',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4) var(--space-6)',
          fontSize: 'var(--text-sm)',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          border: '1px solid var(--border-subtle)',
          marginBlock: 'var(--space-2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span style={{ fontWeight: 600 }}>Número de Pedido:</span>
            <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{orderId}</span>
          </div>
          {order && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cliente:</span>
                <span style={{ fontWeight: 600 }}>{order.first_name} {order.last_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                <span>{order.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Método de envío:</span>
                <span style={{ textTransform: 'capitalize' }}>{order.shipping_method.replace(/_/g, ' ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px dashed var(--border-strong)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)', fontSize: 'var(--text-base)', fontWeight: 700 }}>
                <span>Total Abonado:</span>
                <span style={{ color: 'var(--accent-primary)' }}>${Number(order.total).toLocaleString('es-AR')}</span>
              </div>
            </>
          )}
        </div>

        <div style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          lineHeight: 1.5,
          maxWidth: '420px',
          marginBlock: 'var(--space-2)'
        }}>
          💡 Enviamos un mail automático a tu casilla con los detalles del flete y tu factura digital. Cuando despachemos, recibirás el código de seguimiento.
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', width: '100%', marginTop: 'var(--space-2)' }}>
          <Link href="/tienda" className="btn btn-primary" style={{ flex: 1 }}>
            Seguir Comprando
          </Link>
          <Link href="/mi-cuenta" className="btn btn-secondary" style={{ flex: 1 }}>
            Ver Mis Pedidos
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
