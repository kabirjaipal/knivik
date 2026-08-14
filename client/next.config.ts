import type { NextConfig } from "next";

/** 
 * Knivik Next.js Configuration
 * High-Performance, Secure, and Scalable
 */
const nextConfig: NextConfig = {
  // 1. Core Runtime Settings
  reactStrictMode: true,
  poweredByHeader: false, // Security: Minimize fingerprinting
  compress: true,        // Performance: Enable Gzip compression
  skipTrailingSlashRedirect: true, // PostHog Rewrite compatibility
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "bcryptjs", "dodopayments"],

  // 2. Experimental & Performance
  experimental: {
    // Tree-shaking for heavy libraries
    optimizePackageImports: [
      "lucide-react", 
      "framer-motion", 
      "radix-ui", 
    ],
  },

  // 3. Security Headers (Hardened)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },

  // 4. API Proxy / Rewrites
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },

  // 5. Image Optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // Allow images from any secure source
    ],
  },

  // 6. Build & Dev Experience
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  
  logging: {
    fetches: {
      fullUrl: true, // Performance: See exact fetch targets in dev logs
    },
  },
};

export default nextConfig;
