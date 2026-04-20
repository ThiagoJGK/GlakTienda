'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import styles from './CartDrawer.module.css';

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function CartDrawer() {
  const { items, isOpen, close, updateQuantity, removeItem, totalItems, totalPrice, freeShippingRemaining } = useCartStore();
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle open/close state with animation timing
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      if (shouldRender) {
        setIsClosing(true);
        const timer = setTimeout(() => {
          setShouldRender(false);
          setIsClosing(false);
          document.body.style.overflow = 'unset';
        }, 400); // Wait for the slideOutRight CSS animation
        return () => clearTimeout(timer);
      } else {
        document.body.style.overflow = 'unset';
      }
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const total = totalPrice();
  const count = totalItems();
  const remaining = freeShippingRemaining();
  const shippingProgress = Math.min(100, (total / 25000) * 100);

  return (
    <>
      <div className={`${styles.backdrop} ${isClosing ? styles.closing : ''}`} onClick={close} />
      <aside className={`${styles.drawer} ${isClosing ? styles.closing : ''}`} aria-label="Carrito de compras">
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Tu carrito
            {count > 0 && <span className={styles.badge}>{count}</span>}
          </h2>
          <button className={styles.closeBtn} onClick={close} aria-label="Cerrar carrito">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          /* Empty State */
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>Tu armario está vacío</h3>
            <p className={styles.emptyText}>Pero podemos arreglarlo. Descubrí las novedades de la temporada.</p>
            <Link href="/tienda" className={`btn btn-primary btn-lg btn-block ${styles.emptyCta}`} onClick={close}>
              Descubrir Novedades
            </Link>
          </div>
        ) : (
          <>
            {/* Free Shipping Progress */}
            <div className={styles.shippingBar}>
              {remaining > 0 ? (
                <p className={styles.shippingText}>
                  Te faltan <strong>{formatPrice(remaining)}</strong> para envío gratis 🚚
                </p>
              ) : (
                <p className={styles.shippingText}>
                  ¡Tenés <strong>envío gratis!</strong> 🎉
                </p>
              )}
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${shippingProgress}%` }} />
              </div>
            </div>

            {/* Items List */}
            <div className={styles.itemsList}>
              {items.map((item) => (
                <div key={`${item.id}-${item.size}-${item.color}`} className={styles.cartItem}>
                  <Link href={item.href} className={styles.itemImage} onClick={close}>
                    <img src={item.image} alt={item.name} loading="lazy" />
                  </Link>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemMeta}>{item.color} · {item.size}</span>
                    <span className={styles.itemPrice}>{formatPrice(item.price)}</span>
                    <div className={styles.qtyControls}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                        aria-label="Reducir cantidad"
                      >−</button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                        aria-label="Aumentar cantidad"
                      >+</button>
                    </div>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id, item.size, item.color)}
                    aria-label={`Eliminar ${item.name}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Footer Summary */}
            <div className={styles.footer}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span className={styles.summaryPrice}>{formatPrice(total)}</span>
              </div>
              <Link href="/checkout" className={`btn btn-primary btn-lg btn-block ${styles.checkoutBtn}`} onClick={close}>
                Iniciar Compra — {formatPrice(total)}
              </Link>
              <button className={styles.keepShoppingBtn} onClick={close}>
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
