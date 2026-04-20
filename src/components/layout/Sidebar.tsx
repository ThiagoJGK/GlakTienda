import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  onClose: () => void;
}

const categorias = [
  { name: 'Novedades', href: '/tienda' },
  { name: 'Vestidos', href: '/tienda?cat=Vestidos' },
  { name: 'Camisas', href: '/tienda?cat=Camisas' },
  { name: 'Pantalones', href: '/tienda?cat=Pantalones' },
  { name: 'Abrigos', href: '/tienda?cat=Abrigos' },
  { name: 'Accesorios', href: '/tienda?cat=Accesorios' },
  { name: 'Sale', href: '/tienda?cat=Sale' },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const [isClosing, setIsClosing] = useState(false);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 400); // Matches CSS animation duration
  };

  return (
    <>
      {/* Backdrop */}
      <div className={`${styles.backdrop} ${isClosing ? styles.backdropClosing : ''}`} onClick={handleClose} aria-label="Cerrar menú trasero" />

      {/* Sidebar Panel */}
      <aside className={`glass-drawer ${styles.sidebar} ${isClosing ? styles.sidebarClosing : ''}`} aria-label="Menú lateral">
        <div className={styles.header}>
          <span className={`${styles.logo} font-heading`}>GLAK</span>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar menú">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {/* User / Login Section */}
          <div className={styles.userSection}>
            <Link href="/mi-cuenta" className={styles.loginCard} onClick={handleClose}>
              <div className={styles.avatar}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className={styles.userInfo}>
                <span className={styles.greeting}>Bienvenida</span>
                <span className={styles.loginAction}>Iniciar Sesión o Registrarse</span>
              </div>
              <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Link>
          </div>

          <hr className={styles.divider} />

          {/* Categories Menu */}
          <nav className={styles.menu}>
            <h3 className={styles.menuTitle}>Categorías</h3>
            <ul className={styles.menuList}>
              {categorias.map((cat) => (
                <li key={cat.name}>
                  <Link href={cat.href} className={styles.menuItem} onClick={handleClose}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.footer}>
          <Link href="/contacto" className={styles.footerLink} onClick={handleClose}>Ayuda y Contacto</Link>
          <span className={styles.version}>v0.1.0</span>
        </div>
      </aside>
    </>
  );
}
