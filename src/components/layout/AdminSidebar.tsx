import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  Sparkles, 
  ShoppingCart, 
  FolderTree, 
  Users, 
  FileText, 
  Settings, 
  Store 
} from "lucide-react";
import styles from "./AdminSidebar.module.css";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/productos/estandarizar", label: "Fotos IA", icon: Sparkles },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/categorias", label: "Categorías", icon: FolderTree },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/contenido", label: "Contenido", icon: FileText },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

const bottomItems = [
  { href: "/", label: "Ver Tienda", icon: Store },
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
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link href={item.href} className={styles.link}>
                  <span className={styles.icon} aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={styles.divider} />

        <ul className={styles.list}>
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link href={item.href} className={styles.link} target="_blank">
                  <span className={styles.icon} aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
