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

  // 2. Experimental & Performance
  experimental: {
    // Tree-shaking for heavy libraries
    optimizePackageImports: [
      "lucide-react", 
      "framer-motion", 
      "radix-ui", 
      "@paddle/paddle-node-sdk"
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
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "frame-src 'self' https://checkout.paddle.com",
              "connect-src 'self' https://checkout.paddle.com"
            ].join("; "),
          },
        ],
      },
    ];
  },

  // 4. API Proxy / Rewrites
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL;
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
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
