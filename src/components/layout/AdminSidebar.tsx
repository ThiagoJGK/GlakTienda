import Link from "next/link";
import styles from "./AdminSidebar.module.css";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/productos", label: "Productos", icon: "📦" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "🛒" },
  { href: "/admin/categorias", label: "Categorías", icon: "📂" },
  { href: "/admin/clientes", label: "Clientes", icon: "👥" },
  { href: "/admin/contenido", label: "Contenido", icon: "📝" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️" },
];

const bottomItems = [
  { href: "/", label: "Ver Tienda", icon: "🏪" },
];

export default function AdminSidebar() {
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <Link href="/admin" className={styles.logo}>
          <span className="font-heading">GLAK</span>
          <span className={styles.badge}>Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={styles.nav} aria-label="Navegación del panel de administración">
        <ul className={styles.list}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={styles.link}>
                <span className={styles.icon} aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.divider} />

        <ul className={styles.list}>
          {bottomItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={styles.link} target="_blank">
                <span className={styles.icon} aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
