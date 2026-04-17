'use client';

import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import styles from "./Navbar.module.css";
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false });

export default function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const openCart = useCartStore((s) => s.open);
  const totalItems = useCartStore((s) => s.totalItems);
  const count = totalItems();

  return (
    <>
      <header className={`glass-navbar ${styles.navbar}`}>
        <nav className={`container ${styles.nav}`} aria-label="Navegación principal">
          
          {/* Left: Hamburger */}
          <div className={styles.leftControls}>
            <button 
              className={`btn-ghost ${styles.iconBtn}`} 
              aria-label="Abrir menú" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Center: Logo */}
          <div className={styles.centerLogo}>
            <Link href="/" className={styles.logo} aria-label="Glak — Inicio">
              <span className="font-heading">GLAK</span>
            </Link>
          </div>

          {/* Right: Cart */}
          <div className={styles.rightControls}>
            <button
              className={`btn-ghost ${styles.iconBtn} ${styles.cartBtn}`}
              aria-label="Abrir carrito"
              onClick={openCart}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {count > 0 && (
                <span className={styles.cartBadge}>{count}</span>
              )}
            </button>
          </div>
        </nav>
      </header>

      {isSidebarOpen && (
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      )}
    </>
  );
}
