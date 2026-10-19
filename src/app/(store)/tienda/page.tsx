import styles from './page.module.css';
import { createClient } from '@/lib/supabase/server';
import TiendaCatalog from './TiendaCatalog';
import { getEmbeddingForText } from '@/lib/gemini/embeddings';
import { Suspense } from 'react';
import FilterSkeleton from './FilterSkeleton';
import ProductGridSkeleton from '@/components/ui/ProductGridSkeleton';

export const metadata = {
  title: 'Tienda',
  description: 'Explorá toda la colección de moda femenina Glak. Vestidos, camisas, pantalones y más.',
};

interface TiendaPageProps {
  searchParams: Promise<{
    cat?: string;
    q?: string;
    sort?: string;
    collection?: string;
    colors?: string;
    sizes?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function TiendaPage({ searchParams }: TiendaPageProps) {
  const params = await searchParams;
  const activeCategory = params.cat || 'Todo';
  const activeCollection = params.collection || '';
  const searchQuery = params.q || '';
  const sortBy = params.sort || 'relevantes';

  const colorsParam = params.colors ? params.colors.split(',') : [];
  const sizesParam = params.sizes ? params.sizes.split(',') : [];
  const minPriceParam = params.minPrice ? parseInt(params.minPrice) : undefined;
  const maxPriceParam = params.maxPrice ? parseInt(params.maxPrice) : undefined;

  const supabase = await createClient();

  // 1. Fetch collections metadata
  const { data: collections } = await supabase
    .from('collections')
    .select('id, name, slug')
    .order('name');
  const collectionList = collections || [];

  // 2. Fetch the collections junction pivot table to enable client-side collection filtering
  const { data: pivotData } = await supabase
    .from('product_collections')
    .select('product_id, collection_id');
  const pivotList = pivotData || [];

  // 3. Search query pgvector vs text fallback check
  let productsList: any[] = [];
  let usedVectorSearch = false;

  if (searchQuery) {
    try {
      const embedding = await getEmbeddingForText(searchQuery);
      if (embedding) {
        // Query the pgvector match_products RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc('match_products', {
          query_embedding: embedding,
          match_threshold: 0.25, // organic threshold
          match_count: 80
        });

        if (rpcError) {
          console.warn("pgvector match_products RPC failed, falling back to text search...", rpcError);
        } else if (rpcData) {
          // Keep only active products
          productsList = rpcData.filter((p: any) => p.status === 'active');
          usedVectorSearch = true;
        }
      }
    } catch (err) {
      console.warn("Vector embedding generation or RPC call failed, falling back to text search...", err);
    }
  }

  // Graceful fallback to text search if pgvector was not used or failed
  if (!usedVectorSearch) {
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active');

    // Text search by name ilike
    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data: textData, error: textError } = await query;
    if (textError) {
      console.error("Error fetching text-based search fallback products:", textError);
    }
    productsList = textData || [];
  }

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
              ? `Encontramos ${productsList.length} producto${productsList.length !== 1 ? 's' : ''} para tu búsqueda`
              : 'Descubrí toda la colección Glak'}
          </p>
        </div>

        {/* Dynamic interactive catalog client side wrapper */}
        <Suspense fallback={
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <FilterSkeleton />
            </aside>
            <div className={styles.mainContent}>
              <ProductGridSkeleton />
            </div>
          </div>
        }>
          <TiendaCatalog
            initialProducts={productsList}
            collections={collectionList}
            pivotList={pivotList}
            initialFilters={{
              q: searchQuery,
              cat: activeCategory,
              collection: activeCollection,
              sort: sortBy,
              colors: colorsParam,
              sizes: sizesParam,
              minPrice: minPriceParam,
              maxPrice: maxPriceParam
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}

