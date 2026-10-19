import React from 'react';
import styles from './FilterSkeleton.module.css';

export default function FilterSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      {/* Search Input Skeleton */}
      <div className={`${styles.shimmer} ${styles.searchSkeleton}`} />

      {/* Collections Section Skeleton */}
      <div className={styles.section}>
        <div className={`${styles.shimmer} ${styles.sectionTitleSkeleton}`} />
        <div className={styles.collectionsRow}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${styles.shimmer} ${styles.collectionCardSkeleton}`} />
          ))}
        </div>
      </div>

      {/* Categories Section Skeleton */}
      <div className={styles.section}>
        <div className={`${styles.shimmer} ${styles.sectionTitleSkeleton}`} />
        <div className={styles.categoriesRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`${styles.shimmer} ${styles.chipSkeleton}`} />
          ))}
        </div>
      </div>

      {/* Colors Section Skeleton */}
      <div className={styles.section}>
        <div className={`${styles.shimmer} ${styles.sectionTitleSkeleton}`} />
        <div className={styles.swatchesRow}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`${styles.shimmer} ${styles.swatchSkeleton}`} />
          ))}
        </div>
      </div>

      {/* Sizes Section Skeleton */}
      <div className={styles.section}>
        <div className={`${styles.shimmer} ${styles.sectionTitleSkeleton}`} />
        <div className={styles.sizesRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`${styles.shimmer} ${styles.sizeSkeleton}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
