"use client";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { OrderModal } from "./OrderModal";
import { WhatsAppFab } from "./WhatsAppFab";

/** Панель управления живёт на том же домене, но без шапки, футера и корзины витрины. */
export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const isAdmin = usePathname()?.startsWith("/admin") ?? false;
  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFab />
      <CartDrawer />
      <OrderModal />
    </>
  );
}
