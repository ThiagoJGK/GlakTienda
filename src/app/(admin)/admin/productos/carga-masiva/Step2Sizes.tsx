'use client';

import React from 'react';
import styles from './Step2Sizes.module.css';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'U'];

interface SizeEntry {
  name: string;
  stock: number;
}

interface Props {
  sizes: SizeEntry[];
  onChange: (sizes: SizeEntry[]) => void;
}

/**
 * Step2Sizes: Simple, thumb-friendly linear size stock selector.
 * No color selection here — color is detected by AI in Phase 1.
 * Just define stock per size for each product.
 */
export default function Step2Sizes({ sizes, onChange }: Props) {
  const updateSizeStock = (sizeName: string, stock: number) => {
    const safeStock = Math.max(0, stock);
    const hasSize = sizes.some(s => s.name === sizeName);

    let newSizes: SizeEntry[];
    if (!hasSize) {
      newSizes = [...sizes, { name: sizeName, stock: safeStock }];
    } else {
      newSizes = sizes.map(s => s.name === sizeName ? { ...s, stock: safeStock } : s);
    }

    // Remove zero-stock sizes to keep the data clean
    onChange(newSizes.filter(s => s.stock > 0));
  };

  const totalStock = sizes.reduce((acc, s) => acc + (Number(s.stock) || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.colorsHeader}>
        <h3 className={styles.sectionTitle}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          Stock por Talle
        </h3>
        {totalStock > 0 && (
          <span className={styles.totalBadge}>{totalStock} u. total</span>
        )}
      </div>

      <div className={styles.matrixGridContainer}>
        {STANDARD_SIZES.map(sizeName => {
          const sizeObj = sizes.find(s => s.name === sizeName);
          const currentStock = sizeObj ? sizeObj.stock : 0;
          const isActive = currentStock > 0;

          return (
            <div
              key={sizeName}
              className={`${styles.sizeMatrixChip} ${isActive ? styles.sizeMatrixChipActive : ''}`}
              onClick={() => {
                if (currentStock === 0) {
                  updateSizeStock(sizeName, 1);
                }
              }}
            >
              <span className={`${styles.sizeLabelText} ${isActive ? styles.sizeLabelTextActive : ''}`}>
                {sizeName}
              </span>
              <input
                type="number"
                value={currentStock || ''}
                placeholder="0"
                className={`${styles.stockInputMinimal} ${isActive ? styles.stockInputMinimalActive : ''}`}
                onChange={e => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                  updateSizeStock(sizeName, isNaN(val) ? 0 : val);
                }}
                min="0"
                aria-label={`Stock talle ${sizeName}`}
              />
            </div>
          );
        })}
      </div>

      {totalStock === 0 && (
        <p className={styles.helperText}>
          Define el stock de los talles disponibles para este producto.
        </p>
      )}
    </div>
  );
}
