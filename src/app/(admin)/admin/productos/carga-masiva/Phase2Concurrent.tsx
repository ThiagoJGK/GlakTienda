import React from 'react';
import styles from './page.module.css';
import { UploadingProduct } from './types';
import Step2Sizes from './Step2Sizes';

interface Props {
  products: UploadingProduct[];
  updateProductField: <K extends keyof UploadingProduct>(id: string, field: K, value: UploadingProduct[K]) => void;
  onProceed: () => void;
  onRemoveProduct: (id: string) => void;
  allCollections: {id: string, name: string}[];
}

export default function Phase2Concurrent({ products, updateProductField, onProceed, onRemoveProduct, allCollections }: Props) {
  
  const aiGeneratingCount = products.filter(p => p.aiStatus === 'generating').length;
  const isAiDone = aiGeneratingCount === 0 && products.every(p => p.aiStatus === 'done' || p.aiStatus === 'error');

  const totalProducts = products.length;
  const completedProducts = products.filter(p => p.aiStatus === 'done' || p.aiStatus === 'error').length;
  const progressPercent = totalProducts > 0 ? (completedProducts / totalProducts) * 100 : 0;

  let statusMessage = '';
  if (aiGeneratingCount > 0) {
    statusMessage = `Analizando prendas con IA (${completedProducts}/${totalProducts})...`;
  } else if (isAiDone) {
    statusMessage = 'Análisis completo';
  } else {
    statusMessage = 'Esperando análisis de IA...';
  }

  return (
    <div className={styles.phase2Container}>
      {/* Sticky progress bar */}
      <div className={styles.globalStatusBarFixed}>
        <div className={styles.statusBarContent}>
          <div className={styles.headerInfoGroup}>
            <span className={styles.headerTitle}>Carga Masiva</span>
            <span className={styles.headerDivider}>•</span>
            <span className={styles.headerSubtitle}>
              {aiGeneratingCount > 0 ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span className={styles.pulseDot} />
                  <span>IA: {completedProducts}/{totalProducts} ({Math.round(progressPercent)}%)</span>
                </span>
              ) : (
                <span className={styles.badgeDoneText}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px', color: 'var(--accent-primary)' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  IA: Listo ({completedProducts}/{totalProducts})
                </span>
              )}
            </span>
          </div>
        </div>
        
        <button 
          className={styles.btnProceedPremium}
          onClick={onProceed}
          disabled={!isAiDone}
        >
          <span>Siguiente</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <div className={styles.progressBarContainer}>
          <div 
            className={styles.progressBarFill} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className={styles.productsGridMobileFirst}>
        {products.map((p, index) => {
          const parentIndex = p.parentId ? products.findIndex(pr => pr.id === p.parentId) + 1 : 0;
          return (
            <div key={p.id} className={`${styles.mobileCard} ${p.parentId ? styles.productVariantCard : ''}`}>
               
               <div className={styles.mobileCardHeader}>
                  <div className={styles.productIndex}>
                    {p.parentId ? (
                      <>
                        Variante de Color
                        <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '6px' }}>
                          (Producto {parentIndex})
                        </span>
                      </>
                    ) : (
                      `Producto ${index + 1}`
                    )}
                  </div>
                  <div className={styles.statusIndicators}>
                    {p.aiStatus === 'error' && (
                      <span className={`${styles.badge} ${styles.badgeManual}`}>
                        Manual
                      </span>
                    )}
                    <button 
                      type="button"
                      onClick={() => onRemoveProduct(p.id)}
                      className={styles.btnRemoveProductF1}
                      style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px'}}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Quitar
                    </button>
                  </div>
               </div>

               <div className={styles.miniGalleryScroll}>
                 {p.imageUrls.map((url, i) => (
                   <img 
                     key={i} 
                     src={url} 
                     alt={`Vista previa producto ${index + 1}`} 
                     className={styles.miniGalleryImg} 
                     crossOrigin="anonymous"
                     referrerPolicy="no-referrer"
                   />
                 ))}
                 {p.uploadStatus === 'uploading' && <div className={styles.miniGalleryImg}>Subiendo...</div>}
               </div>

               <div className={styles.mobileCardBody}>
                 {!p.parentId && (
                   <div className={styles.formFieldsRow}>
                     {/* Show price as read-only if already set in Step 1, or allow editing */}
                     <div className={styles.inputGroup}>
                       <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                           <line x1="7" y1="7" x2="7.01" y2="7"/>
                         </svg>
                         Precio (ARS)
                       </label>
                       <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                         <span style={{ position: 'absolute', left: '12px', color: 'rgba(86, 130, 3, 0.6)', fontSize: '0.9rem', fontWeight: 600 }}>$</span>
                         <input 
                           type="number" 
                           className={styles.input} 
                           placeholder="45000"
                           value={p.price}
                           style={{ paddingLeft: '24px' }}
                           onChange={e => updateProductField(p.id, 'price', e.target.value)}
                         />
                       </div>
                     </div>

                     <div className={styles.inputGroup}>
                       <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                         </svg>
                         Colección
                       </label>
                       <select 
                         className={styles.input}
                         value={p.collections[0]?.id || ''}
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
                   </div>
                 )}

                 {p.parentId && (
                   <div className={styles.variantInheritanceHelper}>
                     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                       <circle cx="12" cy="12" r="10"/>
                       <line x1="12" y1="16" x2="12" y2="12"/>
                       <line x1="12" y1="8" x2="12.01" y2="8"/>
                     </svg>
                     <span>Hereda Precio y Colección de Producto {parentIndex}</span>
                   </div>
                 )}

                   {/* Simplified size stock selector — no color picker */}
                   <Step2Sizes 
                     sizes={p.sizes || []}
                     onChange={newSizes => updateProductField(p.id, 'sizes', newSizes)}
                   />

               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
