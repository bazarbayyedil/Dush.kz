import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StorefrontChrome } from "@/components/StorefrontChrome";
import { SITE_URL } from "@/lib/site";
import { COMPANY, INSTAGRAM_URL, PHONE_DISPLAY } from "@/lib/contacts";
import { YandexMetrika } from "@/components/YandexMetrika";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "dush.kz — сантехника с доставкой по Казахстану",
  description:
    "Магазин сантехники: душевые кабины, смесители, унитазы, раковины. Оригинал, гарантия, быстрая доставка.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "dush.kz",
    locale: "ru_KZ",
    url: SITE_URL,
    title: "dush.kz — сантехника с доставкой по Казахстану",
    description:
      "Душевые кабины, смесители, унитазы, ванны и мебель для ванной. Оригинал, гарантия, доставка по Астане за 24 часа.",
  },
};

// Кто мы такие — для карточки организации в поиске и на картах.
const storeSchema = {
  "@context": "https://schema.org",
  "@type": "HomeGoodsStore",
  name: "dush.kz",
  legalName: COMPANY.name,
  taxID: COMPANY.bin,
  url: SITE_URL,
  image: `${SITE_URL}/logo-teal.svg`,
  description:
    "Магазин сантехники в Астане: душевые кабины, смесители, унитазы, ванны, мебель для ванной комнаты.",
  telephone: PHONE_DISPLAY,
  priceRange: "₸₸",
  currenciesAccepted: "KZT",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Абая, 94",
    addressLocality: "Астана",
    addressCountry: "KZ",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "10:00",
    closes: "19:00",
  },
  sameAs: [INSTAGRAM_URL],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
        />
        <StorefrontChrome>{children}</StorefrontChrome>
        <YandexMetrika />
      </body>
    </html>
  );
}
