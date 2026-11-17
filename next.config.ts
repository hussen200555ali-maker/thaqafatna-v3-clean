import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // نفس سلوك البناء المعتمد سابقاً — لا يوقف النشرَ خطأُ أنواع
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
