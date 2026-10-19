'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'next/navigation';
import { formatCurrencySafe } from '@/lib/utils';
import styles from './ProductOptions.module.css';
import SizeGuideModal from '@/components/store/SizeGuideModal';
import { EnrichedSizeStock } from '@/types/sizing';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";

function resolveImageUrl(img: string) {
  if (img.startsWith('http')) return img;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_800,h_1200,q_80/${img}`;
}

const defaultSizes = ['XS', 'S', 'M', 'L', 'XL'];
const defaultColors = [
  { name: 'Natural', hex: '#D4C5A9' },
  { name: 'Terracotta', hex: '#C27852' },
  { name: 'Oliva', hex: '#7A8450' },
];

interface SizeStock {
  name: string;
  stock: number;
  supplierSizeLabel?: string;
  supplierName?: string;
  numericSize?: string;
  measurementsFlatCm?: any;
  bodyContourRangeCm?: any;
}

interface ColorVariation {
  colorId?: string;
  name: string;
  hex: string;
  sizes: SizeStock[];
}

interface ProductType {
  id: string;
  name: string;
  slug: string;
  price: number;
  description?: string | null;
  images?: string[];
  sizes?: string[] | ColorVariation[];
  colors?: { name: string; hex: string }[];
  category?: string | null;
}

interface ProductOptionsProps {
  initialProduct: ProductType;
  siblings: ProductType[];
  children?: React.ReactNode;
}

function getNormalizedProductData(product: ProductType) {
  // Resolve images
  const images = product.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((img: string) => resolveImageUrl(img))
    : ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1200&fit=crop&q=80'];

  // Normalization logic for sizes
  let sizes = defaultSizes;
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    const firstItem = product.sizes[0];
    if (typeof firstItem === 'object' && firstItem !== null && 'sizes' in firstItem) {
      const allSizeNames = new Set<string>();
      (product.sizes as ColorVariation[]).forEach((variation) => {
        if (Array.isArray(variation.sizes)) {
          variation.sizes.forEach((s) => {
            if (s.name) allSizeNames.add(s.name);
          });
        }
      });
      const uniqueSizes = Array.from(allSizeNames);
      if (uniqueSizes.length > 0) sizes = uniqueSizes;
    } else {
      sizes = (product.sizes as (string | { name: string })[]).map((s) => {
        if (typeof s === 'object' && s !== null && 'name' in s) return s.name;
        return typeof s === 'string' ? s : null;
      }).filter((s): s is string => s !== null);
      if (sizes.length === 0) sizes = defaultSizes;
    }
  }

  // Normalization logic for colors
  let colors = defaultColors;
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    const firstItem = product.sizes[0];
    if (typeof firstItem === 'object' && firstItem !== null && 'sizes' in firstItem) {
      colors = (product.sizes as ColorVariation[]).map((v) => ({
        name: v.name || 'Color',
        hex: v.hex || '#cccccc'
      }));
    } else if (product.colors && product.colors.length > 0) {
      colors = product.colors;
    }
  } else if (product.colors && product.colors.length > 0) {
    colors = product.colors;
  }

  return { images, sizes, colors };
}

function getActiveSizesWithStock(product: ProductType, selectedColorName?: string): EnrichedSizeStock[] {
  if (!product.sizes || !Array.isArray(product.sizes) || product.sizes.length === 0) {
    return defaultSizes.map(s => ({ name: s, stock: 10 }));
  }

  const firstItem = product.sizes[0];
  if (typeof firstItem === 'object' && firstItem !== null && 'sizes' in firstItem) {
    const variations = product.sizes as ColorVariation[];
    const matchingVariation = variations.find(
      v => v.name?.trim().toLowerCase() === selectedColorName?.trim().toLowerCase()
    ) || variations[0];
    if (matchingVariation && Array.isArray(matchingVariation.sizes)) {
      return matchingVariation.sizes as EnrichedSizeStock[];
    }
  }

  return (product.sizes as any[]).map(s => {
    if (typeof s === 'object' && s !== null && 'name' in s) {
      return s as EnrichedSizeStock;
    }
    return { name: String(s), stock: 10 };
  });
}

export default function ProductOptions({ initialProduct, siblings, children }: ProductOptionsProps) {
  const [prevInitialProduct, setPrevInitialProduct] = useState(initialProduct);
  const [activeProduct, setActiveProduct] = useState(initialProduct);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const { images, sizes } = getNormalizedProductData(activeProduct);

  // Initialize selected values based on current active product
  const initialNormalized = getNormalizedProductData(initialProduct);
  const [selectedSize, setSelectedSize] = useState(initialNormalized.sizes[2] || initialNormalized.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(initialNormalized.colors[0]?.name || 'Natural');
  const [currentImage, setCurrentImage] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const activeSizesWithStock = getActiveSizesWithStock(activeProduct, selectedColor);
  const activeEnrichedSize = activeSizesWithStock.find(s => s.name === selectedSize);

  // Sync state in render path if initialProduct changes from parent (e.g. page navigation)
  if (initialProduct !== prevInitialProduct) {
    setPrevInitialProduct(initialProduct);
    setActiveProduct(initialProduct);
    const normalized = getNormalizedProductData(initialProduct);
    setSelectedColor(normalized.colors[0]?.name || 'Natural');
    setSelectedSize(normalized.sizes[2] || normalized.sizes[0] || 'M');
    setCurrentImage(0);
  }

  const handleSwatchClick = (sibling: ProductType) => {
    setActiveProduct(sibling);
    const normalized = getNormalizedProductData(sibling);
    setSelectedColor(normalized.colors[0]?.name || 'Natural');
    setSelectedSize(normalized.sizes[2] || normalized.sizes[0] || 'M');
    setCurrentImage(0);
    window.history.pushState(null, '', `/producto/${sibling.slug}`);
  };

  const handleAdd = () => {
    if (activeEnrichedSize?.stock === 0) {
      alert(`El talle ${selectedSize} se encuentra agotado temporalmente.`);
      return;
    }
    addItem({
      id: activeProduct.id,
      name: activeProduct.name,
      price: activeProduct.price,
      image: images[currentImage],
      href: `/producto/${activeProduct.slug}`,
      size: selectedSize,
      color: selectedColor,
    });
  };

  const handleBuyNow = () => {
    handleAdd();
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
            alt={activeProduct.name}
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
        {/* Render active product header Row dynamically inside to be responsive */}
        <div className={styles.headerRow}>
          <div>
            <h1 className={`${styles.productName} font-editorial`}>{activeProduct.name}</h1>
            <span className={styles.brand}>{activeProduct.category || 'Glak Originals'}</span>
          </div>
          <span className={`${styles.price} font-editorial`}>
            {formatCurrencySafe(activeProduct.price)}
          </span>
        </div>

        {/* Description */}
        {activeProduct.description && (
          <div className={styles.description}>
            <p>{activeProduct.description}</p>
          </div>
        )}

        {/* Sibling Color selector */}
        <div className={styles.optionGroup}>
          <span className={styles.optionLabel}>Color: <strong>{selectedColor}</strong></span>
          <div className={styles.colorSwatches}>
            {siblings.map((sibling) => {
              const siblingNormalized = getNormalizedProductData(sibling);
              const siblingColor = siblingNormalized.colors[0] || { name: 'Color', hex: '#cccccc' };
              const isActive = activeProduct.id === sibling.id;
              
              return (
                <button
                  key={sibling.id}
                  className={`${styles.swatch} ${isActive ? styles.swatchActive : ''}`}
                  style={{ backgroundColor: siblingColor.hex }}
                  aria-label={`Color ${siblingColor.name}`}
                  title={siblingColor.name}
                  onClick={() => handleSwatchClick(sibling)}
                />
              );
            })}
          </div>
        </div>

        {/* Size selector */}
        <div className={styles.optionGroup}>
          <div className={styles.sizeHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={styles.optionLabel}>
              Talle: <strong>{selectedSize}</strong>
              {activeEnrichedSize?.stock === 0 ? (
                <span style={{ color: '#ef4444', marginLeft: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                  (Agotado)
                </span>
              ) : activeEnrichedSize && activeEnrichedSize.stock <= 3 && activeEnrichedSize.stock > 0 ? (
                <span style={{ color: '#f59e0b', marginLeft: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                  (¡Últimas {activeEnrichedSize.stock} unidades!)
                </span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#15803d',
                fontSize: '0.825rem',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 0',
              }}
            >
              <span>📏</span> Guía y medidas
            </button>
          </div>
          <div className={styles.sizeChips}>
            {sizes.map((s) => {
              const sizeStockInfo = activeSizesWithStock.find((item) => item.name === s);
              const isOutOfStock = sizeStockInfo ? sizeStockInfo.stock === 0 : false;
              const isSelected = selectedSize === s;

              return (
                <button
                  key={s}
                  type="button"
                  disabled={isOutOfStock}
                  title={isOutOfStock ? `${s} (Agotado)` : `Talle ${s}`}
                  className={`${styles.sizeChip} ${isSelected ? styles.sizeChipActive : ''}`}
                  style={{
                    position: 'relative',
                    opacity: isOutOfStock ? 0.35 : 1,
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    textDecoration: isOutOfStock ? 'line-through' : 'none',
                    backgroundColor: isOutOfStock ? '#f1f5f9' : undefined,
                    color: isOutOfStock ? '#94a3b8' : undefined,
                    borderColor: isOutOfStock ? '#cbd5e1' : undefined,
                  }}
                  onClick={() => {
                    if (!isOutOfStock) {
                      setSelectedSize(s);
                    }
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Transparent Supplier Size Notice */}
          {activeEnrichedSize?.supplierSizeLabel && activeEnrichedSize.supplierSizeLabel !== selectedSize && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#166534',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '1rem', marginTop: '-1px' }}>🏷️</span>
              <div>
                <strong>Talle GLak AR: {selectedSize}</strong> {activeEnrichedSize.numericSize && `(AR ${activeEnrichedSize.numericSize})`}
                <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: '2px' }}>
                  La etiqueta cosida en la prenda física dice <strong>&apos;{activeEnrichedSize.supplierSizeLabel}&apos;</strong>{activeEnrichedSize.supplierName ? ` (${activeEnrichedSize.supplierName})` : ''}, calibrada a las medidas reales IRAM 75300.
                </div>
              </div>
            </div>
          )}
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

        {/* Lookbook Completá el look children */}
        {children}
      </div>

      <SizeGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        garmentCategory={activeProduct.category || undefined}
        sizes={activeSizesWithStock}
        selectedSize={selectedSize}
        onSelectSize={(newSize) => setSelectedSize(newSize)}
      />
    </>
  );
}
