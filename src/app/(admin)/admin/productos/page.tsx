import Link from "next/link";
import styles from "./page.module.css";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching admin products", error);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Productos</h1>
          <p className={styles.subtitle}>Gestiona tu catálogo, inventario y variaciones.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/productos/carga-masiva" className={`btn-ghost`}>
            Carga Masiva IA
          </Link>
          <Link href="/admin/productos/crear" className={`btn btn-primary ${styles.btnCreate}`}>
            + Nuevo Producto
          </Link>
        </div>
      </header>

      {(!products || products.length === 0) ? (
        <div className={styles.emptyState}>
           <p className={styles.emptyText}>No hay productos publicados todavía.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Status</th>
                <th>Inventario</th>
                <th>Precio</th>
                <th className={styles.alignRight}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prop) => (
                <tr key={prop.id}>
                  <td>
                    <div className={styles.productCell}>
                      <div className={styles.productInitial}>{prop.name.charAt(0)}</div>
                      <div>
                        <p className={styles.productName}>{prop.name}</p>
                        <span className={styles.productCategory}>{prop.category}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[prop.status]}`}>
                      {prop.status === 'active' ? 'Activo' : 'Borrador'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.stock} ${prop.stock <= 5 ? styles.stockLow : ''}`}>
                      {prop.stock} en stock
                    </span>
                  </td>
                  <td className={styles.price}>
                    ${prop.price?.toLocaleString("es-AR")}
                  </td>
                  <td className={`${styles.alignRight} ${styles.actionGroup}`}>
                    <Link href={`/admin/productos/editar/${prop.id}`} className={styles.btnAction} title="Editar producto">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </Link>
                    <Link href={`/producto/${prop.slug}`} className={styles.btnAction} title="Ver producto" target="_blank">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
