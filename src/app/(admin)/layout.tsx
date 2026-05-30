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
        {/* Content */}
        <main className={styles.content}>{children}</main>
      </div>
      {/* Mobile bottom nav */}
      <AdminBottomNav />
    </div>
  );
}
