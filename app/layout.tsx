import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "صالون رزق | احجز دورك يا صاحبي",
  description: "تطبيق حجز طابور صالون الحلاقة رزق - احجز دورك بضغطة واحدة من موبايلك بدون تعقيد.",
  keywords: ["رزق", "صالون حلاقة", "حجز طابور", "حلاقة رجالي", "مصر"],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`dark ${cairo.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${cairo.className} min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300`}>
        <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 md:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
