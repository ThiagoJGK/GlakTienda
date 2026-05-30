'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'next/navigation';
import styles from './ProductOptions.module.css';

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

export default function ProductOptions({ initialProduct, siblings, children }: ProductOptionsProps) {
  const [prevInitialProduct, setPrevInitialProduct] = useState(initialProduct);
  const [activeProduct, setActiveProduct] = useState(initialProduct);

  const { images, sizes } = getNormalizedProductData(activeProduct);

  // Initialize selected values based on current active product
  const initialNormalized = getNormalizedProductData(initialProduct);
  const [selectedSize, setSelectedSize] = useState(initialNormalized.sizes[2] || initialNormalized.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(initialNormalized.colors[0]?.name || 'Natural');
  const [currentImage, setCurrentImage] = useState(0);
  const [touchStart, setTouchStart] = useState(0);

  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

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
            <h1 className={styles.productName}>{activeProduct.name}</h1>
            <span className={styles.brand}>{activeProduct.category || 'Glak Originals'}</span>
          </div>
          <span className={`${styles.price} font-editorial`}>
            ${activeProduct.price?.toLocaleString('es-AR')}
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

        {/* Lookbook Completá el look children */}
        {children}
      </div>
    </>
  );
}
