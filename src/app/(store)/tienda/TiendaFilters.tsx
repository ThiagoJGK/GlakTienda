'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './page.module.css';

const categories = ['Todo', 'Vestidos', 'Camisas', 'Pantalones', 'Blusas', 'Accesorios', 'Abrigos'];

interface TiendaFiltersProps {
  activeCategory: string;
  activeCollection: string;
  searchQuery?: string;
  currentSort: string;
  productCount: number;
  collections: {id: string, name: string, slug: string}[];
}

export default function TiendaFilters({ activeCategory, activeCollection, searchQuery = '', currentSort, productCount, collections }: TiendaFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchQuery);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

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

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigateWithParams({ q: searchValue });
    }
  };

  const hasActiveFilters = activeCategory !== 'Todo' || activeCollection !== '' || searchQuery !== '';

  return (
    <div className={styles.filtersContainer}>
      
      {/* 0. Búsqueda */}
      <div className={styles.searchContainer}>
        <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="search" 
          placeholder="Buscar productos..."
          className={styles.searchInput}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </div>

      {/* 1. Colecciones */}
      <h3 className="sr-only">Colecciones</h3>
      <div className={styles.collectionsScroll} aria-label="Colecciones">
        <button
          className={`${styles.collectionCard} ${activeCollection === '' ? styles.filterItemActive : ''}`}
          onClick={() => navigateWithParams({ collection: '' })}
        >
          Todas
        </button>
        {collections.map((coll) => (
          <button
            key={coll.id}
            className={`${styles.collectionCard} ${activeCollection === coll.slug ? styles.filterItemActive : ''}`}
            onClick={() => navigateWithParams({ collection: coll.slug })}
          >
            {coll.name}
          </button>
        ))}
      </div>

      {/* 2. Tipos de Prenda */}
      <h3 className="sr-only">Tipos de Prenda</h3>
      <div className={styles.categoriesScroll} aria-label="Categorías">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.categoryChip} ${activeCategory === cat ? styles.filterItemActive : ''}`}
            onClick={() => navigateWithParams({ cat })}
          >
            {cat}
          </button>
        ))}
      </div>

      {hasActiveFilters && (
        <button 
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('cat');
            params.delete('collection');
            params.delete('q');
            setSearchValue('');
            const queryString = params.toString();
            router.push(`/tienda${queryString ? `?${queryString}` : ''}`);
          }}
          className={`btn-ghost ${styles.clearBtn}`} 
        >
          Limpiar Filtros
        </button>
      )}
    </div>
  );
}
