import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile exists in the home directory; pin the root explicitly.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
