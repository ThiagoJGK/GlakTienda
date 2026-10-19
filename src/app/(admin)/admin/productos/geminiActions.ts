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
