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
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
      },
    ],
  },

  // Output standalone for Docker
  output: "standalone",

  // Transpile monorepo packages
  transpilePackages: ["@crypto-tracker/ui", "@crypto-tracker/core", "@crypto-tracker/telemetry"],

  // Webpack configuration to help with module resolution
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Help with ESM resolution in server-side code
      config.resolve.extensionAlias = {
        ".js": [".js", ".ts"],
        ".jsx": [".jsx", ".tsx"],
      };
    }
    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000",
    NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT:
      process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] || "http://localhost:4320",
  },

  // Headers for security
  headers() {
    return Promise.resolve([
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
    ]);
  },
};

export default nextConfig;
