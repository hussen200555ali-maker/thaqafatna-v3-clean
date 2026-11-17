import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // السماح لنطاقات المعاينة الخارجية بتحميل أصول التطوير (بدون بروتوكول — مطابقة اسم المضيف فقط)
  allowedDevOrigins: ["*.space-z.ai"],
  // إخفاء مؤشر التطوير العائم لتصبح المعاينة نظيفة
  devIndicators: false,
};

export default nextConfig;
