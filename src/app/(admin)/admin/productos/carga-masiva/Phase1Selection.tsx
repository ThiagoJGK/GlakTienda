import React, { useRef } from 'react';
import styles from './page.module.css';
import { UploadingProduct } from './types';

interface Props {
  products: UploadingProduct[];
  onAddFiles: (files: FileList) => void;
  onRemoveProduct: (id: string) => void;
  onProceed: () => void;
  pendingDraft?: {phase: number, products: UploadingProduct[]} | null;
  onResumeDraft?: () => void;
  onDiscardDraft?: () => void;
}

import { HISTORY_STORAGE_KEY } from './page';

export default function Phase1Selection({ products, onAddFiles, onRemoveProduct, onProceed, pendingDraft, onResumeDraft, onDiscardDraft }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = React.useState<any[]>([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch(e) {}
  }, []);

  return (
    <div className={styles.phase1Container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Carga Masiva - Paso 1</h1>
          <p className={styles.subtitle}>Agrupa las fotos por producto. Presiona + para agregar imágenes de un producto nuevo.</p>
        </div>
        <div className={styles.headerActions}>
           <button 
             className="btn btn-primary"
             onClick={onProceed}
             disabled={products.length === 0}
           >
             Ejecutar Carga ({products.length} productos)
           </button>
        </div>
      </header>

      {pendingDraft && (
         <div className={styles.draftPanel} style={{ backgroundColor: 'var(--color-warning-light)', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <h3 style={{ margin: '0 0 5px 0', color: '#854d0e' }}>Tienes un borrador pendiente</h3>
               <p style={{ margin: 0, fontSize: '0.9rem', color: '#a16207' }}>
                 Hay un proceso de carga sin finalizar con {pendingDraft.products.length} productos.
               </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
               <button type="button" onClick={onDiscardDraft} className="btn-ghost" style={{ color: '#854d0e' }}>Descartar</button>
               <button type="button" onClick={onResumeDraft} className="btn" style={{ backgroundColor: '#ca8a04', color: 'white' }}>Retomar Carga</button>
            </div>
         </div>
      )}

      {history.length > 0 && products.length === 0 && !pendingDraft && (
         <div className={styles.historyPanel} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>⏱️ Historial de Cargas Recientes</h3>
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
          <div key={p.id} className={styles.productSelectionCard}>
             <div className={styles.productSelectionHeader}>
                <strong>Producto #{index + 1} ({p.imageUrls.length} fotos)</strong>
                <button type="button" onClick={() => onRemoveProduct(p.id)} className={styles.btnRemoveProductF1}>Eliminar</button>
             </div>
             <div className={styles.thumbnails}>
               {p.uploadStatus === 'uploading' ? (
                  <div className={styles.thumbnailCardPhase1}>Subiendo...</div>
               ) : (
                  p.imageUrls.map((url, i) => (
                    <div key={i} className={styles.thumbnailCardPhase1}>
                      <img src={url} alt={`Prod ${index} img ${i}`} />
                    </div>
                  ))
               )}
             </div>
          </div>
        ))}

        <div className={styles.addMoreBlockBig} onClick={() => fileInputRef.current?.click()}>
           <svg className={styles.iconPlusBig} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <line x1="12" y1="5" x2="12" y2="19" />
             <line x1="5" y1="12" x2="19" y2="12" />
           </svg>
           <span>+ Producto (Selecciona sus imágenes)</span>
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
