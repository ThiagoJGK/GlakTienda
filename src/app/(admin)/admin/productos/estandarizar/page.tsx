import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StandardizationStatusBadge, StandardizationStatus } from '@/components/admin/StandardizationStatusBadge';
import styles from './page.module.css';

export default async function EstandarizarPage() {
  const supabase = await createClient();

  // Fetch products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, slug, category, images, status, standardized_images')
    .order('name');

  // Fetch jobs (assuming table exists)
  const { data: jobs, error: jobsError } = await supabase
    .from('photo_standardization_jobs')
    .select('product_id, status, created_at')
    .order('created_at', { ascending: false });

  const isError = productsError || jobsError;

  // Map product_id -> latest job status
  const latestJobs = new Map<string, StandardizationStatus>();
  if (jobs) {
    for (const job of jobs) {
      if (!latestJobs.has(job.product_id)) {
        latestJobs.set(job.product_id, job.status as StandardizationStatus);
      }
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Fotos IA</h1>
        <p className={styles.subtitle}>Estandarizá las fotos de tus productos con inteligencia artificial.</p>
      </header>

      {isError && (
        <div className={styles.errorState}>
          <p>Error de conexión al cargar los datos.</p>
        </div>
      )}

      {!isError && (!products || products.length === 0) && (
        <div className={styles.emptyState}>
          <p>No se encontraron productos.</p>
        </div>
      )}

      {!isError && products && products.length > 0 && (
        <div className={styles.grid}>
          {products.map((product) => {
            const status = latestJobs.get(product.id) || 'none';
            const firstImage = product.images?.[0];
            const thumbUrl = firstImage ? `https://res.cloudinary.com/dpm4judv4/image/upload/c_fill,w_300,h_300,q_auto,f_auto/${firstImage}` : '';
            const stdImagesCount = product.standardized_images?.length || 0;

            return (
              <div key={product.id} className={styles.card}>
                <div className={styles.imageContainer}>
                  {thumbUrl ? (
                    <img src={thumbUrl} alt={product.name} className={styles.image} />
                  ) : (
                    <div className={styles.imagePlaceholder}>Sin foto</div>
                  )}
                  {stdImagesCount > 0 && (
                    <div className={styles.countBadge}>✨ {stdImagesCount} fotos</div>
                  )}
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <p className={styles.productCategory}>{product.category}</p>
                  </div>
                  
                  <div className={styles.statusSection}>
                    <StandardizationStatusBadge status={status} />
                  </div>
                  
                  <Link href={`/admin/productos/estandarizar/${product.id}`} className={styles.actionButton}>
                    Estandarizar →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
