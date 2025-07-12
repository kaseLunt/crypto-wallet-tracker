import type { NextConfig } from "next";

// Define regex literals at the top level
const IGNORE_WARNING_EXPRESSION = /the request of a dependency is an expression/;
const IGNORE_WARNING_CRITICAL_DEPENDENCY =
  /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/;
const IGNORE_WARNING_MODULE_NOT_FOUND =
  /Module not found: Can't resolve '@opentelemetry\/exporter-jaeger'/;

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

      // Externalize OTEL Node-specific modules to avoid bundling issues
      config.externals = [
        ...(config.externals || []),
        "@opentelemetry/exporter-jaeger",
        "require-in-the-middle",
      ];

      // Ignore dynamic require warnings for OTEL
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        IGNORE_WARNING_EXPRESSION,
        IGNORE_WARNING_CRITICAL_DEPENDENCY,
        IGNORE_WARNING_MODULE_NOT_FOUND,
      ];
    }
    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000",
    NEXT_PUBLIC_OTEL_EXPORTER_OTLP_ENDPOINT:
      process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] || "http://localhost:4318",
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
