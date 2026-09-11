import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../"),
  reactStrictMode: true,
  images: {
    domains: ["images.unsplash.com", "res.cloudinary.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  onDemandEntries: {
    maxInactiveAge: 15 * 1000, // Keep pages inactive in memory for max 15 seconds
    pagesBufferLength: 2,      // Keep only 2 pages buffered in memory
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = false; // Disable heavy source maps in dev to save up to 50% RAM
      config.cache = {
        type: 'filesystem',
        maxMemoryGenerations: 1, // Minimize in-memory generation storage
      };
    }
    return config;
  },
  async rewrites() {
    const gatewayUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";
    // Strip trailing '/api/v1' if present so destination can append it cleanly
    const gatewayBase = gatewayUrl.endsWith("/api/v1") 
      ? gatewayUrl.slice(0, -7) 
      : gatewayUrl;
    
    return [
      {
        source: "/api/v1/:path*",
        destination: `${gatewayBase}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
