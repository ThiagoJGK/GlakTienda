import type { Metadata } from "next";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminBottomNav from "@/components/layout/AdminBottomNav";
import styles from "./admin-layout.module.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <div className={styles.mainArea}>
        {/* Admin Header */}
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <h2 className={styles.pageTitle}>Panel de Administración</h2>
            <div className={styles.headerActions}>
              <span className={styles.userName}>Admin</span>
            </div>
          </div>
        </header>
        {/* Content */}
        <main className={styles.content}>{children}</main>
      </div>
      {/* Mobile bottom nav */}
      <AdminBottomNav />
    </div>
  );
}
