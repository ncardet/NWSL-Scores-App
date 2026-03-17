import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a1.espncdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a2.espncdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a3.espncdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a4.espncdn.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
