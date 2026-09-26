import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
    "puppeteer-extra",
    "puppeteer-extra-plugin",
    "puppeteer-extra-plugin-stealth",
    "merge-deep",
    "clone-deep",
    "is-plain-object",
    "lazy-cache",
    "shallow-clone",
    "kind-of",
  ],
};

export default nextConfig;


