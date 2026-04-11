import styles from './page.module.css';
import ProductCard from '@/components/ui/ProductCard';
import SectionTitle from '@/components/ui/SectionTitle';

const sizes = ['XS', 'S', 'M', 'L', 'XL'];
const colors = [
  { name: 'Natural', hex: '#D4C5A9' },
  { name: 'Terracotta', hex: '#C27852' },
  { name: 'Oliva', hex: '#7A8450' },
];

const images = [
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=700&h=930&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&h=930&fit=crop&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=700&h=930&fit=crop&q=80',
];

const relatedProducts = [
  {
    name: 'Camisa Orgánica Blanca',
    price: 14500,
    image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=400&h=530&fit=crop&q=75',
    href: '/producto/camisa-organica-blanca',
    category: 'CAMISAS',
  },
  {
    name: 'Pantalón Wide Leg Oliva',
    price: 21300,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=530&fit=crop&q=75',
    href: '/producto/pantalon-wide-leg-oliva',
    category: 'PANTALONES',
  },
  {
    name: 'Blazer Estructurado Beige',
    price: 28700,
    image: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&h=530&fit=crop&q=75',
    href: '/producto/blazer-estructurado-beige',
    category: 'ABRIGOS',
  },
  {
    name: 'Blusa Satinada Champagne',
    price: 16800,
    image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=530&fit=crop&q=75',
    href: '/producto/blusa-satinada-champagne',
    category: 'BLUSAS',
  },
];

export default function ProductoPage() {
  const price = 18900;
  const installment = Math.round(price / 3);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          {/* Image gallery */}
          <div className={styles.gallery}>
            <div className={styles.mainImage}>
              <img
                src={images[0]}
                alt="Vestido Lino Natural — Vista frontal"
                className={styles.image}
                fetchPriority="high"
              />
            </div>
            <div className={styles.thumbs}>
              {images.map((img, i) => (
                <button key={i} className={`${styles.thumb} ${i === 0 ? styles.thumbActive : ''}`}>
                  <img src={img} alt={`Vista ${i + 1}`} loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </div>

          {/* Product info */}
          <div className={styles.info}>
            <span className={styles.category}>VESTIDOS</span>
            <h1 className={styles.productName}>Vestido Lino Natural</h1>

            <div className={styles.priceBlock}>
              <span className={`${styles.price} font-editorial`}>
                ${price.toLocaleString('es-AR')}
              </span>
              <span className={styles.installments}>
                3 cuotas sin interés de ${installment.toLocaleString('es-AR')}
              </span>
            </div>

            {/* Color selector */}
            <div className={styles.optionGroup}>
              <span className={styles.optionLabel}>Color: <strong>Natural</strong></span>
              <div className={styles.colorSwatches}>
                {colors.map((c, i) => (
                  <button
                    key={c.name}
                    className={`${styles.swatch} ${i === 0 ? styles.swatchActive : ''}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={`Color ${c.name}`}
                    id={`color-${c.name.toLowerCase()}`}
                  />
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className={styles.optionGroup}>
              <div className={styles.sizeHeader}>
                <span className={styles.optionLabel}>Talle: <strong>M</strong></span>
                <a href="#guia-talles" className={styles.sizeGuide}>Guía de talles</a>
              </div>
              <div className={styles.sizeChips}>
                {sizes.map((s) => (
                  <button
                    key={s}
                    className={`${styles.sizeChip} ${s === 'M' ? styles.sizeChipActive : ''}`}
                    id={`size-${s.toLowerCase()}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button className={`btn btn-primary btn-lg btn-block ${styles.addToCart}`} id="add-to-cart-btn">
              Agregar al carrito
            </button>

            {/* Trust */}
            <div className={styles.trustRow}>
              <span>🚚 Envío gratis +$25.000</span>
              <span>🔄 Devolución 10 días</span>
              <span>🔒 Compra segura</span>
            </div>

            {/* Description accordion */}
            <details className={styles.accordion} open>
              <summary className={styles.accordionTitle}>Descripción</summary>
              <div className={styles.accordionContent}>
                <p>
                  Vestido de lino natural con caída fluida y silueta relajada.
                  Perfecto para la temporada de otoño. Fabricado con fibras
                  100% naturales de origen responsable.
                </p>
                <ul>
                  <li>Composición: 100% lino</li>
                  <li>Largo: midi (por debajo de la rodilla)</li>
                  <li>Escote: V pronunciado</li>
                  <li>Cierre: botones frontales</li>
                  <li>Bolsillos laterales</li>
                </ul>
              </div>
            </details>

            <details className={styles.accordion}>
              <summary className={styles.accordionTitle}>Cuidados</summary>
              <div className={styles.accordionContent}>
                <p>Lavar a mano o ciclo delicado. No usar secadora. Planchar a temperatura media.</p>
              </div>
            </details>
          </div>
        </div>

        {/* Recommendations: "Completá el look" */}
        <section className={`section ${styles.recsSection}`}>
          <SectionTitle
            title="Completá el look"
            action={{ label: 'Ver más', href: '/tienda' }}
          />
          <div className={styles.recsGrid}>
            {relatedProducts.map((p) => (
              <ProductCard key={p.name} {...p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
