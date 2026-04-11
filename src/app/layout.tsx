import type { Metadata } from "next";
import { Inter, Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Glak — Moda Femenina",
    template: "%s | Glak",
  },
  description:
    "Tienda online de moda femenina. Descubrí las últimas tendencias en vestidos, camisas, pantalones y más. Envíos a todo el país. Cuotas sin interés.",
  keywords: [
    "moda femenina",
    "ropa de mujer",
    "tienda online",
    "vestidos",
    "camisas",
    "argentina",
    "glak",
  ],
  authors: [{ name: "Glak" }],
  creator: "Glak",
  metadataBase: new URL("https://glak.com.ar"),
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Glak",
    title: "Glak — Moda Femenina",
    description:
      "Tienda online de moda femenina. Descubrí las últimas tendencias.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Glak — Moda Femenina",
    description:
      "Tienda online de moda femenina. Descubrí las últimas tendencias.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${inter.variable} ${outfit.variable} ${playfair.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
