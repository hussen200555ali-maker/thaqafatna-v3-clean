import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// خط العناوين — Cairo
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

// خط النصوص — Tajawal
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ثقافتنا | منصة الثقافة العربية — لعبة ومكتبة",
  description:
    "منصة ثقافية تفاعلية تجمع الألغاز التكيّفية والمكتبة الذكية في مكان واحد — استكشف، العب، وتعلّم.",
  keywords: ["ثقافتنا", "ثقافة عربية", "ألغاز", "مكتبة", "تعليم", "تراث"],
  applicationName: "ثقافتنا",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0F4C5C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${tajawal.variable} font-body antialiased bg-sand text-foreground`}
      >
        {/* رابط تخطّي المحتوى — إمكانية الوصول (يظهر عند الضغط على Tab) */}
        <a href="#main-content" className="skip-to-content">
          تخطّي إلى المحتوى الرئيسي
        </a>
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
