import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'www.cookierunhub.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' }
    ]
  }
};

export default nextConfig;
