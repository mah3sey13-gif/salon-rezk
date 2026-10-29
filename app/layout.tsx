import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "صالون رزق | احجز دورك يا صاحبي",
  description: "تطبيق حجز طابور صالون الحلاقة رزق - احجز دورك بضغطة واحدة من موبايلك بدون تعقيد.",
  keywords: ["رزق", "صالون حلاقة", "حجز طابور", "حلاقة رجالي", "مصر"],
  manifest: "/manifest.json",
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
    <html lang="ar" dir="rtl" className="dark">
      <body className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
        <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 md:py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
