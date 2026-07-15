import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { OrderModal } from "@/components/OrderModal";

export const metadata: Metadata = {
  title: "dush.kz — сантехника с доставкой по Казахстану",
  description:
    "Магазин сантехники: душевые кабины, смесители, унитазы, раковины. Оригинал, гарантия, быстрая доставка.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <OrderModal />
      </body>
    </html>
  );
}
