import type { NextConfig } from "next";
import { execSync } from "child_process";

function getAppVersion(): string {
  try {
    const count = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    return `v${count} (${hash})`;
  } catch {
    return 'dev';
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: getAppVersion(),
  },
};

export default nextConfig;
