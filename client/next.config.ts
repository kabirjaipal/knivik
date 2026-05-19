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
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) throw new Error("BACKEND_URL is not defined");
    const wsUrl = backendUrl.replace(/^http/, "ws");
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || wsUrl;
    const socketWsUrl = socketUrl.replace(/^http/, "ws");

    const connectSources = [
      "'self'",
      "https://*.dodopayments.com",
      "https://va.vercel-scripts.com",
      "https://*.posthog.com",
      "https://*.i.posthog.com"
    ];

    if (backendUrl && (backendUrl.startsWith("http://") || backendUrl.startsWith("https://"))) {
      connectSources.push(backendUrl);
    }
    if (socketUrl && (socketUrl.startsWith("http://") || socketUrl.startsWith("https://"))) {
      connectSources.push(socketUrl);
    }
    if (socketWsUrl && (socketWsUrl.startsWith("ws://") || socketWsUrl.startsWith("wss://"))) {
      connectSources.push(socketWsUrl);
    }

    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.dodopayments.com https://va.vercel-scripts.com https://*.posthog.com https://*.i.posthog.com",
      "style-src-elem 'self' 'unsafe-inline' https://*.dodopayments.com",
      "style-src-attr 'self' 'unsafe-inline' https://*.dodopayments.com",
      "img-src 'self' data: blob: https://*.posthog.com https://*.dodopayments.com https://www.redditstatic.com https://abs.twimg.com https://news.ycombinator.com https://*.google.com https://*.gstatic.com https://avatars.githubusercontent.com",
      "font-src 'self' data:",
      "frame-src 'self' https://*.dodopayments.com",
      `connect-src ${connectSources.join(" ")}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join("; ");
    
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
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
    const backendUrl = process.env.BACKEND_URL;
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
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
