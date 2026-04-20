import React, { useState } from 'react';
import styles from './page.module.css';
import { UploadingProduct } from './types';
import ColorSizesSection from '@/components/admin/ColorSizesSection';

interface Props {
  products: UploadingProduct[];
  updateProductField: (id: string, field: keyof UploadingProduct, value: any) => void;
  allCollections: {id: string, name: string}[];
  onSubmitAll: (status: 'active' | 'draft') => void;
  isSubmittingAll: boolean;
  onBack: () => void;
}

export default function Phase3Review({ products, updateProductField, allCollections, onSubmitAll, isSubmittingAll, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentProduct = products[currentIndex];
  
  if (!currentProduct) return null;

  const isLast = currentIndex === products.length - 1;

  const handleNext = (publishStatus: 'active' | 'draft' = 'active') => {
    if (isLast) {
      onSubmitAll(publishStatus);
    } else {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo(0, 0); // Scroll to top for next product
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <button onClick={onBack} className={styles.btnBack} type="button">
            Volver a Carga
          </button>
          <div>
             <h1 className={styles.title}>Revisión ({currentIndex + 1} de {products.length})</h1>
             <p className={styles.subtitle}>Verifica los datos generados por IA y los manuales antes de guardar.</p>
          </div>
        </div>
      </header>

      <div className={styles.formGrid}>
        {/* Left Column */}
        <div className={styles.colMain}>
            
          {/* Card 1: Comercial & Inventario */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Comercial e Inventario</h2>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Precio (ARS)</label>
              <input 
                type="number" 
                className={styles.input}
                value={currentProduct.price}
                onChange={(e) => updateProductField(currentProduct.id, 'price', e.target.value)}
              />
            </div>

            <ColorSizesSection 
              variations={currentProduct.variations}
              onChange={vars => updateProductField(currentProduct.id, 'variations', vars)}
            />
          </section>

          {/* Card 2: Información Principal (IA) */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Información Principal (Autocompletado)</h2>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Nombre del Producto</label>
              <input 
                type="text" 
                className={styles.input}
                value={currentProduct.name}
                onChange={(e) => updateProductField(currentProduct.id, 'name', e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Descripción</label>
              <textarea 
                className={styles.input}
                style={{ height: 100, paddingTop: 'var(--space-3)', resize: 'vertical' }}
                value={currentProduct.description}
                onChange={(e) => updateProductField(currentProduct.id, 'description', e.target.value)}
              />
            </div>
          </section>

          {/* Card 3: Organización */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Organización</h2>
            
            <div className={styles.inputGroup}>
                <label className={styles.label}>Categoría principal</label>
                <select 
                  className={styles.input}
                  value={currentProduct.category}
                  onChange={(e) => updateProductField(currentProduct.id, 'category', e.target.value)}
                >
                  <option value="" disabled>Seleccionar...</option>
                  <option value="Vestidos">Vestidos</option>
                  <option value="Pantalones">Pantalones</option>
                  <option value="Camisas">Camisas</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Abrigos">Abrigos</option>
                </select>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Etiquetas (Separadas por comas)</label>
              <input 
                type="text" 
                className={styles.input}
                value={currentProduct.tags}
                onChange={(e) => updateProductField(currentProduct.id, 'tags', e.target.value)}
              />
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className={styles.colSide}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Imágenes</h2>
            
            {currentProduct.imageUrls.length > 0 ? (
              <div className={styles.previewGrid}>
                {currentProduct.imageUrls.map((url, index) => (
                  <div key={index} className={styles.previewCard}>
                    <img src={url} alt={`Preview ${index}`} />
                  </div>
                ))}
              </div>
            ) : (
               <div className={styles.helperText}>Sin imágenes seleccionadas.</div>
            )}
          </section>

          {/* Master Submit Button logic */}
          <section className={styles.card} style={{position: 'sticky', top: '24px'}}>
             <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
               <p className={styles.subText}>
                 Revisa todo el formulario. Cuando estés seguro, pasa al siguiente.
               </p>
               
               {isLast ? (
                 <>
                   <button 
                      type="button" 
                      className={`btn btn-primary ${isSubmittingAll ? styles.loading : ''}`}
                      onClick={() => handleNext('active')}
                      disabled={isSubmittingAll}
                      style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                   >
                      {isSubmittingAll ? 'Publicando...' : '🎉 Subir Lote (Públicos)'}
                   </button>
                   <button 
                      type="button" 
                      className={`btn-ghost ${isSubmittingAll ? styles.loading : ''}`}
                      onClick={() => handleNext('draft')}
                      disabled={isSubmittingAll}
                      style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
                   >
                      {isSubmittingAll ? 'Guardando...' : 'Guardar Lote (Borradores)'}
                   </button>
                 </>
               ) : (
                 <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => handleNext('active')}
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                 >
                    ✅ Siguiente Producto
                 </button>
               )}

               {!isLast && (
                 <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                    Luego de este, faltan {products.length - currentIndex - 1} más.
                 </div>
               )}
             </div>
          </section>

        </div>
      </div>
    </div>
  );
}
