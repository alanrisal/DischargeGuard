import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "path";

const dashboardDir = __dirname;
const repoRoot = path.join(dashboardDir, "..");
const dev = process.env.NODE_ENV !== "production";

// Root `.env.local` is where many teams keep secrets; Next only auto-loads from `dashboard/`.
// Load parent first, then dashboard so local overrides win.
loadEnvConfig(repoRoot, dev);
loadEnvConfig(dashboardDir, dev);

const nextConfig: NextConfig = {
  // Avoid picking a parent folder lockfile (e.g. ~/package-lock.json) as tracing root.
  outputFileTracingRoot: path.join(dashboardDir),
};

export default nextConfig;
