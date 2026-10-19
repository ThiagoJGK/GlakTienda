'use server';

import { GoogleGenAI } from "@google/genai";
import { withAdminAuth } from "@/lib/supabase/actions-wrapper";

const ai = new GoogleGenAI({
  // Gets API key from process.env.GEMINI_API_KEY
});

export async function analyzeProductWithAI(imageUrls: string[]) {
  return withAdminAuth(async (_, imageUrls: string[]) => {
    if (!imageUrls || imageUrls.length === 0) {
      return { success: false, error: "No images provided for AI analysis." };
    }

    try {
      // Generate text content describing the request
      const promptText = `
      Eres un asistente experto en e-commerce y moda.
      Analiza este producto, detallando lo mejor que puedas basándote en la(s) imagen(es) provista(s) a continuación.
      Devuelve EXACTAMENTE un JSON con este formato y nada más, no uses markdown en tu respuesta, solo el objeto JSON crudo:
      {
        "name": "Nombre atractivo del producto (max 50 caracteres)",
        "description": "Una descripción breve persuasiva y detallada (materiales visibles, estilo, etc.)",
        "category": "Una de estas categorías estrictamente: Vestidos, Pantalones, Camisas, Accesorios, Abrigos",
        "fashionMetadata": {
          "material": "Material o materiales detectados (ej. Lino, Algodón, Denim, etc.)",
          "fit": "Ajuste/Corte de la prenda (ej. Ajustado, Oversized, Regular fit, etc.)",
          "style": "Estilo de la prenda (ej. Casual, Boho, Elegante, etc.)",
          "neckline_sleeve": "Escote y tipo de manga (ej. Escote V sin mangas, Cuello redondo manga corta, etc.)",
          "details": "Detalles o texturas clave (ej. Botones frontales, Bolsillo plaqué, Costuras visibles, etc.)",
          "careInstructions": "Instrucciones sugeridas de lavado/cuidado (ej. Lavar con agua fría, No usar secadora, etc.)"
        },
        "colors": [
          { "name": "Nombre del color detectado (Ej: Verde Oliva)", "hex": "Código hexadecimal del color (Ej: #606e47)" }
        ]
      }
      
      Imágenes del producto provistas como URLs a continuación:
      ${imageUrls.join('\n')}
      `;

      interface ImagePart {
        inlineData: {
          data: string;
          mimeType: string;
        };
      }
      interface TextPart {
        text: string;
      }
      type GeminiPart = TextPart | ImagePart;

      const parts: GeminiPart[] = [{ text: promptText }];

      // Fetch images and convert to base64
      for (const url of imageUrls) {
        try {
          const response = await fetch(url.replace('http:', 'https:'));
          if (!response.ok) continue;
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = response.headers.get('content-type') || 'image/jpeg';
          
          parts.push({
            inlineData: {
              data: buffer.toString('base64'),
              mimeType: mimeType
            }
          });
        } catch {
          console.error("Failed to fetch image for AI:", url);
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: parts as unknown as string
      });

      const output = response.text;
      
      // Attempt to parse JSON from the output, in case it returns with markdown block
      if (!output) {
         throw new Error("No output generated from AI");
       }
       
       const cleanedJson = output.replace(/```json/g, '').replace(/```/g, '').trim();
       const parsedData = JSON.parse(cleanedJson);
   
       return { 
         success: true, 
         data: parsedData 
       };
   
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze product with AI.";
      console.error("Error analyzing product with Gemini:", error);
      return { success: false, error: errorMessage };
    }
  })(imageUrls);
}

export async function analyzeVariantColorWithAI(imageUrls: string[]) {
  return withAdminAuth(async (_, imageUrls: string[]) => {
    if (!imageUrls || imageUrls.length === 0) {
      return { success: false, error: "No images provided for AI analysis." };
    }

    try {
      const promptText = `
      Eres un asistente experto en e-commerce y moda.
      Analiza esta variante de color de un producto basándote en la(s) imagen(es) provista(s) a continuación.
      Tu único objetivo es identificar y extraer el color específico de la prenda.
      Devuelve EXACTAMENTE un JSON con este formato y nada más, no uses markdown en tu respuesta, solo el objeto JSON crudo:
      {
        "colors": [
          { "name": "Nombre del color detectado (Ej: Ocre)", "hex": "Código hexadecimal del color (Ej: #c49a45)" }
        ]
      }
      
      Imágenes del producto provistas como URLs a continuación:
      ${imageUrls.join('\n')}
      `;

      interface ImagePart {
        inlineData: {
          data: string;
          mimeType: string;
        };
      }
      interface TextPart {
        text: string;
      }
      type GeminiPart = TextPart | ImagePart;

      const parts: GeminiPart[] = [{ text: promptText }];

      // Fetch images and convert to base64
      for (const url of imageUrls) {
        try {
          const response = await fetch(url.replace('http:', 'https:'));
          if (!response.ok) continue;
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = response.headers.get('content-type') || 'image/jpeg';
          
          parts.push({
            inlineData: {
              data: buffer.toString('base64'),
              mimeType: mimeType
            }
          });
        } catch {
          console.error("Failed to fetch image for AI:", url);
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: parts as unknown as string
      });

      const output = response.text;
      
      if (!output) {
         throw new Error("No output generated from AI");
       }
       
       const cleanedJson = output.replace(/```json/g, '').replace(/```/g, '').trim();
       const parsedData = JSON.parse(cleanedJson);
   
       return { 
         success: true, 
         data: parsedData 
       };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze variant with AI.";
      console.error("Error analyzing variant color with Gemini:", error);
      return { success: false, error: errorMessage };
    }
  })(imageUrls);
}

