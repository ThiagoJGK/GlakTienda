import { GoogleGenAI } from "@google/genai";

// Initialize the Google Gen AI client with the Gemini API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

/**
 * Generates the 768-dimension semantic embedding vector for a given string of text.
 * Uses the 'text-embedding-004' model.
 *
 * @param text - The textual content to embed.
 * @returns A promise that resolves to an array of 768 floats, or null if generation fails.
 */
export async function getEmbeddingForText(text: string): Promise<number[] | null> {
  if (!text || !text.trim()) {
    console.warn("getEmbeddingForText was called with empty or invalid text.");
    return null;
  }

  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });

    // Extract the vector values from the generated embeddings array
    if (response.embeddings?.[0]?.values) {
      return response.embeddings[0].values;
    }

    console.error("Gemini response did not contain embedding values:", response);
    return null;
  } catch (error) {
    console.error("Error generating embedding with Gemini text-embedding-004:", error);
    return null;
  }
}

/**
 * Compiles a rich semantic text representation of a product using its metadata.
 * This structured text is fed into the embedding model to represent the product style, category, and detail.
 *
 * @param product - Object containing product details.
 * @param product.name - The name of the product.
 * @param product.category - The category of the product (e.g., "Vestidos").
 * @param product.description - The product description.
 * @param product.tags - An optional array of tags or styles (e.g., ["lino", "premium"]).
 * @returns A single string that represents the product's features.
 */
export function compileProductTextForEmbedding(product: {
  name: string;
  category: string;
  description?: string | null;
  tags?: string[];
}): string {
  const nameClean = (product.name || "").trim();
  const catClean = (product.category || "").trim();
  const descClean = (product.description || "").trim();
  const tagsClean = Array.isArray(product.tags) 
    ? product.tags.map(t => t.trim()).filter(Boolean).join(", ")
    : "";

  return `Prenda: ${nameClean}. Categoría: ${catClean}. Detalles: ${descClean}. Estilos/Tags: ${tagsClean}.`.trim();
}
