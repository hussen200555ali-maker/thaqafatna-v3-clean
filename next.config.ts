import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* الأخطاء تُفحص صراحةً عبر `bunx tsc --noEmit` في CI — لا يُتجاهل أي خطأ نوع */
  reactStrictMode: false,
};

export default nextConfig;
