import Link from 'next/link';
import styles from './CategoriesBento.module.css';

const categories = [
  {
    name: 'Vestidos',
    slug: '/tienda?cat=Vestidos',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop&q=75',
    span: 'tall',
  },
  {
    name: 'Camisas',
    slug: '/tienda?cat=Camisas',
    image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&h=600&fit=crop&q=75',
    span: 'normal',
  },
  {
    name: 'Pantalones',
    slug: '/tienda?cat=Pantalones',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=600&fit=crop&q=75',
    span: 'normal',
  },
  {
    name: 'Accesorios',
    slug: '/tienda?cat=Accesorios',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&h=800&fit=crop&q=75',
    span: 'wide',
  },
];

export default function CategoriesBento() {
  return (
    <section className={`section ${styles.section}`} id="categories-section">
      <div className="container">
        <h2 className={styles.heading}>
          Explorá por <span className="font-editorial" style={{ color: 'var(--accent-primary)' }}>categoría</span>
        </h2>
        <div className={styles.grid}>
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.slug}
              className={`${styles.card} ${styles[cat.span]}`}
              id={`cat-${cat.name.toLowerCase()}`}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className={styles.image}
                loading="lazy"
                decoding="async"
              />
              <div className={styles.overlay} />
              <div className={styles.label}>
                <span className={styles.name}>{cat.name}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
