import type { NextConfig } from "next";

const allowedDevOrigin = process.env.NEXT_ALLOWED_DEV_ORIGIN;

const nextConfig: NextConfig = allowedDevOrigin
  ? {
      allowedDevOrigins: [allowedDevOrigin],
      experimental: {
        serverActions: {
          allowedOrigins: [allowedDevOrigin],
        },
      },
    }
  : {};

export default nextConfig;
