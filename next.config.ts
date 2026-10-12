import type { NextConfig } from "next";

const allowedDevOrigin = process.env.NEXT_ALLOWED_DEV_ORIGIN;

const nextConfig: NextConfig = allowedDevOrigin
  ? { allowedDevOrigins: [allowedDevOrigin] }
  : {};

export default nextConfig;
