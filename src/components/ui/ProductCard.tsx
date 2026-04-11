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
          <span className={`${styles.price} font-editorial`}>
            {formatPrice(price)}
          </span>
          {oldPrice && (
            <span className={styles.oldPrice}>{formatPrice(oldPrice)}</span>
          )}
        </div>
        <span className={styles.installments}>
          3 cuotas sin interés de {formatPrice(installments)}
        </span>
      </div>
    </a>
  );
}
