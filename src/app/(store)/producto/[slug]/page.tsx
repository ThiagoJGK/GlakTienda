import styles from './page.module.css';
import ProductCard from '@/components/ui/ProductCard';
import ProductOptions from '@/components/ui/ProductOptions';
import { createClient } from '@/lib/supabase/server';
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

const defaultSizes = ['XS', 'S', 'M', 'L', 'XL'];
const defaultColors = [
  { name: 'Natural', hex: '#D4C5A9' },
  { name: 'Terracotta', hex: '#C27852' },
  { name: 'Oliva', hex: '#7A8450' },
];

// Dynamic SEO metadata for each product
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('products')
    .select('name, description, category, images')
    .eq('slug', slug)
    .single();

  if (!product) return { title: 'Producto no encontrado' };

  const image = product.images?.[0]
    ? resolveImageUrl(product.images[0])
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
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !product) {
    notFound();
  }

  // Fetch related products (same category, exclude current)
  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .neq('id', product.id)
    .limit(2);

  const relatedProducts = related || [];

  // Resolve images
  const productImages = product.images && product.images.length > 0
    ? product.images.map((img: string) => resolveImageUrl(img))
    : ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1200&fit=crop&q=80'];

  // Resolve sizes and colors
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : defaultSizes;
  const colors = product.colors && product.colors.length > 0 ? product.colors : defaultColors;

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* Interactive gallery + options (Client Component) */}
        <ProductOptions
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            slug: product.slug,
          }}
          images={productImages}
          sizes={sizes}
          colors={colors}
        />

        {/* Product info container */}
        <div className="container">
          <div className={styles.info}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={styles.productName}>{product.name}</h1>
                <span className={styles.brand}>{product.category || 'Glak Originals'}</span>
              </div>
              <span className={`${styles.price} font-editorial`}>
                ${product.price?.toLocaleString('es-AR')}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <div className={styles.description}>
                <p>{product.description}</p>
              </div>
            )}

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
          </div>
        </div>
      </div>
    </div>
  );
}
