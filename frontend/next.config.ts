import type { NextConfig } from "next";
import path from "path";
import { config as loadEnv } from "dotenv";

// The Next.js API routes use the shared backend notification service. Load the
// existing local SMTP configuration without exposing it to browser bundles.
loadEnv({ path: path.join(__dirname, "../backend/.env"), quiet: true });

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  serverExternalPackages: ["pg", "bcryptjs", "drizzle-orm"],
  experimental: {
    // Allow importing domain modules from ../backend
    externalDir: true,
    // Identity documents are accepted up to 10 MB by the access-request flow.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
