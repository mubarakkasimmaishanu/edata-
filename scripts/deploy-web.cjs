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
}

// Seamlessly copy dist into destDir without wiping old chunk hashes
// so users with active sessions don't get 404 or SyntaxError during deployments.
fs.cpSync(srcDir, destDir, { recursive: true });
console.log('[Web Deploy] Successfully synced clean production web build to ' + destDir);
