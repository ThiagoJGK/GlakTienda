'use client';

import Link from "next/link";
import { useState, useRef } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import { createProductAction } from "../actions";

// Use the user's provided cloud name
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";

export default function CreateProductPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("draft");

  // Cloudinary States
  const [images, setImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPreset, setUploadPreset] = useState("GlakTienda"); // User confirmed preset

  // Handler for Cloudinary Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!uploadPreset) {
      alert("⚠️ Atención Desarrollador: Debes crear un 'Upload Preset' tipo 'Unsigned' en tu panel de Cloudinary y pegarlo en el campo inferior izquierdo para subir fotos.");
      return;
    }

    setUploadProgress(10);
    const uploadedUrls: string[] = [];

    // Loop through files and upload
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        
        if (data.secure_url) {
          // Store only the path part for compatibility with our utils (or the full URL)
          // `data.public_id` is ideal for Cloudinary component transformations
          uploadedUrls.push(data.public_id);
        } else {
          console.error("Cloudinary upload failed", data);
          alert("Error subiendo imagen: " + (data.error?.message || "Error desconocido"));
        }
      } catch (err) {
        console.error(err);
      }
    }

    setImages(prev => [...prev, ...uploadedUrls]);
    setUploadProgress(0);
    
    // Reset file input
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
    formData.append("stock", stock);
    formData.append("category", category);
    formData.append("tags", tags);
    formData.append("status", status);
    formData.append("images", JSON.stringify(images)); // Pass images array as JSON

    try {
      const result = await createProductAction(formData);
      
      if (result.success) {
        router.push("/admin/productos");
      } else {
        setErrorObj(result.error || "Falló la creación del producto.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorObj("Ocurrió un error inesperado de conexión.");
      setIsSubmitting(false);
    }
  };

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
            <h1 className={styles.title}>Nuevo Producto</h1>
            <p className={styles.subtitle}>Agrega un artículo al catálogo.</p>
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
            {isSubmitting ? 'Publicando...' : 'Publicar Producto'}
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
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Información Básica</h2>
            
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

            <div className={styles.row}>
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
              <div className={styles.inputGroup}>
                <label htmlFor="stock" className={styles.label}>Stock (unidades)</label>
                <input 
                  id="stock" 
                  type="number" 
                  placeholder="0"
                  className={styles.input}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
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
                </select>
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

          <section className={`${styles.card} ${styles.setupCard}`}>
            <h2 className={styles.cardTitle}>🔑 Configuración de Cloudinary (Dev)</h2>
            <div className={styles.inputGroup}>
              <label htmlFor="preset" className={styles.label}>Cloudinary "Upload Preset" (Unsigned)</label>
              <input 
                id="preset" 
                type="text" 
                placeholder="ej: ml_default"
                className={styles.input}
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
              />
              <span className={styles.helperText}>
                Para poder subir fotos a <strong>GlakTienda</strong> desde acá, debes crear un Upload Preset en modo Unsigned en tu cuenta de Cloudinary.
              </span>
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
                <span>Usará Cloudinary ({CLOUDINARY_CLOUD_NAME})</span>
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
                    {/* Render thumbnail using Cloudinary specific URL structure */}
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
