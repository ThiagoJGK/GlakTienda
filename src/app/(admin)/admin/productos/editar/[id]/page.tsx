'use client';

import Link from "next/link";
import { useState, useRef, useEffect, use } from "react";
import styles from "../../crear/page.module.css";
import { useRouter } from "next/navigation";
import { getCollectionsAction, updateProductAction } from "../../actions";
import { createClient } from "@/lib/supabase/client";
import ColorSizesSection, { ColorVariation } from "@/components/admin/ColorSizesSection";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";
const CLOUDINARY_UPLOAD_PRESET = "GlakTienda";



export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Next.js 15 async params
  const { id } = use(params);

  // UI States
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("draft");

  // Colors & Sizes & Stock
  const [variations, setVariations] = useState<ColorVariation[]>([]);
  const totalStock = variations.reduce((acc, v) => 
    acc + v.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
  , 0);

  // Collections states
  const [allCollections, setAllCollections] = useState<{id: string, name: string}[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<{id: string, name: string, isNew?: boolean}[]>([]);
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  // Cloudinary States
  const [images, setImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        // Load collections
        const collRes = await getCollectionsAction();
        if (collRes.success && collRes.data) {
          setAllCollections(collRes.data);
        }

        // Load Product Data (Basic info first)
        const supabase = createClient();
        const { data: product, error: prdErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (prdErr || !product) {
          setErrorObj("No se pudo cargar el producto. " + (prdErr?.message || ""));
          setIsLoadingInitial(false);
          return;
        }

        // Try to load collections separately to avoid crashing the whole page if relation fails
        let productCollections: any[] = [];
        try {
           const { data: pcData, error: pcErr } = await supabase
            .from('product_collections')
            .select('collection_id')
            .eq('product_id', id);
            
           if (!pcErr && pcData) {
             productCollections = pcData;
           }
        } catch (e) {
           console.warn("Could not load product collections", e);
        }

        setName(product.name || "");
        setDescription(product.description || "");
        setPrice(product.price ? product.price.toString() : "0");
        setCategory(product.category || "");
        setTags(product.tags ? product.tags.join(", ") : "");
        setStatus(product.status || "draft");
        setImages(product.images || []);
        
        if (product.sizes && Array.isArray(product.sizes)) {
          if (product.sizes.length > 0 && typeof product.sizes[0].colorId === 'undefined') {
            // Legacy flat format
            setVariations([{
               colorId: 'default',
               name: 'Color Único',
               hex: '#cccccc',
               sizes: product.sizes
            }]);
          } else {
            // New variations format
            setVariations(product.sizes);
          }
        }

        // Load selected collections based on pivot
        if (productCollections.length > 0 && collRes.data) {
          const selectedColls = productCollections.map((pc: any) => {
            const match = collRes.data.find((c: any) => c.id === pc.collection_id);
            return match ? { id: match.id, name: match.name } : null;
          }).filter(Boolean);
          setSelectedCollections(selectedColls);
        }

        setIsLoadingInitial(false);
      } catch (err) {
        console.error(err);
        setErrorObj("Error crítico al cargar datos.");
        setIsLoadingInitial(false);
      }
    }
    
    loadData();
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadProgress(10);
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
          uploadedUrls.push(data.public_id);
        } else {
          alert("Error subiendo imagen: " + (data.error?.message || "Error desconocido"));
        }
      } catch (err) {
        console.error(err);
      }
    }

    setImages(prev => [...prev, ...uploadedUrls]);
    setUploadProgress(0);
    e.target.value = '';
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorObj(null);
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("stock", totalStock.toString());
    formData.append("sizes", JSON.stringify(variations));
    formData.append("category", category);
    formData.append("tags", tags);
    formData.append("status", status);
    formData.append("images", JSON.stringify(images));
    formData.append("collections", JSON.stringify(selectedCollections));

    try {
      const result = await updateProductAction(id, formData);
      if (result.success) {
        router.push("/admin/productos");
      } else {
        setErrorObj(result.error || "Falló la actualización del producto.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorObj("Ocurrió un error inesperado de conexión.");
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitial) {
    return <div className={styles.container} style={{ textAlign: "center", padding: "100px 0" }}>Cargando datos del producto...</div>;
  }

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
            <h1 className={styles.title}>Editar Producto</h1>
            <p className={styles.subtitle}>Modifica los datos del artículo.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={`btn-ghost ${styles.btnSaveDraft}`} onClick={() => { setStatus("draft"); setTimeout(() => formRef.current?.requestSubmit(), 0); }}>
            Guardar Borrador
          </button>
          <button 
            type="submit" 
            form="product-form"
            className={`btn btn-primary ${styles.btnPublish} ${isSubmitting ? styles.loading : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </header>

      {errorObj && (
        <div className={styles.errorBox}>
          ⚠️ Error comunicándose con Supabase: {errorObj}
        </div>
      )}

      <form id="product-form" className={styles.formGrid} onSubmit={handleSubmit} ref={formRef}>
        {/* Left Column */}
        <div className={styles.colMain}>
            
          {/* Card 1: Comercial & Inventario */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Comercial e Inventario</h2>
            
            <div className={styles.inputGroup}>
              <label htmlFor="price" className={styles.label}>Precio (ARS)</label>
              <input 
                id="price" 
                type="number" 
                placeholder="0"
                required
                className={styles.input}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <ColorSizesSection 
              variations={variations}
              onChange={setVariations}
            />
          </section>

          {/* Card 2: Información Principal */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Información Principal</h2>
            
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>Nombre del Producto</label>
              <input 
                id="name" 
                type="text" 
                placeholder="Ej: Vestido Lino Natural"
                required 
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="description" className={styles.label}>Descripción</label>
              <textarea 
                id="description" 
                placeholder="Describí el producto: materiales, cuidados, detalles especiales..."
                className={styles.input}
                style={{ height: 100, paddingTop: 'var(--space-3)', resize: 'vertical' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </section>

          {/* Card 3: Organización */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Organización</h2>
            
            <div className={styles.inputGroup}>
                <label htmlFor="category" className={styles.label}>Categoría principal</label>
                <select 
                  id="category" 
                  required
                  className={styles.input}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
              <label className={styles.label}>Colecciones (Opcional)</label>
              <div className={styles.collectionsWrapper}>
                <div className={styles.collectionsSlider}>
                  {allCollections.map(coll => {
                    const isSelected = selectedCollections.some(c => c.id === coll.id);
                    return (
                      <button 
                        key={coll.id}
                        type="button" 
                        className={`${styles.collectionChip} ${isSelected ? styles.selected : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCollections(prev => prev.filter(c => c.id !== coll.id));
                          } else {
                            setSelectedCollections(prev => [...prev, {id: coll.id, name: coll.name}]);
                          }
                        }}
                      >
                        {coll.name}
                      </button>
                    );
                  })}
                  
                  {selectedCollections.filter(c => c.isNew).map(newColl => (
                    <button 
                      key={newColl.id}
                      type="button" 
                      className={`${styles.collectionChip} ${styles.selected}`}
                      onClick={() => setSelectedCollections(prev => prev.filter(c => c.id !== newColl.id))}
                    >
                      {newColl.name} ✕
                    </button>
                  ))}

                  {!isAddingCollection && (
                    <button 
                      type="button" 
                      className={`${styles.collectionChip} ${styles.collectionChipAdd}`}
                      onClick={() => setIsAddingCollection(true)}
                    >
                      <span>+</span> Crear nueva
                    </button>
                  )}
                </div>

                {isAddingCollection && (
                  <div className={styles.newCollectionPrompt}>
                    <input 
                      type="text" 
                      className={styles.input} 
                      placeholder="Nombre de la colección..."
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCollectionName.trim()) {
                            setSelectedCollections(prev => [...prev, { id: `new_${Date.now()}`, name: newCollectionName.trim(), isNew: true }]);
                            setNewCollectionName("");
                            setIsAddingCollection(false);
                          }
                        }
                      }}
                      autoFocus
                    />
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => {
                        if (newCollectionName.trim()) {
                          setSelectedCollections(prev => [...prev, { id: `new_${Date.now()}`, name: newCollectionName.trim(), isNew: true }]);
                          setNewCollectionName("");
                          setIsAddingCollection(false);
                        }
                      }}
                    >
                      Agregar
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setIsAddingCollection(false)}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="tags" className={styles.label}>Etiquetas (Separadas por comas)</label>
              <input 
                id="tags" 
                type="text" 
                placeholder="Ej: lino, verano, elegante"
                className={styles.input}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <span className={styles.helperText}>Separar con comas facilitará la búsqueda.</span>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className={styles.colSide}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Multimedia</h2>
            
            <div className={styles.imageDropzone}>
              <div className={styles.dropzoneContent}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.dropIcon}>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p>Click para subir imágenes</p>
                <span>Formatos: JPG, PNG.</span>
              </div>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                title="Seleccionar imágenes del producto"
                className={styles.fileInput} 
                onChange={handleImageUpload}
                disabled={uploadProgress > 0}
              />
            </div>
            
            {uploadProgress > 0 && (
              <div className={styles.uploadProgressText}>
                Subiendo imágenes... espera por favor.
              </div>
            )}

            {images.length > 0 && (
              <div className={styles.previewGrid}>
                {images.map((publicId, index) => (
                  <div key={index} className={styles.previewCard}>
                    <img 
                      src={`https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/c_thumb,w_100,h_100/${publicId}`} 
                      alt={`Preview ${index}`} 
                    />
                    <button type="button" onClick={() => removeImage(index)} className={styles.btnRemoveImg}>X</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Visibilidad</h2>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="status" 
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                />
                <div className={styles.radioText}>
                  <strong>Activo</strong>
                  <span>Visible en catálogo.</span>
                </div>
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="status" 
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                />
                <div className={styles.radioText}>
                  <strong>Borrador</strong>
                  <span>No visible al público.</span>
                </div>
              </label>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
