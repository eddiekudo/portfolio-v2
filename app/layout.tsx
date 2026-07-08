import type { Metadata } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";
import "./globals.css";
import CursorWrapper from "../components/CursorWrapper";
import Preloader from "../components/Preloader";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const grotesk = Archivo({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://adityarawat.com"),
  title: "Aditya Rawat, Frontend Designer",
  description: "Design that moves. Interfaces, motion, 3D experiences, and design systems.",
  icons: {
    icon: "/icon.webp?v=2",
  },
  openGraph: {
    title: "Aditya Rawat, Frontend Designer",
    description: "Design that moves. Interfaces, motion, 3D experiences, and design systems.",
    url: "https://adityarawat.com",
    siteName: "Aditya Rawat Portfolio",
    images: [
      {
        url: "/assets/images/bg-portfolio.webp",
        width: 1200,
        height: 630,
        alt: "Aditya Rawat Portfolio",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aditya Rawat, Frontend Designer",
    description: "Design that moves. Interfaces, motion, 3D experiences, and design systems.",
    images: ["/assets/images/bg-portfolio.webp"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${grotesk.variable} ${instrument.variable} h-full antialiased`}>
      <head>
        <link
          rel="preload"
          href="/hero-eddie/models/macbook-opt.glb"
          as="fetch"
          media="(min-width: 768px)"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/preloader-eddie/assets/goga-regular-a79764c8.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/hero-eddie/hero-section-all-layers.webp"
          as="image"
          media="(max-width: 767px)"
        />
      </head>
      <body className="min-h-full">
        {children}
        <Preloader />
        <CursorWrapper />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
