import type { NextConfig } from "next";
import path from "path";

// Root config used when running `next dev/build` from monorepo root.
// App lives under ./frontend/app via the dir argument in package scripts.
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["pg", "bcryptjs", "@nestjs/common", "@nestjs/config", "lodash", "rxjs"],
  experimental: {
    externalDir: true,
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  outputFileTracingExcludes: {
    "*": [
      "backend/node_modules/**/*",
      "docs/**/*",
      ".vscode/**/*",
      "**/*.md",
      "**/*.jpeg",
      "**/*.jpg",
      "**/*.png",
      "**/*.pdf",
    ],
  },
};

export default nextConfig;
