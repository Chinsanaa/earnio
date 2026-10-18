import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(frontendDir, "..");

// Production: set API_PROXY_TARGET to the Render API origin and
// NEXT_PUBLIC_API_URL to "/". The browser then calls /api/* on this site and
// Next proxies it to the API, so auth cookies stay first-party.
const apiProxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  // Monorepo: trace files from repo root for standalone Docker/Vercel output.
  outputFileTracingRoot: repoRoot,
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [{ source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
