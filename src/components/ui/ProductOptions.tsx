'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'next/navigation';
import styles from './ProductOptions.module.css';

interface ProductOptionsProps {
  product: {
    id: string;
    name: string;
    price: number;
    slug: string;
  };
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  children?: React.ReactNode;
}

export default function ProductOptions({ product, images, sizes, colors, children }: ProductOptionsProps) {
  const [selectedSize, setSelectedSize] = useState(sizes[2] || sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(colors[0]?.name || 'Natural');
  const [currentImage, setCurrentImage] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[currentImage],
      href: `/producto/${product.slug}`,
      size: selectedSize,
      color: selectedColor,
    });
  };

  const handleBuyNow = () => {
    handleAdd();
    // Will redirect to checkout when it exists
    router.push('/checkout');
  };

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextImage();
      else prevImage();
    }
  };

  return (
    <>
      {/* Image Gallery */}
      <div className={styles.gallery}>
        <div
          className={styles.mainImageWrapper}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className={styles.favoriteBtn} aria-label="Añadir a favoritos">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          <img
            src={images[currentImage]}
            alt={product.name}
            className={styles.mainImage}
            fetchPriority={currentImage === 0 ? "high" : undefined}
          />

          {/* Navigation arrows (desktop) */}
          {images.length > 1 && (
            <>
              <button className={`${styles.navArrow} ${styles.navLeft}`} onClick={prevImage} aria-label="Imagen anterior">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button className={`${styles.navArrow} ${styles.navRight}`} onClick={nextImage} aria-label="Siguiente imagen">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}

          {/* Pagination dots */}
          {images.length > 1 && (
            <div className={styles.paginationDots}>
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === currentImage ? styles.dotActive : ''}`}
                  onClick={() => setCurrentImage(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Column containing all options and children */}
      <div className={styles.infoColumn}>
        {/* Render children (like Title and Price) first, so they stay on top */}
        {children}

        {/* Color selector */}
        <div className={styles.optionGroup}>
          <span className={styles.optionLabel}>Color: <strong>{selectedColor}</strong></span>
          <div className={styles.colorSwatches}>
            {colors.map((c) => (
              <button
                key={c.name}
                className={`${styles.swatch} ${selectedColor === c.name ? styles.swatchActive : ''}`}
                style={{ backgroundColor: c.hex }}
                aria-label={`Color ${c.name}`}
                onClick={() => setSelectedColor(c.name)}
              />
            ))}
          </div>
        </div>

        {/* Size selector */}
        <div className={styles.optionGroup}>
          <div className={styles.sizeHeader}>
            <span className={styles.optionLabel}>Talle seleccionado: <strong>{selectedSize}</strong></span>
          </div>
          <div className={styles.sizeChips}>
            {sizes.map((s) => (
              <button
                key={s}
                className={`${styles.sizeChip} ${selectedSize === s ? styles.sizeChipActive : ''}`}
                onClick={() => setSelectedSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Dual CTA */}
        <div className={styles.ctaRow}>
          <button className={`btn btn-secondary ${styles.btnCart}`} onClick={handleAdd}>
            Agregar al Carrito
          </button>
          <button className={`btn btn-primary ${styles.btnBuy}`} onClick={handleBuyNow}>
            Comprar Ahora
          </button>
        </div>

        {/* Feature Accordions for visual balance */}
        <div className={styles.accordions}>
          <details className={styles.accordion}>
            <summary className={styles.accordionTitle}>
              <span>Envíos y devoluciones</span>
              <svg className={styles.accordionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </summary>
            <div className={styles.accordionContent}>
              <p>Envío gratis en compras superiores a $25.000. Tienes hasta 10 días desde que recibes el producto para solicitar un cambio o devolución de forma gratuita y sin complicaciones.</p>
            </div>
          </details>

          <details className={styles.accordion}>
            <summary className={styles.accordionTitle}>
              <span>Cuidados de la prenda</span>
              <svg className={styles.accordionIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </summary>
            <div className={styles.accordionContent}>
              <p>Lavar a mano o a máquina en ciclo delicado con agua fría. Secar a la sombra apoyado. No utilizar blanqueador ni calor excesivo para planchar.</p>
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
