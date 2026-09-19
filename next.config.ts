import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@react-pdf/renderer"],
};

export default nextConfig;
