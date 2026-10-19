import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './CategoriesBento.module.css';
import { getDynamicCategories } from '@/lib/content/contentStore';
import { DynamicCategoryItem } from '@/types/content';

interface CategoriesBentoProps {
  categories?: DynamicCategoryItem[];
}

export default async function CategoriesBento({ categories: propCategories }: CategoriesBentoProps = {}) {
  const dynamicCategories = propCategories && propCategories.length > 0
    ? propCategories
    : await getDynamicCategories();

  return (
    <section className={`section ${styles.section}`} id="categories-section">
      <div className="container">
        <h2 className={styles.heading}>
          Explorá por <span className="font-editorial" style={{ color: 'var(--accent-primary)' }}>categoría</span>
        </h2>
        <div className={styles.grid}>
          {dynamicCategories.map((cat, idx) => {
            const safeName = cat.name || 'item';
            const catId = `cat-${safeName.toLowerCase().replace(/\s+/g, '-')}`;
            return (
              <Link
                key={cat.name || cat.slug || idx}
                href={cat.slug}
                className={`${styles.card} ${cat.span ? styles[cat.span] : ''}`}
                id={catId}
                aria-label={`Explorar categoría ${safeName}`}
              >
                <img
                  src={cat.image}
                  alt={safeName}
                  className={styles.image}
                  loading="lazy"
                  decoding="async"
                />
                <div className={styles.overlay} />
                <div className={styles.label}>
                  <span className={styles.name}>{safeName}</span>
                  <ArrowRight className="w-4 h-4 shrink-0 transition-transform duration-200" aria-hidden="true" style={{ width: 16, height: 16 }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
