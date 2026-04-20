'use client';

import styles from './page.module.css';

export default function SortSelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      name="sort"
      className={styles.sortSelect}
      defaultValue={defaultValue}
      onChange={(e) => e.target.form?.submit()}
      aria-label="Ordenar productos"
    >
      <option value="relevantes">Más nuevos</option>
      <option value="menor-precio">Menor precio</option>
      <option value="mayor-precio">Mayor precio</option>
    </select>
  );
}
