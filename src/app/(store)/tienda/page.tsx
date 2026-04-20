import styles from './page.module.css';
import ProductCard from '@/components/ui/ProductCard';
import { createClient } from '@/lib/supabase/server';
import TiendaFilters from './TiendaFilters';
import SortSelect from './SortSelect';
import { Suspense } from 'react';

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
  const activeCollection = params.collection || '';
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

  // Fetch all collections for the sidebar
  const { data: collections } = await supabase.from('collections').select('id, name, slug').order('name');
  const collectionList = collections || [];

  // If a collection is selected, fetch product IDs from the junction table
  if (activeCollection) {
    const selectedColl = collectionList.find(c => c.slug === activeCollection);
    if (selectedColl) {
      const { data: pivotData } = await supabase
        .from('product_collections')
        .select('product_id')
        .eq('collection_id', selectedColl.id);
      
      const productIds = pivotData?.map(row => row.product_id) || [];
      
      if (productIds.length > 0) {
        query = query.in('id', productIds);
      } else {
        // Force an empty result if the collection has no products
        query = query.in('id', ['00000000-0000-0000-0000-000000000000']);
      }
    }
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

        <div className={styles.layout}>
          {/* Sidebar Filters */}
          <Suspense fallback={<aside className={styles.sidebar} style={{opacity: 0.5}}>Cargando filtros...</aside>}>
            <TiendaFilters
              activeCategory={activeCategory}
              activeCollection={activeCollection}
              searchQuery={searchQuery}
              currentSort={sortBy}
              productCount={productList.length}
              collections={collectionList}
            />
          </Suspense>

          {/* Main Content Area */}
          <div className={styles.mainContent}>
            {/* Sort Bar */}
            <div className={styles.sortBar}>
              <span className={styles.count}>{productList.length} productos</span>
              <div className={styles.sortActions}>
                <form action="/tienda" method="get">
                  <input type="hidden" name="cat" value={activeCategory !== 'Todo' ? activeCategory : ''} />
                  <input type="hidden" name="collection" value={activeCollection} />
                  <input type="hidden" name="q" value={searchQuery} />
                  <SortSelect defaultValue={sortBy} />
                </form>
              </div>
            </div>

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
      </div>
    </div>
  );
}
