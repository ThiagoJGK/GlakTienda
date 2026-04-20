import styles from './ProductCard.module.css';

interface ProductCardProps {
  name: string;
  price: number;
  image: string;
  href: string;
  badge?: string;
  oldPrice?: number;
  category?: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ProductCard({
  name,
  price,
  image,
  href,
  badge,
  oldPrice,
  category,
}: ProductCardProps) {
  const installments = Math.round(price / 3);

  return (
    <div className={styles.cardContainer}>
      <button className={styles.favoriteBtn} aria-label="Añadir a favoritos">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      <a href={href} className={styles.card} id={`product-${name.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className={styles.imageWrapper}>
          <img
            src={image}
            alt={name}
            className={styles.image}
            loading="lazy"
            decoding="async"
          />
          {badge && (
            <span className={styles.badge}>{badge}</span>
          )}
        </div>
        <div className={styles.info}>
          {category && (
            <span className={styles.category}>{category}</span>
          )}
          <h3 className={styles.name}>{name}</h3>
          <div className={styles.priceRow}>
            <span className={`${styles.price} font-editorial`} suppressHydrationWarning>
              {formatPrice(price)}
            </span>
            {oldPrice && (
              <span className={styles.oldPrice} suppressHydrationWarning>{formatPrice(oldPrice)}</span>
            )}
          </div>
          <span className={styles.installments} suppressHydrationWarning>
            3 cuotas sin interés de {formatPrice(installments)}
          </span>
        </div>
      </a>
    </div>
  );
}
