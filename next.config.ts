import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Lint separately; don't block production builds on lint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