export async function extractSupplierSizeChartAction(
  imageSource: string,
  options?: {
    supplierName?: string;
    garmentCategory?: import('@/types/sizing').GarmentCategoryType;
    measurementMode?: import('@/types/sizing').MeasurementMode;
    fitType?: import('@/types/sizing').GarmentFitType;
    stretchLevel?: import('@/types/sizing').FabricStretchLevel;
  }
): Promise<import('@/lib/sizing/geminiSizeExtractor').ExtractAndTranslateChartResult> {
  return withAdminAuth(async () => {
    if (!imageSource) {
      return { success: false, error: 'No se proveyó imagen para analizar la tabla de talles.' };
    }

    try {
      const { buildSizeChartExtractionPrompt, parseAndTranslateGeminiChartResponse } = await import(
        '@/lib/sizing/geminiSizeExtractor'
      );
      const promptText = buildSizeChartExtractionPrompt(options?.garmentCategory);

      let base64Data = '';
      let mimeType = 'image/jpeg';

      if (imageSource.startsWith('data:')) {
        const parts = imageSource.split(';base64,');
        mimeType = parts[0].replace('data:', '') || 'image/jpeg';
        base64Data = parts[1] || '';
      } else {
        const res = await fetch(imageSource.replace('http:', 'https:'));
        if (!res.ok) {
          throw new Error(`Error descargando imagen de tabla: HTTP ${res.status}`);
        }
        const arrayBuf = await res.arrayBuffer();
        base64Data = Buffer.from(arrayBuf).toString('base64');
        mimeType = res.headers.get('content-type') || 'image/jpeg';
      }

      const contents: any[] = [
        { text: promptText },
        {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents,
      });

      const output = response.text;
      if (!output) {
        throw new Error('La IA no generó respuesta para la tabla de talles.');
      }

      const { extracted, translatedRows } = parseAndTranslateGeminiChartResponse(output, {
        garmentCategory: options?.garmentCategory,
        measurementMode: options?.measurementMode,
      });

      if (options?.supplierName) {
        extracted.supplierName = options.supplierName;
      }

      return {
        success: true,
        extracted,
        translatedRows,
      };
    } catch (err: any) {
      console.error('Error extrayendo tabla con Gemini Vision:', err);
      return { success: false, error: err?.message || 'Error extrayendo tabla de talles' };
    }
  })();
}

export async function listSupplierSizeProfilesAction(): Promise<{
  success: boolean;
  profiles?: import('@/types/sizing').SupplierSizeProfile[];
  error?: string;
}> {
  return withAdminAuth(async () => {
    try {
      const { createSupplierProfileRepository } = await import('@/lib/sizing/supplierProfileStore');
      const repo = createSupplierProfileRepository();
      const profiles = await repo.listProfiles();
      return { success: true, profiles };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error listando perfiles' };
    }
  })();
}

export async function saveSupplierSizeProfileAction(
  request: import('@/types/sizing').SupplierChartTranslationRequest & {
    id?: string;
    profileName?: string;
    sourceType?: 'ai_image' | 'manual_template';
  }
): Promise<{
  success: boolean;
  profile?: import('@/types/sizing').SupplierSizeProfile;
  error?: string;
}> {
  return withAdminAuth(async () => {
    try {
      const { buildSupplierSizeProfile, createSupplierProfileRepository } = await import(
        '@/lib/sizing/supplierProfileStore'
      );
      const profile = buildSupplierSizeProfile(request);
      const repo = createSupplierProfileRepository();
      const saved = await repo.saveProfile(profile);
      return { success: true, profile: saved };
    } catch (err: any) {
      console.error('Error guardando perfil de proveedor:', err);
      return { success: false, error: err?.message || 'Error guardando perfil' };
    }
  })();
}

export async function deleteSupplierSizeProfileAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return withAdminAuth(async () => {
    try {
      const { createSupplierProfileRepository } = await import('@/lib/sizing/supplierProfileStore');
      const repo = createSupplierProfileRepository();
      const ok = await repo.deleteProfile(id);
      return { success: ok };
    } catch (err: any) {
      console.error('Error eliminando perfil de proveedor:', err);
      return { success: false, error: err?.message || 'Error eliminando perfil' };
    }
  })();
}
