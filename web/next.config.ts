import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import path from "node:path";

const productImagesAvailable = existsSync(path.join(process.cwd(), "public/products"));

const nextConfig: NextConfig = {
  output: "export",
  env: {
    NEXT_PUBLIC_PRODUCT_IMAGES_AVAILABLE: productImagesAvailable ? "true" : "false",
  },
};

export default nextConfig;
