'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';

const categories = ['Todo', 'Vestidos', 'Camisas', 'Pantalones', 'Blusas', 'Accesorios', 'Abrigos'];

interface TiendaFiltersProps {
  activeCategory: string;
  currentSort: string;
  productCount: number;
}

export default function TiendaFilters({ activeCategory, currentSort, productCount }: TiendaFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateWithParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'Todo' && value !== 'relevantes') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const queryString = params.toString();
    router.push(`/tienda${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <>
      {/* Category filter chips */}
      <div className={styles.filtersRow}>
        <div className={styles.chips}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.chip} ${activeCategory === cat ? styles.chipActive : ''}`}
              onClick={() => navigateWithParams({ cat })}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sort & count bar */}
      <div className={styles.sortBar}>
        <span className={styles.count}>{productCount} productos</span>
        <div className={styles.sortActions}>
          <select
            className={styles.sortSelect}
            value={currentSort}
            onChange={(e) => navigateWithParams({ sort: e.target.value })}
            aria-label="Ordenar productos"
          >
            <option value="relevantes">Más nuevos</option>
            <option value="menor-precio">Menor precio</option>
            <option value="mayor-precio">Mayor precio</option>
          </select>
        </div>
      </div>
    </>
  );
}
