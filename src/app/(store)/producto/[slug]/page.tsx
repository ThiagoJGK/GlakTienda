import styles from './page.module.css';
import ProductCard from '@/components/ui/ProductCard';
import ProductOptions from '@/components/ui/ProductOptions';
import { createPublicClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";

function resolveImageUrl(img: string) {
  if (img.startsWith('http')) return img;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_800,h_1200,q_80/${img}`;
}

function resolveThumbUrl(img: string) {
  if (img.startsWith('http')) return img;
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_400,h_530,q_75/${img}`;
}

// 1. Edge caching revalidation interval (1 hour)
export const revalidate = 3600;

// 2. Pre-render the top 20 most popular/recent active products
export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data: products } = await supabase
    .from('products')
    .select('slug')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  return products?.map((p) => ({ slug: p.slug })) || [];
}

// Dynamic SEO metadata for each product
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, description, category, images, standardized_images')
    .eq('slug', slug)
    .single();

  if (!product) return { title: 'Producto no encontrado' };

  const standardizedIds: string[] = (product.standardized_images || [])
    .map((si: any) => si.cloudinary_id)
    .filter(Boolean);
  const displayImages = standardizedIds.length > 0
    ? [...standardizedIds, ...(product.images || []).filter((img: string) => !standardizedIds.includes(img))]
    : product.images || [];

  const image = displayImages?.[0]
    ? resolveImageUrl(displayImages[0])
    : undefined;

  return {
    title: product.name,
    description: product.description || `${product.name} — Moda femenina en Glak. ${product.category || ''}`,
    openGraph: {
      title: `${product.name} | Glak`,
      description: product.description || `Descubrí ${product.name} en Glak`,
      images: image ? [{ url: image, width: 800, height: 1200 }] : [],
    },
  };
}

export default async function ProductoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !product) {
    notFound();
  }

  // Build display images: prioritize standardized, fallback to originals
  const standardizedIds: string[] = (product.standardized_images || [])
    .map((si: any) => si.cloudinary_id)
    .filter(Boolean);
  const displayImages = standardizedIds.length > 0
    ? [...standardizedIds, ...(product.images || []).filter((img: string) => !standardizedIds.includes(img))]
    : product.images || [];

  const displayProduct = { ...product, images: displayImages };

  // Fetch sibling products sharing the same parent design ID
  const parentId = product.parent_id || product.id;
  const { data: siblings } = await supabase
    .from('products')
    .select('id, name, slug, colors, images, sizes, price, description, category')
    .or(`parent_id.eq.${parentId},id.eq.${parentId}`)
    .eq('status', 'active');
  const productSiblings = siblings || [];

  // Fetch related products (same category, exclude current)
  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .neq('id', product.id)
    .limit(2);

  const relatedProducts = related || [];

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* Interactive gallery + options (Client Component) */}
        <ProductOptions
          initialProduct={displayProduct}
          siblings={productSiblings}
        >
          {/* Lookbook Contextual Shopping */}
          {relatedProducts.length > 0 && (
            <section className={styles.lookbookSection}>
              <h3 className={styles.lookbookTitle}>Completá el look</h3>
              <div className={styles.lookbookGrid}>
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    name={p.name}
                    price={p.price}
                    image={p.images?.[0] ? resolveThumbUrl(p.images[0]) : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=530&fit=crop&q=75'}
                    href={`/producto/${p.slug}`}
                    category={p.category?.toUpperCase()}
                  />
                ))}
              </div>
            </section>
          )}
        </ProductOptions>
      </div>
    </div>
  );
}
