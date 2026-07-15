import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  env: {
    NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL:
      process.env.NEXT_PUBLIC_PRODUCT_MEDIA_BASE_URL ?? "/media",
  },
};

export default nextConfig;
