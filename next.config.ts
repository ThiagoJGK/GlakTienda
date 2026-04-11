import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/glak/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
