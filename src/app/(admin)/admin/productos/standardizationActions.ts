'use server';

import { withAdminAuth } from "@/lib/supabase/actions-wrapper";
import { revalidatePath } from "next/cache";
import {
  PhotoPreset,
  PresetResult,
  StandardizedImage,
  getPreset,
  getPresetsForCategory,
  normalizeCategory,
} from "@/lib/photo-presets";
import {
  generatePhotoWithGemini,
  ImageQuality,
} from "@/lib/gemini/image-generator";
import { uploadBase64ToCloudinary } from "@/lib/cloudinary/server-upload";

export interface GenerateStandardizedPhotosParams {
  productId: string;
  originalImageUrl?: string;
  category?: string;
  quality?: ImageQuality;
  negativePrompt?: string;
  requestedPresets?: string[];
}

export interface RegenerateSinglePhotoParams {
  productId: string;
  jobId?: string;
  presetId: string;
  originalImageUrl?: string;
  category?: string;
  quality?: ImageQuality;
  negativePrompt: string;
}

/**
 * Helper to ensure a product image URL is fully qualified with HTTPS.
 */
function resolveSourceImageUrl(img: string): string {
  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img;
  }
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "dpm4judv4";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${img}`;
}

/**
 * 100% Cloud-Native Photo Standardization Server Action.
 * 
 * Replaces the local machine daemon by running multi-preset generation in parallel
 * directly on the cloud server using Gemini 3.1 Flash Image (Nano Banana 2) and
 * streaming assets to Cloudinary.
 * 
 * @param params - Generation configuration parameters
 * @returns Result object containing job ID, generated photos, and status
 */
export async function generateStandardizedPhotosCloudAction(
  params: GenerateStandardizedPhotosParams
) {
  return withAdminAuth(
    async ({ supabase }, params: GenerateStandardizedPhotosParams) => {
      const {
        productId,
        quality = '2k',
        negativePrompt,
        requestedPresets,
      } = params;

      // 1. Fetch the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, slug, category, images')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return { success: false, error: "Producto no encontrado." };
      }

      // 2. Resolve source image
      const sourceImages: string[] = product.images || [];
      const rawImageUrl = params.originalImageUrl || sourceImages[0];
      if (!rawImageUrl) {
        return {
          success: false,
          error: "El producto no tiene fotos originales para estandarizar.",
        };
      }

      const fullSourceUrl = resolveSourceImageUrl(rawImageUrl);

      // 3. Resolve presets (category-based if not explicitly passed)
      const category = params.category || product.category;
      const categoryPresets = getPresetsForCategory(category);

      let presetsToGenerate: PhotoPreset[] = [];
      if (requestedPresets && requestedPresets.length > 0) {
        presetsToGenerate = requestedPresets
          .map((id) => getPreset(id) || categoryPresets.find((p) => p.id === id))
          .filter(Boolean) as PhotoPreset[];
      }

      if (presetsToGenerate.length === 0) {
        presetsToGenerate = categoryPresets;
      }

      if (presetsToGenerate.length === 0) {
        return {
          success: false,
          error: "No se seleccionaron presets de fotografía válidos.",
        };
      }

      // 4. Create record in photo_standardization_jobs
      const { data: job, error: jobError } = await supabase
        .from('photo_standardization_jobs')
        .insert({
          product_id: productId,
          source_images: [fullSourceUrl],
          requested_presets: presetsToGenerate.map((p) => p.id),
          status: 'processing',
          started_at: new Date().toISOString(),
          results: [],
        })
        .select('id')
        .single();

      if (jobError || !job) {
        console.error("Error creating standardization job record:", jobError);
        return {
          success: false,
          error: "Error al registrar el trabajo de estandarización en la base de datos.",
        };
      }

      // 5. Download original source image buffer
      let sourceBase64 = '';
      let sourceMimeType = 'image/jpeg';
      try {
        const imgRes = await fetch(fullSourceUrl);
        if (!imgRes.ok) {
          throw new Error(`HTTP ${imgRes.status} al descargar imagen original: ${fullSourceUrl}`);
        }
        const arrayBuffer = await imgRes.arrayBuffer();
        sourceBase64 = Buffer.from(arrayBuffer).toString('base64');
        sourceMimeType = imgRes.headers.get('content-type') || 'image/jpeg';
      } catch (downloadErr: any) {
        await supabase
          .from('photo_standardization_jobs')
          .update({ status: 'failed', error_message: downloadErr?.message })
          .eq('id', job.id);
        return {
          success: false,
          error: `Error descargando imagen original: ${downloadErr.message}`,
        };
      }

      // 6. Concurrently generate and upload each preset using Promise.allSettled
      const generationTasks = presetsToGenerate.map(
        async (preset): Promise<PresetResult> => {
          try {
            // Step A: Generate image with Google GenAI (Nano Banana 2)
            const genResult = await generatePhotoWithGemini({
              preset,
              sourceImageBase64: sourceBase64,
              sourceMimeType,
              quality,
              negativePrompt,
            });

            // Step B: Upload directly to Cloudinary products/standardized folder
            const filename = `${product.slug || product.id}-${preset.id}-${Date.now()}`;
            const uploadResult = await uploadBase64ToCloudinary(
              genResult.base64Data,
              genResult.mimeType,
              {
                folder: 'products/standardized',
                publicId: filename,
                tags: [
                  'glak',
                  'standardized',
                  normalizeCategory(category),
                  preset.id,
                ],
              }
            );

            return {
              preset: preset.id,
              cloudinary_id: uploadResult.public_id,
              url: uploadResult.secure_url,
              status: 'completed',
            };
          } catch (err: any) {
            console.error(`Error procesando preset ${preset.id}:`, err);
            return {
              preset: preset.id,
              cloudinary_id: '',
              status: 'failed',
              error: err?.message || 'Error desconocido durante la generación',
            };
          }
        }
      );

      const settledResults = await Promise.allSettled(generationTasks);
      const results: PresetResult[] = settledResults.map((r, index) => {
        if (r.status === 'fulfilled') {
          return r.value;
        }
        return {
          preset: presetsToGenerate[index]?.id || 'unknown',
          cloudinary_id: '',
          status: 'failed',
          error: r.reason?.message || 'Promesa rechazada durante la generación',
        };
      });

      const completedCount = results.filter((r) => r.status === 'completed').length;
      const finalStatus =
        completedCount === results.length
          ? 'completed'
          : completedCount > 0
          ? 'partial'
          : 'failed';

      // 7. Update job record in Supabase
      await supabase
        .from('photo_standardization_jobs')
        .update({
          status: finalStatus,
          results: results,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // 8. Revalidate routes
      revalidatePath('/admin/productos/estandarizar');
      revalidatePath(`/admin/productos/estandarizar/${productId}`);

      return {
        success: finalStatus !== 'failed',
        jobId: job.id,
        photos: results,
      };
    }
  )(params);
}

/**
 * Regenerates a single photo within a job, applying custom negative prompt feedback.
 * Useful for 1-click iterative refinement when an admin wants to correct specific artifacts.
 * 
 * @param params - Single photo regeneration parameters
 * @returns Result object with updated photo details
 */
export async function regenerateSinglePhotoAction(
  params: RegenerateSinglePhotoParams
) {
  return withAdminAuth(
    async ({ supabase }, params: RegenerateSinglePhotoParams) => {
      const {
        productId,
        jobId,
        presetId,
        quality = '2k',
        negativePrompt,
      } = params;

      // 1. Fetch product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, slug, category, images')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return { success: false, error: "Producto no encontrado." };
      }

      // 2. Resolve source image
      const rawImageUrl = params.originalImageUrl || product.images?.[0];
      if (!rawImageUrl) {
        return { success: false, error: "No hay foto original para regenerar." };
      }

      const fullSourceUrl = resolveSourceImageUrl(rawImageUrl);

      // 3. Resolve preset
      const category = params.category || product.category;
      const allPresets = getPresetsForCategory(category);
      const preset = getPreset(presetId) || allPresets.find((p) => p.id === presetId);

      if (!preset) {
        return {
          success: false,
          error: `Preset "${presetId}" no encontrado en el catálogo de presets.`,
        };
      }

      // 4. Download original source image
      let sourceBase64 = '';
      let sourceMimeType = 'image/jpeg';
      try {
        const imgRes = await fetch(fullSourceUrl);
        if (!imgRes.ok) {
          throw new Error(`HTTP ${imgRes.status} al descargar imagen original`);
        }
        const arrayBuffer = await imgRes.arrayBuffer();
        sourceBase64 = Buffer.from(arrayBuffer).toString('base64');
        sourceMimeType = imgRes.headers.get('content-type') || 'image/jpeg';
      } catch (downloadErr: any) {
        return {
          success: false,
          error: `Error descargando imagen original: ${downloadErr.message}`,
        };
      }

      // 5. Generate photo with Gemini applying negative prompt
      const genResult = await generatePhotoWithGemini({
        preset,
        sourceImageBase64: sourceBase64,
        sourceMimeType,
        quality,
        negativePrompt,
      });

      // 6. Upload regenerated photo to Cloudinary
      const filename = `${product.slug || product.id}-${preset.id}-${Date.now()}`;
      const uploadResult = await uploadBase64ToCloudinary(
        genResult.base64Data,
        genResult.mimeType,
        {
          folder: 'products/standardized',
          publicId: filename,
          tags: [
            'glak',
            'standardized',
            'regenerated',
            normalizeCategory(category),
            preset.id,
          ],
        }
      );

      const newResult: PresetResult = {
        preset: preset.id,
        cloudinary_id: uploadResult.public_id,
        url: uploadResult.secure_url,
        status: 'completed',
      };

      // 7. If jobId provided, update the specific preset in the results array
      if (jobId) {
        const { data: job } = await supabase
          .from('photo_standardization_jobs')
          .select('results')
          .eq('id', jobId)
          .single();

        if (job) {
          const currentResults: PresetResult[] = job.results || [];
          const filtered = currentResults.filter((r) => r.preset !== presetId);
          filtered.push(newResult);

          await supabase
            .from('photo_standardization_jobs')
            .update({ results: filtered })
            .eq('id', jobId);
        }
      }

      // 8. Revalidate routes
      revalidatePath(`/admin/productos/estandarizar/${productId}`);

      return {
        success: true,
        photo: newResult,
      };
    }
  )(params);
}

/**
 * Creates a new photo standardization job for a product (daemon fallback/legacy).
 * @param productId - The ID of the product
 * @param presetIds - Array of requested preset IDs
 * @returns Result object with jobId or error message
 */
export async function createStandardizationJob(productId: string, presetIds: string[]) {
  return withAdminAuth(async ({ supabase }, productId: string, presetIds: string[]) => {
    // 1. Fetch the product to get its current images
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('images')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error("Error fetching product images for job:", productError);
      return { success: false, error: "Product not found or has no images." };
    }

    const sourceImages = product.images || [];

    if (sourceImages.length === 0) {
      return { success: false, error: "Product has no source images to standardize." };
    }

    // 2. Create the job
    const { data: job, error: jobError } = await supabase
      .from('photo_standardization_jobs')
      .insert({
        product_id: productId,
        source_images: sourceImages,
        requested_presets: presetIds,
        status: 'pending',
        results: []
      })
      .select('id')
      .single();

    if (jobError || !job) {
      console.error("Error creating standardization job:", jobError);
      return { success: false, error: jobError?.message || "Unknown error creating job" };
    }

    return { success: true, jobId: job.id };
  })(productId, presetIds);
}

/**
 * Retrieves all standardization jobs for a specific product.
 * @param productId - The ID of the product
 * @returns Result object with array of jobs
 */
export async function getProductStandardizationJobs(productId: string) {
  return withAdminAuth(async ({ supabase }, productId: string) => {
    const { data, error } = await supabase
      .from('photo_standardization_jobs')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  })(productId);
}

/**
 * Gets the current status and results of a single job.
 * @param jobId - The ID of the job
 * @returns Result object with job details
 */
export async function getJobStatus(jobId: string) {
  return withAdminAuth(async ({ supabase }, jobId: string) => {
    const { data, error } = await supabase
      .from('photo_standardization_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error("Error fetching job status:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  })(jobId);
}

/**
 * Approves a generated photo and appends it to the product's standardized images.
 * @param jobId - The ID of the job containing the result
 * @param presetId - The preset ID of the generated photo to approve
 * @returns Result object indicating success or failure
 */
export async function approveGeneratedPhoto(jobId: string, presetId: string) {
  return withAdminAuth(async ({ supabase }, jobId: string, presetId: string) => {
    // 1. Get the job to extract the specific result
    const { data: job, error: jobError } = await supabase
      .from('photo_standardization_jobs')
      .select('product_id, results')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error("Error fetching job for approval:", jobError);
      return { success: false, error: "Job not found." };
    }

    const results: PresetResult[] = job.results || [];
    const targetResult = results.find((r) => r.preset === presetId && r.status === 'completed');

    if (!targetResult || !targetResult.cloudinary_id) {
      return { success: false, error: "Result not found or not completed." };
    }

    // 2. Fetch the product to update its standardized_images array
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('standardized_images, slug')
      .eq('id', job.product_id)
      .single();

    if (productError || !product) {
      console.error("Error fetching product for approval:", productError);
      return { success: false, error: "Product not found." };
    }

    const currentImages: StandardizedImage[] = product.standardized_images || [];
    
    // Check if we already approved this preset (update existing or append)
    const existingIndex = currentImages.findIndex((img) => img.preset === presetId);
    
    const newImage: StandardizedImage = {
      preset: presetId,
      cloudinary_id: targetResult.cloudinary_id,
      approved_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      currentImages[existingIndex] = newImage;
    } else {
      currentImages.push(newImage);
    }

    // 3. Update the product
    const { error: updateError } = await supabase
      .from('products')
      .update({ standardized_images: currentImages })
      .eq('id', job.product_id);

    if (updateError) {
      console.error("Error updating product standardized images:", updateError);
      return { success: false, error: "Failed to save approved image." };
    }

    // 4. Clear caches
    revalidatePath('/admin/productos');
    if (product.slug) {
      revalidatePath(`/producto/${product.slug}`);
    }

    return { success: true };
  })(jobId, presetId);
}

/**
 * Rejects a generated photo by removing it from the job's results.
 * @param jobId - The ID of the job containing the result
 * @param presetId - The preset ID of the generated photo to reject
 * @returns Result object indicating success or failure
 */
export async function rejectGeneratedPhoto(jobId: string, presetId: string) {
  return withAdminAuth(async ({ supabase }, jobId: string, presetId: string) => {
    // 1. Get the job to modify its results
    const { data: job, error: jobError } = await supabase
      .from('photo_standardization_jobs')
      .select('results')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error("Error fetching job for rejection:", jobError);
      return { success: false, error: "Job not found." };
    }

    const results: PresetResult[] = job.results || [];
    const updatedResults = results.filter((r) => r.preset !== presetId);

    // 2. Update the job
    const { error: updateError } = await supabase
      .from('photo_standardization_jobs')
      .update({ results: updatedResults })
      .eq('id', jobId);

    if (updateError) {
      console.error("Error updating job results:", updateError);
      return { success: false, error: "Failed to reject image." };
    }

    return { success: true };
  })(jobId, presetId);
}

/**
 * Retries a failed standardization job by resetting its status.
 * @param jobId - The ID of the job to retry
 * @returns Result object indicating success or failure
 */
export async function retryStandardizationJob(jobId: string) {
  return withAdminAuth(async ({ supabase }, jobId: string) => {
    const { error } = await supabase
      .from('photo_standardization_jobs')
      .update({
        status: 'pending',
        error_message: null,
        started_at: null,
        completed_at: null
      })
      .eq('id', jobId);

    if (error) {
      console.error("Error retrying job:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  })(jobId);
}
