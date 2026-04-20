import React from 'react';
import styles from './page.module.css';
import { UploadingProduct } from './types';
import ColorSizesSection, { ColorVariation } from '@/components/admin/ColorSizesSection';

interface Props {
  products: UploadingProduct[];
  updateProductField: (id: string, field: keyof UploadingProduct, value: any) => void;
  onProceed: () => void;
  onRemoveProduct: (id: string) => void;
  allCollections: {id: string, name: string}[];
}

export default function Phase2Concurrent({ products, updateProductField, onProceed, onRemoveProduct, allCollections }: Props) {
  
  const aiGeneratingCount = products.filter(p => p.aiStatus === 'generating').length;
  const isAiDone = aiGeneratingCount === 0 && products.every(p => p.aiStatus === 'done' || p.aiStatus === 'error');

  return (
    <div className={styles.phase2Container}>
      <div className={styles.globalStatusBarFixed}>
        <div className={styles.statusBarContent}>
          {aiGeneratingCount > 0 ? (
             <>
               <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <line x1="12" y1="2" x2="12" y2="6"/>
                 <line x1="12" y1="18" x2="12" y2="22"/>
                 <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
                 <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                 <line x1="2" y1="12" x2="6" y2="12"/>
                 <line x1="18" y1="12" x2="22" y2="12"/>
                 <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
                 <line x1="16.24" y1="4.93" x2="19.07" y2="7.76"/>
               </svg>
               Procesando IA: Faltan {aiGeneratingCount} de {products.length}...
             </>
          ) : (
             <>
               <span style={{ color: 'var(--color-success)' }}>●</span> IA Completada para todos los productos.
             </>
          )}
        </div>
        <button 
          className="btn btn-primary"
          onClick={onProceed}
          disabled={!isAiDone}
        >
          Siguiente: Revisar Lote
        </button>
      </div>

      <div className={styles.productsGridMobileFirst}>
        {products.map((p, index) => (
          <div key={p.id} className={styles.mobileCard}>
             
             <div className={styles.mobileCardHeader}>
                <div className={styles.productIndex}>Producto #{index + 1}</div>
                <div className={styles.statusIndicators}>
                  {p.aiStatus === 'generating' && <span className={`${styles.badge} ${styles.badgeGenerating}`}>IA Analizando...</span>}
                  {p.aiStatus === 'done' && <span className={`${styles.badge} ${styles.badgeDone}`}>IA Lista</span>}
                  {p.aiStatus === 'error' && <span className={`${styles.badge} ${styles.badgeError}`} style={{backgroundColor: '#ffebeb', color: '#e53e3e'}}>Error IA/Red</span>}
                  <button type="button" onClick={() => onRemoveProduct(p.id)} className={styles.btnRemoveProductF1} style={{marginLeft: 'auto'}}>X Quitar</button>
                </div>
             </div>

             <div className={styles.miniGalleryScroll}>
               {p.imageUrls.map((url, i) => (
                 <img key={i} src={url} alt="Prod preview" className={styles.miniGalleryImg} />
               ))}
               {p.uploadStatus === 'uploading' && <div className={styles.miniGalleryImg}>Subiendo...</div>}
             </div>

             <div className={styles.mobileCardBody}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Precio (ARS)</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    placeholder="Ej: 45000"
                    value={p.price}
                    onChange={e => updateProductField(p.id, 'price', e.target.value)}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Colección</label>
                  <select 
                    className={styles.input}
                    value={p.collections[0]?.id || ""}
                    onChange={e => {
                       const selected = allCollections.find(c => c.id === e.target.value);
                       if (selected) {
                           updateProductField(p.id, 'collections', [selected]);
                       } else {
                           updateProductField(p.id, 'collections', []);
                       }
                    }}
                  >
                    <option value="">Ninguna...</option>
                    {allCollections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <ColorSizesSection 
                  variations={p.variations}
                  onChange={vars => updateProductField(p.id, 'variations', vars)}
                />

             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
