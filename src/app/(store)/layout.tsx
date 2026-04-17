import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TrustBar from "@/components/layout/TrustBar";
import BottomNav from "@/components/layout/BottomNav";
import CartDrawerWrapper from "@/components/layout/CartDrawerWrapper";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TrustBar />
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
      <BottomNav />
      <CartDrawerWrapper />
    </>
  );
}
