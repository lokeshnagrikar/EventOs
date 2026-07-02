import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://localhost:8080/api/v1/:path*", // Route requests through API Gateway
      },
    ];
  },


};

export default nextConfig;
