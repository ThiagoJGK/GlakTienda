'use client';

import React, { useState } from 'react';
import styles from './Step2Sizes.module.css';
import { GLAK_STANDARD_SIZES, EnrichedSizeStock } from '@/types/sizing';
import SupplierSizeTranslatorModal from '@/components/admin/SupplierSizeTranslatorModal';

const STANDARD_SIZES = GLAK_STANDARD_SIZES;

interface SizeEntry {
  name: string;
  stock: number;
  supplierSizeLabel?: string;
  supplierName?: string;
  numericSize?: string;
  measurementsFlatCm?: any;
  bodyContourRangeCm?: any;
}

interface Props {
  sizes: SizeEntry[];
  onChange: (sizes: SizeEntry[]) => void;
  categoryName?: string;
}

/**
 * Step2Sizes: Simple, thumb-friendly linear size stock selector.
 * Now enhanced with GLAK_STANDARD_SIZES (XS..3XL, U) and
 * the Supplier Size Translator Modal.
 */
export default function Step2Sizes({ sizes, onChange, categoryName }: Props) {
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);

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

  const handleApplyTranslatedSizes = (enrichedSizes: EnrichedSizeStock[], supplierName?: string) => {
    const mapped: SizeEntry[] = enrichedSizes.map(s => ({
      name: s.name,
      stock: s.stock > 0 ? s.stock : 1,
      supplierSizeLabel: s.supplierSizeLabel,
      supplierName,
      numericSize: s.numericSize,
      measurementsFlatCm: s.measurementsFlatCm,
      bodyContourRangeCm: s.bodyContourRangeCm,
    }));
    onChange(mapped);
  };

  const totalStock = sizes.reduce((acc, s) => acc + (Number(s.stock) || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.colorsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className={styles.sectionTitle}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          Stock por Talle
        </h3>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsTranslatorOpen(true)}
            style={{
              backgroundColor: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🪄</span> Traducir Talles de Proveedor
          </button>
          {totalStock > 0 && (
            <span className={styles.totalBadge}>{totalStock} u. total</span>
          )}
        </div>
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
          Define el stock de los talles disponibles para este producto o importa las medidas del proveedor con IA.
        </p>
      )}

      <SupplierSizeTranslatorModal
        isOpen={isTranslatorOpen}
        onClose={() => setIsTranslatorOpen(false)}
        onApply={handleApplyTranslatedSizes}
        initialCategory={categoryName}
      />
    </div>
  );
}
