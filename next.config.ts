import type { NextConfig } from "next";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function getAppVersion(): string {
  try {
    const count = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    return `v${count} (${hash})`;
  } catch {
    // Fallback: read from version.json (for Railway where .git isn't available)
    try {
      const versionFile = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'version.json'), 'utf8')
      );
      return `${versionFile.version} (${versionFile.hash})`;
    } catch {
      return 'dev';
    }
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: getAppVersion(),
  },
};

export default nextConfig;
