'use client';

import dynamic from "next/dynamic";

const CartDrawer = dynamic(() => import("@/components/layout/CartDrawer"), { ssr: false });

export default function CartDrawerWrapper() {
  return <CartDrawer />;
}
