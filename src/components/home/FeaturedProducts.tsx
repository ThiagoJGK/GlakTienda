import ProductCard from '@/components/ui/ProductCard';
import SectionTitle from '@/components/ui/SectionTitle';
import styles from './FeaturedProducts.module.css';
import { createClient } from '@/lib/supabase/server';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";

function getProductImage(product: { images?: string[]; name: string }) {
  if (product.images && product.images.length > 0) {
    const img = product.images[0];
    if (img.startsWith('http')) return img;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_400,h_530,q_75/${img}`;
  }
  return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=530&fit=crop&q=75';
}

export default async function FeaturedProducts() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error("Error fetching featured products:", error);
  }

  const productList = products || [];

  // If no products from DB, show nothing
  if (productList.length === 0) return null;

  return (
    <section className={`section ${styles.section}`} id="featured-section">
      <div className="container">
        <SectionTitle
          title="Lo más elegido"
          editorial
          action={{ label: 'Ver todo', href: '/tienda' }}
        />
      </div>
      <div className={styles.scrollWrapper}>
        <div className={styles.scrollTrack}>
          {productList.map((product) => (
            <div key={product.id} className={styles.cardSlot}>
              <ProductCard
                name={product.name}
                price={product.price}
                image={getProductImage(product)}
                href={`/producto/${product.slug}`}
                category={product.category?.toUpperCase()}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
