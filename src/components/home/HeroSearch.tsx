'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Hero.module.css';

export default function HeroSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/tienda?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form className={styles.searchBar} onSubmit={handleSearch} role="search">
      <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder="¿Qué estás buscando hoy?"
        className={styles.searchInput}
        aria-label="Buscar productos"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}
