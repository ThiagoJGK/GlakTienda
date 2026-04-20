'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import ColorSizesSection, { ColorVariation } from '@/components/admin/ColorSizesSection';
import { analyzeProductWithAI } from '../geminiActions';
import { createProductAction, getCollectionsAction } from '../actions';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";
const CLOUDINARY_UPLOAD_PRESET = "GlakTienda";

type UploadingProduct = {
  id: string;
  imageUrls: string[]; 
  
  // AI / Meta Fields
  name: string;
  description: string;
  category: string;
  tags: string;

  // Manual Fields
  price: string;
  collections: {id: string, name: string}[];
  variations: ColorVariation[];

  // Status
  aiStatus: 'idle' | 'generating' | 'done' | 'error';
  uploadStatus: 'idle' | 'uploading' | 'done' | 'error';
};

const LOCAL_STORAGE_KEY = 'glak_bulk_upload_progress';

export default function BulkUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<UploadingProduct[]>([]);
  const [allCollections, setAllCollections] = useState<{id: string, name: string}[]>([]);
  
  // To avoid hydration mismatch, load from localStorage after mount
  const [isClient, setIsClient] = useState(false);
  
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  useEffect(() => {
    setIsClient(true);
    getCollectionsAction().then(res => {
      if (res.success && res.data) {
        setAllCollections(res.data);
      }
    });

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {
        console.error("Local storage parse err", e);
      }
    }
  }, []);

  // Auto-save whenever products changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
    }
  }, [products, isClient]);

  const handleAddNewImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Create a new product entry
    const newId = crypto.randomUUID();
    const newProduct: UploadingProduct = {
      id: newId,
      imageUrls: [],
      name: '',
      description: '',
      category: '',
      tags: '',
      price: '',
      collections: [],
      variations: [],
      aiStatus: 'idle',
      uploadStatus: 'uploading'
    };

    setProducts(prev => [...prev, newProduct]);
    
    // Clear input so same files can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Upload images to Cloudinary
    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url); // Store full secured URLs at first for the AI
        }
      } catch (err) {
        console.error("Failed to upload to cloudinary", err);
      }
    }

    // Update product to mark upload done
    setProducts(prev => prev.map(p => {
      if (p.id === newId) {
        return { ...p, imageUrls: uploadedUrls, uploadStatus: uploadedUrls.length > 0 ? 'done' : 'error' };
      }
      return p;
    }));

    if (uploadedUrls.length > 0) {
      startAIAnalysis(newId, uploadedUrls);
    }
  };

  const startAIAnalysis = async (productId: string, imageUrls: string[]) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, aiStatus: 'generating' } : p));
    
    const aiResult = await analyzeProductWithAI(imageUrls);
    
    if (aiResult.success && aiResult.data) {
      setProducts(prev => prev.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            name: aiResult.data.name || p.name,
            description: aiResult.data.description || p.description,
            category: aiResult.data.category || p.category,
            tags: aiResult.data.tags || p.tags,
            aiStatus: 'done'
          };
        }
        return p;
      }));
    } else {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, aiStatus: 'error' } : p));
    }
  };

  const updateProductField = (id: string, field: keyof UploadingProduct, value: any) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const submitAll = async () => {
    if (products.length === 0) return;
    setIsSubmittingAll(true);

    for (const p of products) {
      const publicIds = p.imageUrls.map(url => {
        // extract public id from standard cloudinary url if needed, else keep url
        // the standard create form saves public_ids but also urls work since our viewer can handle it
        // To keep it standard to your old form logic, we split it:
        const parts = url.split('/');
        const last = parts[parts.length - 1];
        return last.split('.')[0]; 
      });

      const totalStock = p.variations.reduce((acc, v) => 
        acc + v.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
      , 0);

      const formData = new FormData();
      formData.append("name", p.name);
      formData.append("description", p.description);
      formData.append("price", p.price || "0"); // default to 0 if empty
      formData.append("stock", totalStock.toString());
      formData.append("sizes", JSON.stringify(p.variations));
      formData.append("category", p.category);
      formData.append("tags", p.tags);
      formData.append("status", "draft"); // Default to draft, require review later
      formData.append("images", JSON.stringify(publicIds));
      formData.append("collections", JSON.stringify(p.collections));

      await createProductAction(formData);
    }

    setIsSubmittingAll(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    router.push('/admin/productos');
  };

  const aiGeneratingCount = products.filter(p => p.aiStatus === 'generating').length;

  if (!isClient) return null; // Avoid hydration mismatch

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Link href="/admin/productos" className={styles.btnBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div>
            <h1 className={styles.title}>Carga Masiva (BETA)</h1>
            <p className={styles.subtitle}>Sube grupos de imágenes y deja que la IA rellene los datos básicos.</p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
           {aiGeneratingCount > 0 && (
             <div className={styles.globalStatusBar}>
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
               {aiGeneratingCount} productos analizando...
             </div>
           )}

           <button 
             className="btn btn-primary"
             onClick={submitAll}
             disabled={isSubmittingAll || products.length === 0 || aiGeneratingCount > 0}
           >
             Guardar Todo ({products.length})
           </button>
        </div>
      </header>

      <div className={styles.productsGrid}>
        {products.map((p, index) => (
          <div key={p.id} className={styles.productRow}>
             
             {/* Media Column */}
             <div className={styles.mediaCol}>
                <div className={styles.thumbnails}>
                  {p.uploadStatus === 'uploading' ? (
                     <div className={styles.thumbnailCard}>Subiendo...</div>
                  ) : (
                     p.imageUrls.map((url, i) => (
                       <div key={i} className={styles.thumbnailCard}>
                         <img src={url} alt={\`Prod ${index} img ${i}\`} />
                       </div>
                     ))
                  )}
                </div>
             </div>

             {/* Form Column */}
             <div className={styles.formCol}>
                <div className={styles.rowHeader}>
                   <div className={styles.productIndex}>Producto #{index + 1}</div>
                   <div className={styles.statusIndicators}>
                     {p.aiStatus === 'generating' && <span className={\`\${styles.badge} \${styles.badgeGenerating}\`}>Analizando IA...</span>}
                     {p.aiStatus === 'done' && <span className={\`\${styles.badge} \${styles.badgeDone}\`}>IA Completada</span>}
                     <button className={styles.btnRemoveProduct} onClick={() => removeProduct(p.id)}>Eliminar</button>
                   </div>
                </div>

                <div className={styles.fieldsGrid}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Nombre (IA)</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      value={p.name} 
                      onChange={e => updateProductField(p.id, 'name', e.target.value)}
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Categoría (IA)</label>
                    <select 
                      className={styles.input}
                      value={p.category}
                      onChange={e => updateProductField(p.id, 'category', e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Vestidos">Vestidos</option>
                      <option value="Pantalones">Pantalones</option>
                      <option value="Camisas">Camisas</option>
                      <option value="Accesorios">Accesorios</option>
                      <option value="Abrigos">Abrigos</option>
                    </select>
                  </div>

                  <div className={\`\${styles.inputGroup} \${styles.fullWidth}\`}>
                    <label className={styles.label}>Descripción (IA)</label>
                    <textarea 
                      className={\`\${styles.input} \${styles.textarea}\`}
                      value={p.description}
                      onChange={e => updateProductField(p.id, 'description', e.target.value)}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Precio</label>
                    <input 
                      type="number" 
                      className={styles.input} 
                      placeholder="Precio ARS"
                      value={p.price}
                      onChange={e => updateProductField(p.id, 'price', e.target.value)}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Etiquetas (IA)</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      value={p.tags}
                      onChange={e => updateProductField(p.id, 'tags', e.target.value)}
                    />
                  </div>

                  {/* Stock and Variations */}
                  <div className={styles.fullWidth} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <ColorSizesSection 
                      variations={p.variations}
                      onChange={vars => updateProductField(p.id, 'variations', vars)}
                    />
                  </div>
                </div>
             </div>
             
          </div>
        ))}

        {/* Add more trigger */}
        <div className={styles.addMoreBlock} onClick={() => fileInputRef.current?.click()}>
           <div className={styles.addMoreContent}>
              <svg className={styles.iconPlus} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Añadir Producto (Selecciona imágenes)</span>
           </div>
           <input 
             type="file" 
             multiple 
             accept="image/*" 
             ref={fileInputRef} 
             style={{ display: 'none' }}
             onChange={handleAddNewImages}
           />
        </div>
      </div>

      {isSubmittingAll && (
        <div className={styles.loaderOverlay}>
           <span>Subiendo lote a la base de datos...</span>
        </div>
      )}
    </div>
  );
}
