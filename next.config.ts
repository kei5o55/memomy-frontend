import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* ここに必要に応じて設定を追加していきます */
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/rails/:path*",
        destination: "http://web:3000/rails/:path*",
      },
    ];
  },
};

export default nextConfig;