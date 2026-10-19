import React from 'react';
import styles from './ProductGridSkeleton.module.css';

export default function ProductGridSkeleton() {
  return (
    <div className={styles.grid}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className={styles.cardContainer}>
          <div className={styles.card}>
            <div className={`${styles.shimmer} ${styles.imageSkeleton}`} />
            <div className={styles.info}>
              <div className={`${styles.shimmer} ${styles.categorySkeleton}`} />
              <div className={`${styles.shimmer} ${styles.nameSkeleton}`} />
              <div className={`${styles.shimmer} ${styles.priceSkeleton}`} />
              <div className={`${styles.shimmer} ${styles.installmentsSkeleton}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
