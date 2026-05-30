'use client';

import React, { useRef } from 'react';
import styles from './page.module.css';
import { UploadingProduct } from './types';
import DraftStatusCloud from './DraftStatusCloud';
import { HISTORY_STORAGE_KEY } from './page';

interface Props {
  products: UploadingProduct[];
  onAddFiles: (files: FileList) => void;
  onRemoveProduct: (id: string) => void;
  onProceed: () => void;
  updateProductField: (id: string, field: keyof UploadingProduct, value: any) => void;
  pendingDraft?: {phase: number, products: UploadingProduct[]} | null;
  onResumeDraft?: () => void;
  onDiscardDraft?: () => void;
  draftStatus: 'unsaved' | 'saving' | 'saved' | 'error';
  onForceSaveDraft: () => void;
  lastSavedAt?: Date | null;
  onAddSibling?: (parentId: string) => void;
  onAddFilesToProduct?: (productId: string, files: FileList) => void;
}

interface UploadHistoryItem {
  id: string;
  date: string;
  count: number;
  status: string;
}

export default function Phase1Selection({
  products,
  onAddFiles,
  onRemoveProduct,
  onProceed,
  updateProductField,
  pendingDraft,
  onResumeDraft,
  onDiscardDraft,
  draftStatus,
  onForceSaveDraft,
  lastSavedAt,
  onAddSibling,
  onAddFilesToProduct
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = React.useState<UploadHistoryItem[]>([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // Ignore errors
    }
  }, []);

  // Drag over index to provide visual drop target feedback
  const [dragOverIndex, setDragOverIndex] = React.useState<{ prodId: string; index: number } | null>(null);

  // HTML5 Drag & Drop handlers for thumbnail reordering
  const handleDragStart = (e: React.DragEvent, prodId: string, index: number) => {
    e.dataTransfer.setData("productId", prodId);
    e.dataTransfer.setData("draggedIndex", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, prodId: string, index: number) => {
    e.preventDefault(); // Necessary to allow drop
    setDragOverIndex({ prodId, index });
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, prodId: string, targetIndex: number) => {
    setDragOverIndex(null);
    const sourceProdId = e.dataTransfer.getData("productId");
    const draggedIndexStr = e.dataTransfer.getData("draggedIndex");

    if (sourceProdId !== prodId || !draggedIndexStr) return;

    const draggedIndex = parseInt(draggedIndexStr, 10);
    if (draggedIndex === targetIndex) return;

    const product = products.find(p => p.id === prodId);
    if (!product) return;

    const newUrls = [...product.imageUrls];
    const [removed] = newUrls.splice(draggedIndex, 1);
    newUrls.splice(targetIndex, 0, removed);

    updateProductField(prodId, 'imageUrls', newUrls);
  };

  const handleRemoveImage = (prodId: string, imgIndex: number) => {
    const product = products.find(p => p.id === prodId);
    if (!product) return;
    const newUrls = product.imageUrls.filter((_, i) => i !== imgIndex);
    updateProductField(prodId, 'imageUrls', newUrls);
  };

  const handlePromoteToCover = (prodId: string, imgIndex: number) => {
    const product = products.find(p => p.id === prodId);
    if (!product) return;
    const newUrls = [...product.imageUrls];
    const [removed] = newUrls.splice(imgIndex, 1);
    newUrls.unshift(removed); // Leftmost position automatically receives the cover ★ designation
    updateProductField(prodId, 'imageUrls', newUrls);
  };

  return (
    <div className={styles.phase1Container}>
      <header className={styles.selectionHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Carga Masiva</h1>
          <div className={styles.metaRow}>
            <span className={styles.stepBadge}>Paso 1</span>
            <DraftStatusCloud 
              status={draftStatus}
              onSave={onForceSaveDraft}
              lastSavedAt={lastSavedAt}
            />
          </div>
          <p className={styles.subtitle}>Agrupa las fotos y marca la imagen de la estrella. Presiona "+ Color" para añadir variantes de prendas.</p>
        </div>
        <div className={styles.headerActions}>
           <button 
             className="btn btn-primary"
             onClick={onProceed}
             disabled={products.length === 0}
           >
             Continuar a Paso 2 ({products.length} productos)
           </button>
        </div>
      </header>

      {pendingDraft && (
         <div className={styles.draftPanel}>
            <div className={styles.draftPanelContent}>
               <h3 className={styles.draftPanelTitle}>Tienes un borrador pendiente</h3>
               <p className={styles.draftPanelSubtitle}>
                 Proceso sin finalizar con {pendingDraft.products.length} productos guardados.
               </p>
            </div>
            <div className={styles.draftPanelActions}>
               <button type="button" onClick={onDiscardDraft} className={styles.btnDiscardDraft}>Descartar</button>
               <button type="button" onClick={onResumeDraft} className={styles.btnResumeDraft}>Retomar Carga</button>
            </div>
         </div>
      )}

      {history.length > 0 && products.length === 0 && !pendingDraft && (
         <div className={styles.historyPanel}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Historial de Cargas Recientes
            </h3>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {history.map(h => (
                 <li key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>Carga de <strong>{h.count} productos</strong></span>
                    <span>{new Date(h.date).toLocaleString()} — {h.status === 'draft' ? 'Borradores' : 'Públicos'}</span>
                 </li>
               ))}
            </ul>
         </div>
      )}

      <div className={styles.productsGridPhase1}>
        {products.map((p, index) => (
          <div 
            key={p.id} 
            className={`${styles.productSelectionCard} ${p.parentId ? styles.productVariantCard : ''}`}
          >
             {/* Card header: title + add color + delete */}
             <div className={styles.productSelectionHeader}>
                <strong style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)' }}>
                   {p.parentId ? (
                     <>
                       Variante de Color
                       <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '6px' }}>
                         (Vinculado a Producto {products.findIndex(pr => pr.id === p.parentId) + 1})
                       </span>
                     </>
                   ) : (
                     `Producto ${index + 1}`
                   )}
                   {p.imageUrls.length > 0 && (
                     <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '6px' }}>
                       ({p.imageUrls.length} foto{p.imageUrls.length !== 1 ? 's' : ''})
                     </span>
                   )}
                </strong>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* Sibling color variant creation button */}
                  {!p.parentId && (
                    <button
                      type="button"
                      onClick={() => onAddSibling?.(p.id)}
                      className={styles.btnAddColorSiblingHeader}
                      title="Agregar otra variante de color para este producto"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      + Color
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveProduct(p.id)}
                    className={styles.btnRemoveProductF1}
                    title="Eliminar este producto del lote"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px' }}>
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                    Quitar
                  </button>
                </div>
             </div>

             {/* Thumbnail gallery / Upload Zone */}
             {p.imageUrls.length === 0 && p.uploadStatus !== 'uploading' ? (
                <div 
                  className={styles.cardEmptyUploadZone}
                  onClick={() => {
                    const inp = document.createElement('input');
                    inp.type = 'file';
                    inp.multiple = true;
                    inp.accept = 'image/*';
                    inp.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0) {
                        onAddFilesToProduct?.(p.id, files);
                      }
                    };
                    inp.click();
                  }}
                  title="Haz clic para subir imágenes específicas de esta variante"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Subir Fotos</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 400 }}>Selecciona una o más imágenes</span>
                </div>
             ) : (
                <div className={styles.thumbnails}>
                  {p.uploadStatus === 'uploading' ? (
                     <div className={styles.thumbnailCardPhase1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', gridColumn: '1 / -1', height: '80px', aspectRatio: 'auto' }}>
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                         <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                       </svg>
                       Subiendo...
                     </div>
                  ) : (
                     <>
                       {p.imageUrls.map((url, i) => {
                         const isDragOver = dragOverIndex?.prodId === p.id && dragOverIndex?.index === i;
                         return (
                           <div 
                             key={url + '-' + i} 
                             className={`${styles.thumbnailCardPhase1} ${isDragOver ? styles.dragOver : ''}`} 
                             style={{ position: 'relative', cursor: 'grab' }}
                             draggable="true"
                             onDragStart={(e) => handleDragStart(e, p.id, i)}
                             onDragOver={(e) => handleDragOver(e, p.id, i)}
                             onDragLeave={handleDragLeave}
                             onDrop={(e) => handleDrop(e, p.id, i)}
                             title="Arrastra para reordenar la foto representativa ★ o haz clic en la estrella para establecer como principal"
                           >
                             {i === 0 ? (
                               <span className={styles.starBadge} title="Imagen Representativa (★)">
                                 ★
                               </span>
                             ) : (
                               <button
                                 type="button"
                                 className={styles.starBadgeOutline}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handlePromoteToCover(p.id, i);
                                 }}
                                 title="Marcar como Imagen Representativa (★)"
                               >
                                 ☆
                               </button>
                             )}
                             <img 
                               src={url} 
                               alt={`Producto ${index + 1}, foto ${i + 1}`} 
                               crossOrigin="anonymous"
                               referrerPolicy="no-referrer"
                             />
                             <button
                               type="button"
                               className={styles.btnDeleteThumbnail}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleRemoveImage(p.id, i);
                               }}
                               title="Eliminar esta imagen"
                             >
                               ✕
                             </button>
                           </div>
                         );
                       })}
                       {/* Beautiful Add Photos Button inside the grid */}
                       <div 
                         className={styles.addThumbnailButton}
                         onClick={() => {
                           const inp = document.createElement('input');
                           inp.type = 'file';
                           inp.multiple = true;
                           inp.accept = 'image/*';
                           inp.onchange = (e) => {
                             const files = (e.target as HTMLInputElement).files;
                             if (files && files.length > 0) {
                               onAddFilesToProduct?.(p.id, files);
                             }
                           };
                           inp.click();
                         }}
                         title="Añadir más fotos"
                       >
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                           <line x1="12" y1="5" x2="12" y2="19" />
                           <line x1="5" y1="12" x2="19" y2="12" />
                         </svg>
                         <span>+ Fotos</span>
                       </div>
                     </>
                  )}
                </div>
             )}
          </div>
        ))}

        {/* Add new product block with drag & drop support */}
        <div 
          className={styles.addMoreBlockBig} 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              onAddFiles(e.dataTransfer.files);
            }
          }}
        >
           <svg className={styles.iconPlusBig} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <line x1="12" y1="5" x2="12" y2="19" />
             <line x1="5" y1="12" x2="19" y2="12" />
           </svg>
           <div className={styles.addMoreTextContainer}>
             <span className={styles.addMoreTitle}>Añadir Prenda al Lote</span>
             <span className={styles.addMoreSubtitle}>Arrastra o selecciona sus imágenes</span>
           </div>
        </div>

        <input 
          type="file" 
          multiple 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) {
              onAddFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>
    </div>
  );
}
