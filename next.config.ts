import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : undefined,
  images: { unoptimized: isGithubPages },
  basePath: isGithubPages ? "/vizinho" : undefined,
  assetPrefix: isGithubPages ? "/vizinho/" : undefined,
  trailingSlash: isGithubPages,
};

export default nextConfig;
