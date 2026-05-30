import React, { useState } from 'react';
import styles from './page.module.css';
import { UploadingProduct } from './types';

interface Props {
  products: UploadingProduct[];
  updateProductField: <K extends keyof UploadingProduct>(id: string, field: K, value: UploadingProduct[K]) => void;
  onSubmitAll: (status: 'active' | 'draft') => void;
  isSubmittingAll: boolean;
  onBack: () => void;
}

export default function Phase3Review({ products, updateProductField, onSubmitAll, isSubmittingAll, onBack }: Props) {
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

  const variations = currentProduct.variations || [];
  const primaryVar = variations[0] || {
    colorId: 'default',
    name: 'Blanco',
    hex: '#ffffff',
    sizes: currentProduct.sizes || []
  };

  const updatePrimaryVar = <K extends keyof typeof primaryVar>(field: K, value: typeof primaryVar[K]) => {
    const updatedVar = { ...primaryVar, [field]: value };
    updateProductField(currentProduct.id, 'variations', [updatedVar]);
  };

  const updateSizeStock = (sizeName: string, stock: number) => {
    const safeStock = Math.max(0, stock);
    const currentSizes = primaryVar.sizes || [];
    const hasSize = currentSizes.some(s => s.name === sizeName);

    let newSizes: { name: string; stock: number }[];
    if (!hasSize) {
      newSizes = [...currentSizes, { name: sizeName, stock: safeStock }];
    } else {
      newSizes = currentSizes.map(s => s.name === sizeName ? { ...s, stock: safeStock } : s);
    }

    const filteredSizes = newSizes.filter(s => s.stock > 0);
    updatePrimaryVar('sizes', filteredSizes);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <button onClick={onBack} className={styles.btnBack} type="button" aria-label="Volver a Carga">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
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
            
          {/* Card 1: Información Principal (First, as requested) */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Información Principal</h2>

            <div className={styles.mainInfoSplit}>
              {/* Media gallery section */}
              <div className={styles.reviewGallerySection}>
                {currentProduct.imageUrls.length > 0 ? (
                  <div className={styles.galleryLayout}>
                    {/* Featured big cover image */}
                    <div className={styles.featuredCoverWrapper}>
                      <img 
                        src={currentProduct.imageUrls[0]} 
                        alt="Portada del producto" 
                        className={styles.featuredCoverImg}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                      <span className={styles.featuredCoverBadge}>★ Portada</span>
                    </div>

                    {/* Other thumbnail images */}
                    {currentProduct.imageUrls.length > 1 && (
                      <div className={styles.reviewThumbnailsRow}>
                        {currentProduct.imageUrls.slice(1).map((url, i) => (
                          <img 
                            key={i} 
                            src={url} 
                            alt={`Preview ${i + 1}`} 
                            className={styles.reviewThumbnailImg}
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.helperText} style={{ marginBottom: '16px' }}>Sin imágenes seleccionadas.</div>
                )}
              </div>

              {/* Text fields section */}
              <div className={styles.reviewTextFields}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Nombre del Producto</label>
                  <textarea 
                    className={styles.nameTextarea}
                    value={currentProduct.name}
                    onChange={(e) => updateProductField(currentProduct.id, 'name', e.target.value)}
                    placeholder="Ej: Vestido Lino Amarillo"
                    rows={2}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Descripción</label>
                  <textarea 
                    className={styles.descriptionTextarea}
                    value={currentProduct.description}
                    onChange={(e) => updateProductField(currentProduct.id, 'description', e.target.value)}
                    placeholder="Descripción persuasiva autogenerada por la IA..."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: Comercial & Inventario */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Comercial e Inventario</h2>
            
            <div className={styles.inputGroup}>
              <label className={styles.label}>Precio (ARS)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                <span style={{ position: 'absolute', left: '12px', color: 'rgba(86, 130, 3, 0.6)', fontSize: '0.9rem', fontWeight: 600 }}>$</span>
                <input 
                  type="number" 
                  className={styles.input}
                  value={currentProduct.price}
                  style={{ paddingLeft: '24px' }}
                  onChange={(e) => updateProductField(currentProduct.id, 'price', e.target.value)}
                />
              </div>
            </div>

            {/* AI Color Preview and Editor */}
            <div className={styles.inputGroup} style={{ marginTop: '12px' }}>
              <label className={styles.label}>Color de la Prenda (Extraído por IA / Editable)</label>
              
              <div className={styles.colorEditorRow}>
                {/* Hex/HSB Picker Swatch */}
                <div className={styles.colorPickerContainer}>
                  <input 
                    type="color"
                    className={styles.colorSwatchInput}
                    value={primaryVar.hex || '#ffffff'}
                    onChange={e => updatePrimaryVar('hex', e.target.value)}
                    title="Seleccionar color (Hex/HSB)"
                  />
                  <span className={styles.colorHexText}>{primaryVar.hex || '#ffffff'}</span>
                </div>

                {/* Color Name Input */}
                <input 
                  type="text"
                  className={styles.input}
                  value={primaryVar.name}
                  onChange={e => updatePrimaryVar('name', e.target.value)}
                  placeholder="Nombre de color (Ej: Verde Oliva)"
                />
              </div>
            </div>

            {/* Size & Stock matrix for this color */}
            <div style={{ marginTop: '16px' }}>
              <label className={styles.label} style={{ display: 'block', marginBottom: '8px' }}>Stock por Talle</label>
              
              <div className={styles.matrixGridContainer}>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'U'].map(sizeName => {
                  const sizeObj = (primaryVar.sizes || []).find(s => s.name === sizeName);
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
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 6px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: isActive ? 'var(--accent-light)' : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span 
                        style={{
                          fontFamily: 'var(--font-outfit)',
                          fontSize: '0.75rem',
                          fontWeight: isActive ? 700 : 600,
                          color: isActive ? 'var(--accent-primary)' : '#888888',
                          textTransform: 'uppercase',
                          marginBottom: '2px',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {sizeName}
                      </span>
                      <input
                        type="number"
                        value={currentStock || ''}
                        placeholder="0"
                        style={{
                          width: '100%',
                          maxWidth: '48px',
                          height: '24px',
                          textAlign: 'center',
                          border: 'none',
                          background: 'transparent',
                          color: isActive ? 'var(--accent-primary)' : '#333333',
                          fontFamily: 'var(--font-outfit)',
                          fontSize: '0.95rem',
                          fontWeight: isActive ? 700 : 600,
                          outline: 'none',
                        }}
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
          {/* Master Submit Button logic (Imágenes removed as they are embedded in Card 1) */}
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
                      style={{ width: '100%', padding: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                   >
                      {isSubmittingAll ? (
                        'Publicando...'
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          <span>Subir Lote (Públicos)</span>
                        </>
                      )}
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
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                 >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Siguiente Producto</span>
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
