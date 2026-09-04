import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/din-in',
        destination: '/dine-in',
      },
    ];
  },
};

export default nextConfig;
