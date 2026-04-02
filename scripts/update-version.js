const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const count = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
  const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

  const versionPath = path.join(__dirname, '..', 'version.json');
  fs.writeFileSync(versionPath, JSON.stringify({ version: `v${count}`, hash }, null, 2) + '\n');

  console.log(`✓ version.json updated: v${count} (${hash})`);
} catch (err) {
  console.error('Error updating version:', err.message);
  process.exit(1);
}
