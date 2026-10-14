import type { NextConfig } from "next";
import { getTrustedDevHosts } from "./src/lib/dev-network";

const allowedDevOrigin = process.env.NEXT_ALLOWED_DEV_ORIGIN;

const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === "production"
    ? {}
    : { allowedDevOrigins: getTrustedDevHosts() }),
  ...(allowedDevOrigin
    ? {
        experimental: {
          serverActions: {
            allowedOrigins: [allowedDevOrigin],
          },
        },
      }
    : {}),
};

export default nextConfig;
