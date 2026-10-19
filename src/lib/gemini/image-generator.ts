/**
 * Gemini Image API Cloud Generator
 * 
 * Direct cloud-native photo generation engine using @google/genai.
 * Executes on Next.js backend and Cloudflare Workers Edge without local daemons.
 * 
 * - Primary model: gemini-3.1-flash-image (Nano Banana 2) with responseModalities: ["IMAGE"]
 * - Fallback model: imagen-3.0-generate-002 with generateImages
 * - Quality / resolution mapping: 1080p -> 1K, 2k -> 2K, 4k -> 4K
 * 
 * @module gemini/image-generator
 */

import { GoogleGenAI } from "@google/genai";
import { PhotoPreset } from "@/lib/photo-presets";

export type ImageQuality = '1080p' | '2k' | '4k';

export interface GenerateGeminiImageParams {
  /** Target photography preset specification */
  preset: PhotoPreset;
  /** Base64 string of original product photo (without data URI prefix) */
  sourceImageBase64: string;
  /** Mime type of original product photo (default: 'image/jpeg') */
  sourceMimeType?: string;
  /** Target image resolution tier ('1080p' | '2k' | '4k') */
  quality?: ImageQuality;
  /** Admin-provided negative prompt or corrective feedback */
  negativePrompt?: string;
}

export interface GeneratedGeminiImageResult {
  /** Generated image in base64 */
  base64Data: string;
  /** Mime type of generated image */
  mimeType: string;
}

export const QUALITY_MAP: Record<ImageQuality, '1K' | '2K' | '4K'> = {
  '1080p': '1K',
  '2k': '2K',
  '4k': '4K',
};

/**
 * Builds an adversarial prompt with negative constraints and strict garment identity preservation.
 */
function buildEnhancedPrompt(preset: PhotoPreset, negativePrompt?: string): string {
  const parts: string[] = [preset.prompt];

  parts.push(
    "ESSENTIAL DIRECTIVE: Preserve the EXACT physical garment seen in the reference image. Do not change colors, patterns, button types, seams, or textures. High-end fashion catalog fidelity."
  );

  if (negativePrompt && negativePrompt.trim()) {
    parts.push(
      `CORRECTIVE FEEDBACK & NEGATIVE RESTRICTIONS: Strict instructions to avoid: ${negativePrompt.trim()}. Do not include any of these undesired artifacts.`
    );
  }

  parts.push(
    "NEGATIVE PROMPT: blurry, oversaturated, altered original buttons, deformed seams, inconsistent fabric print, distorted anatomy, messy background clutter, text overlays, watermarks, bad composition."
  );

  return parts.join("\n\n");
}

/**
 * Generates a standardized product photo using Google GenAI.
 * Tries Nano Banana 2 (gemini-3.1-flash-image) first, falling back to Imagen 3 if necessary.
 * 
 * @param params - Generation configuration parameters
 * @returns Promise with generated base64 image data and mime type
 */
export async function generatePhotoWithGemini(
  params: GenerateGeminiImageParams
): Promise<GeneratedGeminiImageResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada en las variables de entorno.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const {
    preset,
    sourceImageBase64,
    sourceMimeType = "image/jpeg",
    quality = "2k",
    negativePrompt,
  } = params;

  // Clean data URI prefix if present
  const cleanBase64 = sourceImageBase64.replace(/^data:image\/\w+;base64,/, '');
  const promptText = buildEnhancedPrompt(preset, negativePrompt);
  const targetResolution = QUALITY_MAP[quality] || '2K';

  // --- Primary Attempt: Gemini 3.1 Flash Image (Nano Banana 2) ---
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: sourceMimeType,
              },
            },
            {
              text: `${promptText}\n\nTarget resolution quality: ${targetResolution}. Aspect ratio: ${preset.aspectRatio}.`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ["IMAGE"],
      },
    });

    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.data);

    if (imagePart && (imagePart as any).inlineData?.data) {
      return {
        base64Data: (imagePart as any).inlineData.data,
        mimeType: (imagePart as any).inlineData.mimeType || "image/jpeg",
      };
    }
  } catch (geminiError: any) {
    console.warn(
      "Primary Gemini 3.1 Flash Image generation encountered an issue, trying Imagen 3 fallback:",
      geminiError?.message || geminiError
    );
  }

  // --- Fallback Attempt: Imagen 3 (imagen-3.0-generate-002) ---
  try {
    const imagenResponse = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: promptText,
      config: {
        numberOfImages: 1,
        aspectRatio: preset.aspectRatio,
        negativePrompt: negativePrompt || "blurry, low quality, altered colors, unnatural drape, bad seams",
        outputMimeType: "image/jpeg",
      },
    });

    const generatedImage = imagenResponse.generatedImages?.[0]?.image?.imageBytes;
    if (generatedImage) {
      return {
        base64Data: generatedImage,
        mimeType: "image/jpeg",
      };
    }
  } catch (imagenError: any) {
    console.error("Imagen 3 fallback also failed:", imagenError?.message || imagenError);
    throw new Error(`Error en la generación de imagen con Google GenAI: ${imagenError?.message || 'Fallo de API'}`);
  }

  throw new Error("No se recibió ninguna imagen generada desde la API de Google GenAI.");
}
