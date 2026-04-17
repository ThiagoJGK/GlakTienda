'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProductAction(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string || null;
  const price = parseFloat(formData.get('price') as string) || 0;
  const stock = parseInt(formData.get('stock') as string) || 0;
  const category = formData.get('category') as string;
  const status = formData.get('status') as string;
  const tagsString = formData.get('tags') as string;
  
  // Extract images array (can be sent as stringified JSON from frontend)
  const imagesRaw = formData.get('images') as string;
  const images = imagesRaw ? JSON.parse(imagesRaw) : [];

  // Parse tags safely
  const tags = tagsString 
    ? tagsString.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  // Generate a basic slug
  const slug = name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace spaces and special chars with hyphens
    .replace(/(^-|-$)+/g, ''); // Trim hyphens

  // Verify slug uniqueness
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .ilike('slug', `${slug}%`);
  const finalSlug = count && count > 0 ? `${slug}-${count + 1}` : slug;

  const { data, error } = await supabase
    .from('products')
    .insert([{
      name,
      description,
      slug: finalSlug,
      price,
      stock,
      category,
      tags,
      status,
      images,
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    return { success: false, error: error.message };
  }

  // Clear cache for product listings
  revalidatePath('/admin/productos');
  revalidatePath('/tienda');

  return { success: true, data };
}
