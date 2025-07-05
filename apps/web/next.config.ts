import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,

  // Enable experimental features
  experimental: {
    // Server Components optimization
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com", // For token icons
      },
      {
        protocol: "https",
        hostname: "assets.coingecko.com", // For CoinGecko images
      },
    ],
  },

  // Output standalone for Docker
  output: "standalone",

  // Transpile monorepo packages
  transpilePackages: ["@crypto-tracker/ui", "@crypto-tracker/core"],

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL:
      // biome-ignore lint/complexity/useLiteralKeys: TypeScript's `noPropertyAccessFromIndexSignature` rule requires bracket notation for process.env.
      process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000",
  },

  // Headers for security
  // biome-ignore lint/suspicious/useAwait: Next.js requires this function to be async.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
