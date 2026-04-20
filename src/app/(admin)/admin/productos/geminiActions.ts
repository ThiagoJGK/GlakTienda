'use server';

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  // Gets API key from process.env.GEMINI_API_KEY
});

export async function analyzeProductWithAI(imageUrls: string[]) {
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
      "tags": "3 a 5 palabras clave separadas por comas"
    }
    
    Imágenes del producto provistas como URLs a continuación:
    ${imageUrls.join('\n')}
    `;

    // Note: To pass images correctly via URL if using typical models, Gemini can read image URLs in some clients, 
    // but typically it expects base64 or a File API object if the client doesn't natively fetch.
    // However, as a text prompt, providing the Cloudinary URLs works if the model can access public URLs, 
    // OR alternatively, we fetch them locally and provide base64 inline. 
    // To be perfectly safe, we'll fetch the images as base64 inline here.

    const parts = [{ text: promptText }];

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
        } as any); // Type cast due to sdk variance
      } catch (e) {
        console.error("Failed to fetch image for AI:", url);
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: parts as any
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

  } catch (error: any) {
    console.error("Error analyzing product with Gemini:", error);
    return { success: false, error: error?.message || "Failed to analyze product with AI." };
  }
}
