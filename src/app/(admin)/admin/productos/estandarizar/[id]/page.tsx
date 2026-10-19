import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StandardizationWorkbench } from '@/components/admin/standardization/StandardizationWorkbench';
import styles from './page.module.css';

export default async function IndividualEstandarizarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  const { data: jobs } = await supabase
    .from('photo_standardization_jobs')
    .select('*')
    .eq('product_id', id)
    .order('created_at', { ascending: false });

  if (productError || !product) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>Producto no encontrado o error de conexión.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/admin/productos/estandarizar" className={styles.backLink}>← Volver</Link>
        </div>
        <h1 className={styles.title}>Estandarizar: {product.name}</h1>
        <p className={styles.subtitle}>Configurá y supervisá las fotos generadas por IA.</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Fotos Originales</h2>
        <div className={styles.gallery}>
          {product.images && product.images.length > 0 ? (
            product.images.map((img: string, idx: number) => (
              <div key={idx} className={styles.galleryItem}>
                <img
                  src={`https://res.cloudinary.com/dpm4judv4/image/upload/c_fill,w_200,h_260,q_auto,f_auto/${img}`}
                  alt={`Original ${idx + 1}`}
                  className={styles.sourceImage}
                />
              </div>
            ))
          ) : (
            <p className={styles.emptyText}>El producto no tiene fotos originales.</p>
          )}
        </div>
      </section>

      {/* Interactive Client-Side Standardization Workbench with Cloud Generation & Independent Photo Cards */}
      <StandardizationWorkbench
        product={product}
        initialJobs={jobs || []}
      />
    </div>
  );
}
