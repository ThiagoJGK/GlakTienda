'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import styles from './page.module.css';

const categories = ['Todo', 'Vestidos', 'Camisas', 'Pantalones', 'Blusas', 'Accesorios', 'Abrigos'];

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface PivotRow {
  product_id: string;
  collection_id: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string | null;
  description: string | null;
  images?: string[];
  sizes?: any;
  colors?: any;
  created_at: string;
}

interface TiendaCatalogProps {
  initialProducts: Product[];
  collections: Collection[];
  pivotList: PivotRow[];
  initialFilters: {
    q?: string;
    cat?: string;
    collection?: string;
    sort?: string;
    colors?: string[];
    sizes?: string[];
    minPrice?: number;
    maxPrice?: number;
  };
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";

function getProductImage(product: { images?: string[]; name: string }) {
  if (product.images && product.images.length > 0) {
    const img = product.images[0];
    if (img.startsWith('http')) return img;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_400,h_530,q_75/${img}`;
  }
  return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=530&fit=crop&q=75';
}

function getNormalizedProduct(product: Product) {
  // Normalize sizes
  let sizes: string[] = [];
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    const firstItem = product.sizes[0];
    if (typeof firstItem === 'object' && firstItem !== null && 'sizes' in firstItem) {
      const allSizeNames = new Set<string>();
      product.sizes.forEach((variation: any) => {
        if (Array.isArray(variation.sizes)) {
          variation.sizes.forEach((s: any) => {
            if (s.name) allSizeNames.add(s.name);
          });
        }
      });
      sizes = Array.from(allSizeNames);
    } else {
      sizes = product.sizes.map((s: any) => {
        if (typeof s === 'object' && s !== null && 'name' in s) return s.name;
        return typeof s === 'string' ? s : null;
      }).filter((s: any): s is string => s !== null);
    }
  }

  // Normalize colors
  let colors: { name: string; hex: string }[] = [];
  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    const firstItem = product.sizes[0];
    if (typeof firstItem === 'object' && firstItem !== null && 'sizes' in firstItem) {
      colors = product.sizes.map((v: any) => ({
        name: v.name || 'Color',
        hex: v.hex || '#cccccc'
      }));
    } else if (product.colors && product.colors.length > 0) {
      colors = product.colors;
    }
  } else if (product.colors && product.colors.length > 0) {
    colors = product.colors;
  }

  return { sizes, colors };
}

export default function TiendaCatalog({
  initialProducts,
  collections,
  pivotList,
  initialFilters
}: TiendaCatalogProps) {
  const router = useRouter();
  
  // 1. Search Query state (requires hitting server to trigger pgvector search)
  const [searchValue, setSearchValue] = useState(initialFilters.q || '');

  // Sync state if search query prop changes from server
  useEffect(() => {
    setSearchValue(initialFilters.q || '');
  }, [initialFilters.q]);

  // 2. Compute dynamic facets available inside initialProducts using useMemo
  const availableSwatches = useMemo(() => {
    const swatchMap = new Map<string, { name: string; hex: string }>();
    initialProducts.forEach((p) => {
      const { colors } = getNormalizedProduct(p);
      colors.forEach((c) => {
        if (c.hex && c.name) {
          swatchMap.set(c.hex.toLowerCase(), { name: c.name, hex: c.hex });
        }
      });
    });
    return Array.from(swatchMap.values());
  }, [initialProducts]);

  const availableSizes = useMemo(() => {
    const sizesSet = new Set<string>();
    initialProducts.forEach((p) => {
      const { sizes } = getNormalizedProduct(p);
      sizes.forEach((s) => {
        if (s) sizesSet.add(s);
      });
    });
    const standardOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'U'];
    return Array.from(sizesSet).sort((a, b) => {
      const idxA = standardOrder.indexOf(a);
      const idxB = standardOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [initialProducts]);

  const { minPriceLimit, maxPriceLimit } = useMemo(() => {
    if (initialProducts.length === 0) {
      return { minPriceLimit: 0, maxPriceLimit: 100000 };
    }
    let min = Infinity;
    let max = -Infinity;
    initialProducts.forEach((p) => {
      const price = Number(p.price) || 0;
      if (price < min) min = price;
      if (price > max) max = price;
    });
    return {
      minPriceLimit: min === Infinity ? 0 : min,
      maxPriceLimit: max === -Infinity ? 100000 : max
    };
  }, [initialProducts]);

  // 3. Client Filter States
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.cat || 'Todo');
  const [selectedCollection, setSelectedCollection] = useState(initialFilters.collection || '');
  const [selectedColors, setSelectedColors] = useState<string[]>(initialFilters.colors || []);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialFilters.sizes || []);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    initialFilters.minPrice !== undefined ? initialFilters.minPrice : minPriceLimit,
    initialFilters.maxPrice !== undefined ? initialFilters.maxPrice : maxPriceLimit
  ]);
  const [sortBy, setSortBy] = useState(initialFilters.sort || 'relevantes');

  // Synchronize dynamic price range when search queries bring new sets of prices
  useEffect(() => {
    setPriceRange([
      initialFilters.minPrice !== undefined ? initialFilters.minPrice : minPriceLimit,
      initialFilters.maxPrice !== undefined ? initialFilters.maxPrice : maxPriceLimit
    ]);
  }, [minPriceLimit, maxPriceLimit, initialFilters.minPrice, initialFilters.maxPrice]);

  // 4. Silently synchronize filter selections to URL using pushState
  useEffect(() => {
    const params = new URLSearchParams();
    if (initialFilters.q) params.set('q', initialFilters.q);
    if (selectedCategory && selectedCategory !== 'Todo') params.set('cat', selectedCategory);
    if (selectedCollection) params.set('collection', selectedCollection);
    if (selectedColors.length > 0) params.set('colors', selectedColors.join(','));
    if (selectedSizes.length > 0) params.set('sizes', selectedSizes.join(','));
    
    // Only set price query params if they differ from boundaries
    if (priceRange[0] > minPriceLimit) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < maxPriceLimit) params.set('maxPrice', priceRange[1].toString());
    
    if (sortBy && sortBy !== 'relevantes') params.set('sort', sortBy);

    const queryString = params.toString();
    const newUrl = `/tienda${queryString ? `?${queryString}` : ''}`;
    
    // Silently push state without triggering page reload
    window.history.pushState(null, '', newUrl);
  }, [
    selectedCategory,
    selectedCollection,
    selectedColors,
    selectedSizes,
    priceRange,
    sortBy,
    initialFilters.q,
    minPriceLimit,
    maxPriceLimit
  ]);

  // 5. Client-Side Filter and Sort Computation
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Filter by Category
    if (selectedCategory && selectedCategory !== 'Todo') {
      result = result.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by Collection (via pivot List)
    if (selectedCollection) {
      const activeColl = collections.find((c) => c.slug === selectedCollection);
      if (activeColl) {
        result = result.filter((p) =>
          pivotList.some((row) => row.product_id === p.id && row.collection_id === activeColl.id)
        );
      }
    }

    // Filter by Selected Colors (at least one color matches)
    if (selectedColors.length > 0) {
      result = result.filter((p) => {
        const { colors } = getNormalizedProduct(p);
        return colors.some((c) => selectedColors.includes(c.hex.toLowerCase()));
      });
    }

    // Filter by Selected Sizes (at least one size matches)
    if (selectedSizes.length > 0) {
      result = result.filter((p) => {
        const { sizes } = getNormalizedProduct(p);
        return sizes.some((s) => selectedSizes.includes(s));
      });
    }

    // Filter by Price Range
    result = result.filter((p) => {
      const price = Number(p.price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sorting
    if (sortBy === 'menor-precio') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'mayor-precio') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // 'relevantes' or default -> created_at descending
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [
    initialProducts,
    selectedCategory,
    selectedCollection,
    selectedColors,
    selectedSizes,
    priceRange,
    sortBy,
    collections,
    pivotList
  ]);

  // Handle hitting Enter in Search Bar (fires full server search to use pgvector)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set('q', trimmed);
    
    // Carry over category & collection if needed
    if (selectedCategory && selectedCategory !== 'Todo') params.set('cat', selectedCategory);
    if (selectedCollection) params.set('collection', selectedCollection);
    if (sortBy && sortBy !== 'relevantes') params.set('sort', sortBy);
    
    router.push(`/tienda?${params.toString()}`);
  };

  const handleToggleColor = (hex: string) => {
    const lowerHex = hex.toLowerCase();
    setSelectedColors((prev) =>
      prev.includes(lowerHex) ? prev.filter((c) => c !== lowerHex) : [...prev, lowerHex]
    );
  };

  const handleToggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategory('Todo');
    setSelectedCollection('');
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([minPriceLimit, maxPriceLimit]);
    setSortBy('relevantes');
    setSearchValue('');
    router.push('/tienda');
  };

  const hasActiveFilters =
    selectedCategory !== 'Todo' ||
    selectedCollection !== '' ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    priceRange[0] !== minPriceLimit ||
    priceRange[1] !== maxPriceLimit ||
    searchValue !== '';

  return (
    <div className={styles.layout}>
      {/* Dynamic Interactive Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.filtersContainer}>
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className={styles.searchContainer} role="search">
            <svg
              className={styles.searchIcon}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="search"
              placeholder="Buscar productos (Enter)..."
              className={styles.searchInput}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </form>

          {/* Collections Filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Colecciones</h3>
            <div className={styles.collectionsScroll} aria-label="Colecciones">
              <button
                type="button"
                className={`${styles.collectionCard} ${
                  selectedCollection === '' ? styles.filterItemActive : ''
                }`}
                onClick={() => setSelectedCollection('')}
              >
                Todas
              </button>
              {collections.map((coll) => (
                <button
                  key={coll.id}
                  type="button"
                  className={`${styles.collectionCard} ${
                    selectedCollection === coll.slug ? styles.filterItemActive : ''
                  }`}
                  onClick={() => setSelectedCollection(coll.slug)}
                >
                  {coll.name}
                </button>
              ))}
            </div>
          </div>

          {/* Categories / Prenda Types */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterSectionTitle}>Tipos de Prenda</h3>
            <div className={styles.categoriesScroll} aria-label="Categorías">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.categoryChip} ${
                    selectedCategory === cat ? styles.filterItemActive : ''
                  }`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Color Swatches Facet */}
          {availableSwatches.length > 0 && (
            <div className={styles.filterSection}>
              <h3 className={styles.filterSectionTitle}>Colores</h3>
              <div className={styles.swatchesGrid}>
                {availableSwatches.map((swatch) => {
                  const isChecked = selectedColors.includes(swatch.hex.toLowerCase());
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      className={`${styles.swatchFilter} ${
                        isChecked ? styles.swatchFilterActive : ''
                      }`}
                      style={{ '--swatch-color': swatch.hex } as React.CSSProperties}
                      title={swatch.name}
                      onClick={() => handleToggleColor(swatch.hex)}
                      aria-label={`Filtrar por color ${swatch.name}`}
                    >
                      {isChecked && (
                        <svg
                          className={styles.swatchCheck}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Sizes Facet */}
          {availableSizes.length > 0 && (
            <div className={styles.filterSection}>
              <h3 className={styles.filterSectionTitle}>Talles</h3>
              <div className={styles.sizesGrid}>
                {availableSizes.map((size) => {
                  const isChecked = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`${styles.sizeFilter} ${isChecked ? styles.sizeFilterActive : ''}`}
                      onClick={() => handleToggleSize(size)}
                      aria-label={`Filtrar por talle ${size}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Price Range Facet */}
          {maxPriceLimit > minPriceLimit && (
            <div className={styles.filterSection}>
              <h3 className={styles.filterSectionTitle}>Rango de Precio</h3>
              <div className={styles.priceRangeInputs}>
                <input
                  type="range"
                  min={minPriceLimit}
                  max={maxPriceLimit}
                  step={500}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || priceRange[0]])}
                  className={styles.priceSlider}
                  aria-label="Precio máximo"
                />
                <div className={styles.priceRangeFields}>
                  <div className={styles.priceInputWrapper}>
                    <span className={styles.priceCurrency}>$</span>
                    <input
                      type="number"
                      className={styles.priceInput}
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      min={minPriceLimit}
                      max={priceRange[1]}
                      aria-label="Precio mínimo"
                    />
                  </div>
                  <span className={styles.priceSeparator}>a</span>
                  <div className={styles.priceInputWrapper}>
                    <span className={styles.priceCurrency}>$</span>
                    <input
                      type="number"
                      className={styles.priceInput}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || priceRange[0]])}
                      min={priceRange[0]}
                      max={maxPriceLimit}
                      aria-label="Precio máximo"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className={`btn-ghost ${styles.clearBtn}`}
              style={{ marginTop: '1.5rem' }}
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Sort Bar */}
        <div className={styles.sortBar}>
          <span className={styles.count}>{filteredProducts.length} productos</span>
          <div className={styles.sortActions}>
            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Ordenar productos"
            >
              <option value="relevantes">Más nuevos</option>
              <option value="menor-precio">Menor precio</option>
              <option value="mayor-precio">Mayor precio</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No encontramos productos con esos filtros.</p>
            <span>Probá ampliando el rango de precio, cambiando de talle o color.</span>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                price={product.price}
                image={getProductImage(product)}
                href={`/producto/${product.slug}`}
                category={product.category?.toUpperCase()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
