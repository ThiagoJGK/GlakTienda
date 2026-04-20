'use client';

import React, { useState, useEffect } from 'react';
import styles from './ColorSizesSection.module.css';
import { getColorsAction, createColorAction } from '@/app/(admin)/admin/productos/actions';

export type SizeStock = { name: string; stock: number };
export type ColorVariation = {
  colorId: string;
  name: string;
  hex: string;
  sizes: SizeStock[];
};

export type GlobalColor = { id: string; name: string; hex: string };

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'U'];

interface Props {
  variations: ColorVariation[];
  onChange: (variations: ColorVariation[]) => void;
}

export default function ColorSizesSection({ variations, onChange }: Props) {
  const [globalColors, setGlobalColors] = useState<GlobalColor[]>([]);
  const [isLoadingColors, setIsLoadingColors] = useState(true);
  
  const [isAddingColor, setIsAddingColor] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [isSavingColor, setIsSavingColor] = useState(false);

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    setIsLoadingColors(true);
    const res = await getColorsAction();
    if (res.success && res.data) {
      setGlobalColors(res.data);
    }
    setIsLoadingColors(false);
  };

  const addVariation = (color: GlobalColor) => {
    if (variations.some(v => v.colorId === color.id)) return;
    onChange([...variations, { colorId: color.id, name: color.name, hex: color.hex, sizes: [] }]);
  };

  const removeVariation = (colorId: string) => {
    onChange(variations.filter(v => v.colorId !== colorId));
  };

  const toggleSize = (colorId: string, sizeName: string) => {
    onChange(variations.map(v => {
      if (v.colorId !== colorId) return v;
      if (v.sizes.some(s => s.name === sizeName)) {
        return { ...v, sizes: v.sizes.filter(s => s.name !== sizeName) };
      }
      return { ...v, sizes: [...v.sizes, { name: sizeName, stock: 0 }] };
    }));
  };

  const updateSizeStock = (colorId: string, sizeName: string, stock: number) => {
    onChange(variations.map(v => {
      if (v.colorId !== colorId) return v;
      return {
        ...v,
        sizes: v.sizes.map(s => s.name === sizeName ? { ...s, stock } : s)
      };
    }));
  };

  const handleCreateNewColor = async () => {
    if (!newColorName.trim()) return;
    setIsSavingColor(true);
    const res = await createColorAction(newColorName.trim(), newColorHex);
    if (res.success && res.data) {
      const newColor = res.data;
      setGlobalColors(prev => [...prev, newColor]);
      addVariation(newColor);
      setIsAddingColor(false);
      setNewColorName('');
      setNewColorHex('#000000');
    } else {
      alert("Error al crear color: " + res.error);
    }
    setIsSavingColor(false);
  };

  // Convert hex to HSL/HSB roughly for a simple native color picker
  // We use standard input type="color" for now, which uses hex but satisfies custom selection

  return (
    <div className={styles.container}>
      <div className={styles.colorsHeader}>
        <h3 className={styles.sectionTitle}>Variaciones de Color</h3>
      </div>

      <div className={styles.colorSelector}>
        {isLoadingColors ? (
          <span className={styles.helperText}>Cargando colores...</span>
        ) : (
          <div className={styles.colorChipsRow}>
            {globalColors.map(c => {
               const isActive = variations.some(v => v.colorId === c.id);
               return (
                 <button
                   key={c.id}
                   type="button"
                   className={`${styles.colorChip} ${isActive ? styles.colorChipActive : ''}`}
                   onClick={() => isActive ? removeVariation(c.id) : addVariation(c)}
                   style={{ '--chip-color': c.hex || '#ccc' } as React.CSSProperties}
                   title={c.name}
                 >
                   <span className={styles.colorIndicator}></span>
                   {c.name}
                 </button>
               )
            })}
            
            <button 
              type="button" 
              className={`${styles.colorChip} ${styles.colorChipAdd}`}
              onClick={() => setIsAddingColor(true)}
            >
              + Nuevo Color
            </button>
          </div>
        )}
      </div>

      {isAddingColor && (
        <div className={styles.newColorForm}>
          <div className={styles.newColorInputs}>
            <input 
              type="color" 
              value={newColorHex} 
              onChange={e => setNewColorHex(e.target.value)} 
              className={styles.colorPickerRaw}
              title="Seleccionar color (Hex/HSB)"
            />
            <input 
              type="text" 
              placeholder="Nombre del color (Ej: Ocre)" 
              value={newColorName} 
              onChange={e => setNewColorName(e.target.value)}
              className={styles.input}
              autoFocus
            />
          </div>
          <div className={styles.newColorActions}>
            <button 
              type="button" 
              onClick={handleCreateNewColor} 
              className="btn btn-primary"
              disabled={isSavingColor || !newColorName.trim()}
            >
              {isSavingColor ? 'Guardando...' : 'Guardar y Seleccionar'}
            </button>
            <button 
              type="button" 
              onClick={() => setIsAddingColor(false)} 
              className="btn-ghost"
              disabled={isSavingColor}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {variations.length === 0 && (
        <div className={styles.helperText} style={{ marginTop: '1rem' }}>
          Selecciona al menos un color para configurar stock y talles.
        </div>
      )}

      <div className={styles.variationsList}>
        {variations.map(v => {
          const totalStock = v.sizes.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
          
          return (
            <div key={v.colorId} className={styles.variationCard}>
              <div className={styles.variationHeader}>
                 <div className={styles.variationTitle}>
                    <span className={styles.colorIndicatorLarge} style={{ backgroundColor: v.hex }}></span>
                    <strong>{v.name}</strong>
                 </div>
                 <button type="button" onClick={() => removeVariation(v.colorId)} className={styles.btnRemove}>✕ Quitar</button>
              </div>

              <div className={styles.sizesGridContainer}>
                <span className={styles.subText}>Talles para {v.name}:</span>
                <div className={styles.sizesGrid}>
                  {STANDARD_SIZES.map(s => {
                    const isActive = v.sizes.some(x => x.name === s);
                    return (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.sizeChip} ${isActive ? styles.sizeChipActive : ''}`}
                        onClick={() => toggleSize(v.colorId, s)}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {v.sizes.length > 0 && (
                <div className={styles.stockBreakdownBlock}>
                  {v.sizes.map((s) => (
                    <div key={s.name} className={styles.stockRow}>
                      <span className={styles.stockSizeLabel}>Talle {s.name}</span>
                      <input 
                        type="number" 
                        placeholder="Stock..."
                        className={styles.input}
                        style={{ width: '100px' }}
                        value={s.stock || ''}
                        onChange={(e) => updateSizeStock(v.colorId, s.name, parseInt(e.target.value) || 0)}
                        min="0"
                        required
                      />
                    </div>
                  ))}
                  <div className={styles.totalColorStock}>
                    <span>Stock {v.name}: {totalStock} u.</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
