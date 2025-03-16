import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    OPENWEATHERMAP_API_KEY: process.env.OPENWEATHERMAP_API_KEY,
  },
  images: {
    domains: ['maps.openweathermap.org'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.openweathermap.org',
        port: '',
        pathname: '/maps/**',
      },
    ],
  },
};

export default nextConfig;
