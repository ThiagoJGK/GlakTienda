'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadingProduct } from './types';
import Phase1Selection from './Phase1Selection';
import Phase2Concurrent from './Phase2Concurrent';
import Phase3Review from './Phase3Review';
import { analyzeProductWithAI } from '../geminiActions';
import { createProductAction, getCollectionsAction } from '../actions';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";
const CLOUDINARY_UPLOAD_PRESET = "GlakTienda";
const LOCAL_STORAGE_KEY = 'glak_bulk_upload_progress_v2';
export const HISTORY_STORAGE_KEY = 'glak_bulk_upload_history';

export default function BulkUploadPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);
  const [products, setProducts] = useState<UploadingProduct[]>([]);
  const [allCollections, setAllCollections] = useState<{id: string, name: string}[]>([]);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<{phase: number, products: UploadingProduct[]} | null>(null);

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
        const parsed = JSON.parse(saved);
        if (parsed && parsed.products && Array.isArray(parsed.products)) {
           // Strict validation to avoid "Objects are not valid as a React child" from corrupted states
           const isValid = parsed.products.every((p: any) => 
               typeof p.name === 'string' &&
               (!p.variations || p.variations.every((v:any) => typeof v.name === 'string'))
           );
           
           if (isValid && parsed.products.length > 0) {
             // Instead of forcefully auto-loading, we store it as a pending draft.
             setPendingDraft({ phase: parsed.phase || 1, products: parsed.products });
           } else if (!isValid) {
             console.warn("Corrupted bulk upload state detected. Clearing localStorage.");
             localStorage.removeItem(LOCAL_STORAGE_KEY);
           }
        }
      } catch (e) {
        console.error("Local storage err", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      if (currentPhase > 1 && products.length === 0) {
         setCurrentPhase(1); // Fix street-end if they delete all products in phase 2/3
      } else if (products.length > 0) {
         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ phase: currentPhase, products }));
      }
    }
  }, [products, currentPhase, isClient]);

  const resumeDraft = () => {
    if (pendingDraft) {
       setProducts(pendingDraft.products);
       setCurrentPhase(pendingDraft.phase);
       setPendingDraft(null);
    }
  };

  const discardDraft = () => {
    setPendingDraft(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const updateProductField = (id: string, field: keyof UploadingProduct, value: any) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const startAIAnalysis = async (productId: string, imageUrls: string[]) => {
    updateProductField(productId, 'aiStatus', 'generating');
    
    // Safety check, don't ping AI if no images securely uploaded
    if (imageUrls.length === 0) {
      updateProductField(productId, 'aiStatus', 'error');
      return;
    }

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
      updateProductField(productId, 'aiStatus', 'error');
    }
  };

  const handleAddFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;

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
          // Guardamos public_id para el formato del backend final y secure_url para mostrar ahora
          // Standard form uses public_id string array, so we store public_id
          // Actually, our UI preview uses full URL in Phase 1 and 2, but standard form saves public_id.
          // Wait, the standard view in `Phase3Review` and `Phase1` uses `<img src={url} />`!
          // So we MUST store the full secure_url here, and parse it back to public_id on submit.
          uploadedUrls.push(data.secure_url); 
        }
      } catch (err) {
        console.error("Failed to upload to cloudinary", err);
      }
    }

    updateProductField(newId, 'imageUrls', uploadedUrls);
    updateProductField(newId, 'uploadStatus', uploadedUrls.length > 0 ? 'done' : 'error');

    if (uploadedUrls.length > 0) {
      startAIAnalysis(newId, uploadedUrls);
    } else {
      updateProductField(newId, 'aiStatus', 'error');
    }
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const submitAll = async (publishStatus: 'active' | 'draft' = 'active') => {
    if (products.length === 0) return;
    setIsSubmittingAll(true);

    for (const p of products) {
      try {
          const publicIds = p.imageUrls.map(url => {
            const parts = url.split('/');
            const last = parts[parts.length - 1];
            return last.split('.')[0]; 
          });
    
          const totalStock = p.variations.reduce((acc, v) => 
            acc + v.sizes.reduce((sum, s) => sum + (Number(s.stock) || 0), 0)
          , 0);
    
          const formData = new FormData();
          formData.append("name", p.name || "Producto sin nombre");
          formData.append("description", p.description);
          formData.append("price", p.price || "0");
          formData.append("stock", totalStock.toString());
          formData.append("sizes", JSON.stringify(p.variations));
          formData.append("category", p.category || "General");
          formData.append("tags", p.tags);
          formData.append("status", publishStatus);
          formData.append("images", JSON.stringify(publicIds));
          formData.append("collections", JSON.stringify(p.collections));
    
          await createProductAction(formData);
      } catch (e) {
          console.error("Failed to upload product", p.id, e);
          // Omit error breaking loop, let it try the rest for now. 
          // Ideal: stop and show which ones failed.
      }
    }

    // Save success history
    const historyEntry = {
       id: crypto.randomUUID(),
       date: new Date().toISOString(),
       count: products.length,
       status: publishStatus
    };
    const prevHistory = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([historyEntry, ...prevHistory].slice(0, 10)));

    setIsSubmittingAll(false);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    router.push('/admin/productos');
  };

  if (!isClient) return null;

  return (
    <>
      {currentPhase === 1 && (
        <Phase1Selection 
           products={products}
           pendingDraft={pendingDraft}
           onResumeDraft={resumeDraft}
           onDiscardDraft={discardDraft}
           onAddFiles={handleAddFiles}
           onRemoveProduct={handleRemoveProduct}
           onProceed={() => setCurrentPhase(2)}
        />
      )}
      
      {currentPhase === 2 && (
        <Phase2Concurrent 
           products={products}
           updateProductField={updateProductField}
           allCollections={allCollections}
           onProceed={() => setCurrentPhase(3)}
           onRemoveProduct={handleRemoveProduct}
        />
      )}

      {currentPhase === 3 && (
        <Phase3Review 
           products={products}
           updateProductField={updateProductField}
           allCollections={allCollections}
           onSubmitAll={submitAll}
           isSubmittingAll={isSubmittingAll}
           onBack={() => setCurrentPhase(2)}
        />
      )}
    </>
  );
}
