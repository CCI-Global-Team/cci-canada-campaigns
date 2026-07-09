import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  transpilePackages: [
    "@cci-campaigns/campaign-core",
    "@cci-campaigns/campaign-ui",
  ],
};

export default nextConfig;
