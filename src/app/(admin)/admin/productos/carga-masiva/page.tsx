'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadingProduct } from './types';
import Phase1Selection from './Phase1Selection';
import Phase2Concurrent from './Phase2Concurrent';
import Phase3Review from './Phase3Review';
import { analyzeProductWithAI, analyzeVariantColorWithAI } from '../geminiActions';
import { getCollectionsAction, updateProductAction, upsertProductDraftAction, deleteProductDraftAction, getColorsAction, createColorAction } from '../actions';
import { ColorVariation } from '@/components/admin/ColorSizesSection';



const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";
const CLOUDINARY_UPLOAD_PRESET = "GlakTienda";
const LOCAL_STORAGE_KEY = 'glak_bulk_upload_progress_v2';
export const HISTORY_STORAGE_KEY = 'glak_bulk_upload_history';

export default function BulkUploadPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);

  // Client-side AI analysis concurrency queue
  const queueRef = useRef<{ productId: string; imageUrls: string[]; isSibling: boolean }[]>([]);
  const activeCountRef = useRef<number>(0);
  const [products, setProducts] = useState<UploadingProduct[]>([]);
  const [allCollections, setAllCollections] = useState<{id: string, name: string}[]>([]);
  const [globalColors, setGlobalColors] = useState<{id: string, name: string, hex: string}[]>([]);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<{phase: 1 | 2 | 3, products: UploadingProduct[]} | null>(null);

  // Supabase real-time draft status
  const [draftStatus, setDraftStatus] = useState<'unsaved' | 'saving' | 'saved' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Debounced auto-save effect to sync to Supabase
  useEffect(() => {
    if (!isClient || products.length === 0) return;

    setDraftStatus('unsaved');

    const saveDrafts = async () => {
      setDraftStatus('saving');
      try {
        let success = true;
        for (const p of products) {
          const res = await upsertProductDraftAction(p);
          if (!res.success) {
            success = false;
          }
        }
        if (success) {
          setDraftStatus('saved');
          setLastSavedAt(new Date());
        } else {
          setDraftStatus('error');
        }
      } catch (err) {
        console.error("Auto save draft error:", err);
        setDraftStatus('error');
      }
    };

    const timer = setTimeout(saveDrafts, 1500); // 1.5s debounce
    return () => clearTimeout(timer);
  }, [products, isClient]);

  const handleForceSaveDraft = async () => {
    if (products.length === 0) return;
    setDraftStatus('saving');
    try {
      let success = true;
      for (const p of products) {
        const res = await upsertProductDraftAction(p);
        if (!res.success) {
          success = false;
        }
      }
      if (success) {
        setDraftStatus('saved');
        setLastSavedAt(new Date());
      } else {
        setDraftStatus('error');
      }
    } catch (err) {
      console.error("Force save draft error:", err);
      setDraftStatus('error');
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setIsClient(true);
    }, 0);
    getCollectionsAction().then(res => {
      if (res.success && res.data) {
        setAllCollections(res.data);
      }
    });
    getColorsAction().then(res => {
      if (res.success && res.data) {
        setGlobalColors(res.data);
      }
    });

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.products && Array.isArray(parsed.products)) {
           // Strict validation to avoid "Objects are not valid as a React child" from corrupted states
            const isValid = parsed.products.every((p: UploadingProduct) => 
                typeof p.name === 'string' &&
                (!p.variations || p.variations.every((v) => typeof v.name === 'string'))
            );
            
            if (isValid && parsed.products.length > 0) {
              // Instead of forcefully auto-loading, we store it as a pending draft.
               setTimeout(() => {
                 setPendingDraft({ phase: (parsed.phase as 1 | 2 | 3) || 1, products: parsed.products });
               }, 0);
            } else if (!isValid) {
              console.warn("Corrupted bulk upload state detected. Clearing localStorage.");
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
        }
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      if (currentPhase > 1 && products.length === 0) {
         setTimeout(() => {
           setCurrentPhase(1); // Fix street-end if they delete all products in phase 2/3
         }, 0);
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

  const updateProductField = <K extends keyof UploadingProduct>(
    id: string,
    field: K,
    value: UploadingProduct[K]
  ) => {
    setProducts(prev => {
      const isParent = prev.some(p => p.id === id && !p.parentId);
      return prev.map(p => {
        if (p.id === id) {
          return { ...p, [field]: value };
        }
        // Cascade Price & Collection from parent to siblings automatically
        if (isParent && p.parentId === id && (field === 'price' || field === 'collections')) {
          return { ...p, [field]: value };
        }
        return p;
      });
    });
  };

  const processQueue = async () => {
    if (activeCountRef.current >= 2 || queueRef.current.length === 0) {
      return;
    }

    const nextTask = queueRef.current.shift();
    if (!nextTask) return;

    activeCountRef.current += 1;

    try {
      const { productId, imageUrls, isSibling } = nextTask;
      
      if (imageUrls.length === 0) {
        updateProductField(productId, 'aiStatus', 'error');
        activeCountRef.current -= 1;
        processQueue();
        return;
      }

      // IA Ingestion Optimization: Only analyze the leftmost representative image (index 0)
      const representativeImage = [imageUrls[0]];
      
      const aiResult = await analyzeProductWithAI(representativeImage);
      
      if (aiResult.success && aiResult.data) {
        // Fetch latest colors from DB if not loaded yet
        let colorsList = globalColors;
        if (colorsList.length === 0) {
          const colorsRes = await getColorsAction();
          if (colorsRes.success && colorsRes.data) {
            colorsList = colorsRes.data;
            setGlobalColors(colorsRes.data);
          }
        }

        interface AIDetectedColor {
          name: string;
          hex: string;
        }
        const detectedColors: AIDetectedColor[] = aiResult.data.colors || [];
        const matchedVariations: ColorVariation[] = [];

        for (const c of detectedColors) {
          const cName = c.name;
          const cHex = c.hex || '#ffffff';
          let match = colorsList.find(gc => gc.name.toLowerCase() === cName.toLowerCase());
          if (!match) {
            // No dictionary needed! Directly create the color with the name and hex returned by the AI
            const createRes = await createColorAction(cName, cHex);
            if (createRes.success && createRes.data) {
              match = createRes.data;
              setGlobalColors(prev => [...prev, createRes.data!]);
              colorsList = [...colorsList, createRes.data!];
            } else {
              // Fallback robusto en memoria si falla RLS o la creación en DB:
              match = {
                id: `temp_${cName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                name: cName,
                hex: cHex
              };
            }
          }

          if (match) {
            matchedVariations.push({
              colorId: match.id,
              name: match.name,
              hex: match.hex,
              sizes: []
            });
          }
        }

        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            const mappedVariations = matchedVariations.map(v => ({
              ...v,
              sizes: p.sizes.map(s => ({ name: s.name, stock: s.stock }))
            }));

            return {
              ...p,
              name: aiResult.data.name || p.name,
              description: aiResult.data.description || p.description,
              category: aiResult.data.category || p.category,
              tags: aiResult.data.tags || p.tags,
              variations: mappedVariations.length > 0 ? mappedVariations : p.variations,
              aiStatus: 'done'
            };
          }
          return p;
        }));
      } else {
        updateProductField(productId, 'aiStatus', 'error');
      }
    } catch (err) {
      console.error("AI Analysis error in queue:", err);
      updateProductField(nextTask.productId, 'aiStatus', 'error');
    } finally {
      activeCountRef.current -= 1;
      processQueue();
    }
  };

  const startAIAnalysis = (productId: string, imageUrls: string[], isSibling: boolean) => {
    updateProductField(productId, 'aiStatus', 'generating');
    
    // Safety check, don't ping AI if no images securely uploaded
    if (imageUrls.length === 0) {
      updateProductField(productId, 'aiStatus', 'error');
      return;
    }

    queueRef.current.push({ productId, imageUrls, isSibling });
    processQueue();
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
      sizes: [],
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
          uploadedUrls.push(data.secure_url); 
        }
      } catch (err) {
        console.error("Failed to upload to cloudinary", err);
      }
    }

    updateProductField(newId, 'imageUrls', uploadedUrls);
    updateProductField(newId, 'uploadStatus', uploadedUrls.length > 0 ? 'done' : 'error');
  };

  const handleAddSibling = (parentId: string) => {
    const parentProduct = products.find(p => p.id === parentId);
    if (!parentProduct) return;

    const newId = crypto.randomUUID();
    const newSibling: UploadingProduct = {
      id: newId,
      imageUrls: [],
      name: parentProduct.name,
      description: parentProduct.description,
      category: parentProduct.category,
      tags: parentProduct.tags,
      price: parentProduct.price,
      collections: parentProduct.collections,
      variations: [],
      sizes: [],
      aiStatus: 'idle',
      uploadStatus: 'idle',
      parentId: parentProduct.parentId || parentProduct.id
    };

    setProducts(prev => [...prev, newSibling]);
  };

  const handleAddFilesToProduct = async (productId: string, files: FileList) => {
    if (!files || files.length === 0) return;

    updateProductField(productId, 'uploadStatus', 'uploading');

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
          uploadedUrls.push(data.secure_url); 
        }
      } catch (err) {
        console.error("Failed to upload file to product", productId, err);
      }
    }

    const targetProduct = products.find(p => p.id === productId);
    const existingUrls = targetProduct ? targetProduct.imageUrls : [];
    const newUrls = [...existingUrls, ...uploadedUrls];

    updateProductField(productId, 'imageUrls', newUrls);
    updateProductField(productId, 'uploadStatus', newUrls.length > 0 ? 'done' : 'error');
    updateProductField(productId, 'aiStatus', newUrls.length > 0 ? 'idle' : 'error');
  };

  const handleRemoveProduct = async (id: string) => {
    // Remove from the pending concurrency queue if it's there
    queueRef.current = queueRef.current.filter(item => item.productId !== id);

    setProducts(prev => prev.filter(p => p.id !== id));
    try {
      await deleteProductDraftAction(id);
    } catch (e) {
      console.error("Failed to delete draft from DB:", e);
    }
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
    
          await updateProductAction(p.id, formData);
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
           onAddFiles={(files: FileList) => handleAddFiles(files)}
           onRemoveProduct={handleRemoveProduct}
           onProceed={() => {
             setCurrentPhase(2);
             products.forEach(p => {
               if (p.imageUrls.length > 0 && p.aiStatus === 'idle') {
                 const isSibling = !!p.parentId;
                 startAIAnalysis(p.id, p.imageUrls, isSibling);
               } else if (p.imageUrls.length === 0) {
                 updateProductField(p.id, 'aiStatus', 'error');
               }
             });
           }}
           updateProductField={updateProductField}
           draftStatus={draftStatus}
           onForceSaveDraft={handleForceSaveDraft}
           lastSavedAt={lastSavedAt}
           onAddSibling={handleAddSibling}
           onAddFilesToProduct={handleAddFilesToProduct}
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
           onSubmitAll={submitAll}
           isSubmittingAll={isSubmittingAll}
           onBack={() => setCurrentPhase(2)}
        />
      )}
    </>
  );
}
