'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCollectionsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, slug')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching collections:", error);
    return { success: false, data: [] };
  }
  return { success: true, data: data || [] };
}

export async function createProductAction(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string || null;
  const price = parseFloat(formData.get('price') as string) || 0;
  const stock = parseInt(formData.get('stock') as string) || 0;
  const category = formData.get('category') as string;
  const status = formData.get('status') as string;
  const tagsString = formData.get('tags') as string;
  
  const sizesRaw = formData.get('sizes') as string;
  const sizes = sizesRaw ? JSON.parse(sizesRaw) : [];
  
  // Extract images array (can be sent as stringified JSON from frontend)
  const imagesRaw = formData.get('images') as string;
  const images = imagesRaw ? JSON.parse(imagesRaw) : [];

  // Parse tags safely
  const tags = tagsString 
    ? tagsString.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  // Parse collections safely
  const collectionsRaw = formData.get('collections') as string;
  const collections = collectionsRaw ? JSON.parse(collectionsRaw) : [];

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
      sizes,
      category,
      tags,
      status,
      images,
    }])
    .select()
    .single();

  if (error || !data) {
    console.error("Error creating product:", error);
    return { success: false, error: error?.message || "Unknown error" };
  }

  // Handle Collections Pivot
  if (collections.length > 0) {
    const product_id = data.id;
    for (const coll of collections) {
      let collection_id = coll.id;

      // If it's a new collection created on the fly
      if (coll.id.startsWith("new_") || coll.id === "new") {
        const collSlug = coll.name
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        // Generate unique slug for new collection too
        const { count: cCount } = await supabase
          .from('collections')
          .select('id', { count: 'exact', head: true })
          .ilike('slug', `${collSlug}%`);
        const finalCollSlug = cCount && cCount > 0 ? `${collSlug}-${cCount + 1}` : collSlug;

        const { data: newColl, error: collErr } = await supabase
          .from('collections')
          .insert([{ name: coll.name, slug: finalCollSlug }])
          .select('id')
          .single();

        if (collErr || !newColl) {
          console.error("Error creating new collection:", collErr);
          continue; // Skip this one on failure
        }
        collection_id = newColl.id;
      }

      // Link product to collection
      await supabase
        .from('product_collections')
        .insert([{ product_id, collection_id }]);
    }
  }

  // Clear cache for product listings
  revalidatePath('/admin/productos');
  revalidatePath('/tienda');

  return { success: true, data };
}

export async function updateProductAction(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string || null;
  const price = parseFloat(formData.get('price') as string) || 0;
  const stock = parseInt(formData.get('stock') as string) || 0;
  const category = formData.get('category') as string;
  const status = formData.get('status') as string;
  const tagsString = formData.get('tags') as string;
  
  const sizesRaw = formData.get('sizes') as string;
  const sizes = sizesRaw ? JSON.parse(sizesRaw) : [];
  
  const imagesRaw = formData.get('images') as string;
  const images = imagesRaw ? JSON.parse(imagesRaw) : [];

  const tags = tagsString 
    ? tagsString.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const collectionsRaw = formData.get('collections') as string;
  const collections = collectionsRaw ? JSON.parse(collectionsRaw) : [];

  const { data, error } = await supabase
    .from('products')
    .update({
      name,
      description,
      price,
      stock,
      sizes,
      category,
      tags,
      status,
      images,
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating product:", error);
    return { success: false, error: error?.message || "Unknown error" };
  }

  // Handle Collections Pivot
  // First, remove existing links
  await supabase.from('product_collections').delete().eq('product_id', id);

  if (collections.length > 0) {
    const product_id = id;
    for (const coll of collections) {
      let collection_id = coll.id;

      if (coll.id.startsWith("new_") || coll.id === "new") {
        const collSlug = coll.name
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

        const { count: cCount } = await supabase
          .from('collections')
          .select('id', { count: 'exact', head: true })
          .ilike('slug', `${collSlug}%`);
        const finalCollSlug = cCount && cCount > 0 ? `${collSlug}-${cCount + 1}` : collSlug;

        const { data: newColl, error: collErr } = await supabase
          .from('collections')
          .insert([{ name: coll.name, slug: finalCollSlug }])
          .select('id')
          .single();

        if (!collErr && newColl) {
          collection_id = newColl.id;
        }
      }

      await supabase
        .from('product_collections')
        .insert([{ product_id, collection_id }]);
    }
  }

  revalidatePath('/admin/productos');
  revalidatePath('/tienda');
  revalidatePath(`/producto/${data.slug}`);

  return { success: true, data };
}

export async function getColorsAction() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('colors')
    .select('id, name, hex')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching colors:", error);
    return { success: false, data: [] };
  }
  return { success: true, data: data || [] };
}

export async function createColorAction(name: string, hex: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('colors')
    .insert([{ name, hex }])
    .select()
    .single();

  if (error || !data) {
    console.error("Error creating color:", error);
    return { success: false, error: error?.message || "Unknown error" };
  }
  return { success: true, data };
}
