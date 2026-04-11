import styles from './page.module.css';
import ProductCard from '@/components/ui/ProductCard';

const categories = ['Todo', 'Vestidos', 'Camisas', 'Pantalones', 'Blusas', 'Accesorios', 'Abrigos'];

/* Mock products — will come from Supabase + ISR */
const products = [
  {
    name: 'Vestido Lino Natural',
    price: 18900,
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=530&fit=crop&q=75',
    href: '/producto/vestido-lino-natural',
    badge: 'NUEVO',
    category: 'VESTIDOS',
  },
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
    badge: 'BESTSELLER',
    category: 'ABRIGOS',
  },
  {
    name: 'Vestido Midi Terracotta',
    price: 22100,
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=530&fit=crop&q=75',
    href: '/producto/vestido-midi-terracotta',
    category: 'VESTIDOS',
  },
  {
    name: 'Blusa Satinada Champagne',
    price: 16800,
    image: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=530&fit=crop&q=75',
    href: '/producto/blusa-satinada-champagne',
    badge: 'NUEVO',
    category: 'BLUSAS',
  },
  {
    name: 'Falda Plisada Sage',
    price: 15200,
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=530&fit=crop&q=75',
    href: '/producto/falda-plisada-sage',
    category: 'FALDAS',
  },
  {
    name: 'Top Cruzado Arena',
    price: 11900,
    image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400&h=530&fit=crop&q=75',
    href: '/producto/top-cruzado-arena',
    category: 'BLUSAS',
  },
];

export default function TiendaPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Tienda</h1>
          <p className={styles.subtitle}>Descubrí toda la colección Glak</p>
        </div>

        {/* Category filters */}
        <div className={styles.filtersRow}>
          <div className={styles.chips}>
            {categories.map((cat, i) => (
              <button
                key={cat}
                className={`${styles.chip} ${i === 0 ? styles.chipActive : ''}`}
                id={`filter-${cat.toLowerCase()}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sort & count bar */}
        <div className={styles.sortBar}>
          <span className={styles.count}>{products.length} productos</span>
          <div className={styles.sortActions}>
            <button className={styles.sortBtn} id="filter-toggle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              Filtrar
            </button>
            <select className={styles.sortSelect} id="sort-select" aria-label="Ordenar productos">
              <option>Relevantes</option>
              <option>Menor precio</option>
              <option>Mayor precio</option>
              <option>Más nuevos</option>
            </select>
          </div>
        </div>

        {/* Product grid */}
        <div className={styles.productGrid}>
          {products.map((product) => (
            <ProductCard key={product.name} {...product} />
          ))}
        </div>

        {/* Load more */}
        <div className={styles.loadMore}>
          <button className="btn btn-secondary" id="load-more-btn">
            Cargar más
          </button>
        </div>
      </div>
    </div>
  );
}
