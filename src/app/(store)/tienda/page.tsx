import styles from './page.module.css';
import ProductCard from '@/components/ui/ProductCard';
import { createClient } from '@/lib/supabase/server';
import TiendaFilters from './TiendaFilters';

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dpm4judv4";

function getProductImage(product: { images?: string[]; name: string }) {
  if (product.images && product.images.length > 0) {
    const img = product.images[0];
    if (img.startsWith('http')) return img;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,w_400,h_530,q_75/${img}`;
  }
  return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=530&fit=crop&q=75';
}

export const metadata = {
  title: 'Tienda',
  description: 'Explorá toda la colección de moda femenina Glak. Vestidos, camisas, pantalones y más.',
};

interface TiendaPageProps {
  searchParams: Promise<{ cat?: string; q?: string; sort?: string }>;
}

export default async function TiendaPage({ searchParams }: TiendaPageProps) {
  const params = await searchParams;
  const activeCategory = params.cat || 'Todo';
  const searchQuery = params.q || '';
  const sortBy = params.sort || 'relevantes';

  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('*')
    .eq('status', 'active');

  // Filter by category
  if (activeCategory && activeCategory !== 'Todo') {
    query = query.ilike('category', activeCategory);
  }

  // Search by name
  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  // Sort
  if (sortBy === 'menor-precio') {
    query = query.order('price', { ascending: true });
  } else if (sortBy === 'mayor-precio') {
    query = query.order('price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
  }

  const productList = products || [];

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            {searchQuery ? `Resultados: "${searchQuery}"` : 'Tienda'}
          </h1>
          <p className={styles.subtitle}>
            {searchQuery
              ? `${productList.length} producto${productList.length !== 1 ? 's' : ''} encontrado${productList.length !== 1 ? 's' : ''}`
              : 'Descubrí toda la colección Glak'}
          </p>
        </div>

        {/* Interactive Client Filters */}
        <TiendaFilters
          activeCategory={activeCategory}
          currentSort={sortBy}
          productCount={productList.length}
        />

        {/* Product grid */}
        {productList.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{searchQuery ? 'No encontramos productos con esa búsqueda.' : 'No hay productos disponibles todavía.'}</p>
            <span>{searchQuery ? 'Probá con otro término o explorá las categorías.' : 'Los productos publicados desde el panel de admin aparecerán aquí.'}</span>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {productList.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                price={product.price}
                image={getProductImage(product)}
                href={`/producto/${product.slug}`}
                category={product.category?.toUpperCase()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
