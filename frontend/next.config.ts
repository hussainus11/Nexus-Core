import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "bundui-images.netlify.app" }
    ]
  },
  // Turbopack: pin root to the monorepo root (where hoisted deps like `next` live)
  // and alias CSS packages to this package's node_modules.
  turbopack: {
    root: path.resolve(__dirname, ".."),
    resolveAlias: {
      tailwindcss: path.resolve(__dirname, "node_modules/tailwindcss"),
      "tailwindcss-animate": path.resolve(__dirname, "node_modules/tailwindcss-animate"),
    }
  },
  // Webpack (used by Next.js for SSR/edge compilation even in Turbopack dev mode):
  // ensure CSS package resolution always starts from frontend/node_modules.
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: path.resolve(__dirname, "node_modules/tailwindcss"),
      "tailwindcss-animate": path.resolve(__dirname, "node_modules/tailwindcss-animate"),
    };
    config.resolve.modules = [
      path.resolve(__dirname, "node_modules"),
      ...(config.resolve.modules || ["node_modules"]),
    ];
    return config;
  },
};

export default nextConfig;
