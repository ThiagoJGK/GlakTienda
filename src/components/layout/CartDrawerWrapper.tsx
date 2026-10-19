'use client';

import dynamic from "next/dynamic";
import { useCartRecovery } from "@/hooks/useCartRecovery";

const CartDrawer = dynamic(() => import("@/components/layout/CartDrawer"), { ssr: false });

export default function CartDrawerWrapper() {
  // Execute Zustand dynamic cart recovery from email link
  useCartRecovery();

  return <CartDrawer />;
}
