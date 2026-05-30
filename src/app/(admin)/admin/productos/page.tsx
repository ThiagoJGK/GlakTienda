import Link from "next/link";
import styles from "./page.module.css";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });

  const productList = products || [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Productos</h1>
          <p className={styles.subtitle}>Gestiona tu catálogo, inventario y variaciones.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/productos/carga-masiva" className={`btn btn-ghost ${styles.btnCreate}`}>
            Importar con IA
          </Link>
          <Link href="/admin/productos/crear" className={`btn btn-primary ${styles.btnCreate}`}>
            + Nuevo Producto
          </Link>
        </div>
      </header>

      {/* Error state */}
      {error && (
        <div className={styles.emptyState} style={{ borderColor: '#fca5a5', backgroundColor: '#fef2f2', gap: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px', flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className={styles.emptyText} style={{ color: '#991b1b', margin: 0 }}>Sin conexión a Supabase</p>
          <p style={{ fontSize: '0.875rem', color: '#b91c1c', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
            {error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ENOTFOUND')
              ? 'El proyecto Supabase no responde. Posiblemente está pausado (plan gratuito se pausa tras 7 días de inactividad).'
              : `Error de base de datos: ${error.message}`
            }
          </p>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ marginTop: '8px', fontSize: '0.875rem', textDecoration: 'none' }}
          >
            Ir al Dashboard de Supabase →
          </a>
        </div>
      )}

      {/* Empty state */}
      {!error && productList.length === 0 && (
        <div className={styles.emptyState}>
           <p className={styles.emptyText}>No hay productos publicados todavía.</p>
        </div>
      )}

      {/* Products table */}
      {!error && productList.length > 0 && (
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
              {productList.map((prop) => (
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
