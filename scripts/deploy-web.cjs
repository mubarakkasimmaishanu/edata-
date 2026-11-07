const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'dist');
const destDir = 'C:/xampp/htdocs/edata/app';

if (!fs.existsSync(srcDir)) {
  console.error('Error: dist directory does not exist. Run vite build first.');
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
} else {
  // Clean old assets directory to remove stale bundle hashes
  const assetsDir = path.join(destDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    fs.rmSync(assetsDir, { recursive: true, force: true });
  }
}

fs.cpSync(srcDir, destDir, { recursive: true });
console.log('[Web Deploy] Successfully synced clean production web build to ' + destDir);
