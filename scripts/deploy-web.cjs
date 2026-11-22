const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AdmZip = require('adm-zip');

const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'dist');
const destDir = 'C:/xampp/htdocs/edata/app';
const otaDir = path.join(destDir, 'ota');
const KEEP_BUNDLES = 5;

if (!fs.existsSync(srcDir)) {
  console.error('Error: dist directory does not exist. Run vite build first.');
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 1. Web portal: seamlessly copy dist into destDir without wiping old chunk hashes
// so users with active sessions don't get 404 or SyntaxError during deployments.
fs.cpSync(srcDir, destDir, { recursive: true });
console.log('[Web Deploy] Successfully synced clean production web build to ' + destDir);

// 2. Mobile live update (OTA) bundle for @capgo/capacitor-updater.
// The native shell version this bundle is compatible with (plugins/permissions it relies on).
function readNativeVersion() {
  try {
    const gradle = fs.readFileSync(path.join(projectRoot, 'android', 'app', 'build.gradle'), 'utf8');
    const m = gradle.match(/versionName\s+["']([^"']+)["']/);
    if (m) return m[1];
  } catch { /* fall through */ }
  return require(path.join(projectRoot, 'package.json')).version;
}

function shouldSkip(relPath) {
  const base = path.basename(relPath);
  return base.endsWith('.map') || base.startsWith('server.') || relPath.split(/[\\/]/)[0] === 'ota';
}

function addDir(zip, dir, rel = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryRel = rel ? `${rel}/${entry.name}` : entry.name; // forward slashes inside the zip
    if (shouldSkip(entryRel)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) addDir(zip, full, entryRel);
    else zip.addFile(entryRel, fs.readFileSync(full));
  }
}

if (!fs.existsSync(path.join(srcDir, 'index.html'))) {
  console.error('[OTA] dist/index.html missing, skipping live update bundle.');
  process.exit(1);
}

const nativeVersion = readNativeVersion();
const now = new Date();
const stamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 12); // YYYYMMDDHHmm (UTC)
const version = `${nativeVersion}-ota.${stamp}`;
const fileName = `${version}.zip`;

fs.mkdirSync(otaDir, { recursive: true });
const zip = new AdmZip();
addDir(zip, srcDir);
const zipPath = path.join(otaDir, fileName);
zip.writeZip(zipPath);

const buf = fs.readFileSync(zipPath);
const checksum = crypto.createHash('sha256').update(buf).digest('hex');

const manifestPath = path.join(otaDir, 'manifest.json');
let manifest = { enabled: true, rollback_to_builtin: false, active: null, bundles: [] };
if (fs.existsSync(manifestPath)) {
  try {
    manifest = { ...manifest, ...JSON.parse(fs.readFileSync(manifestPath, 'utf8')) };
  } catch {
    console.warn('[OTA] manifest.json unreadable, recreating it.');
  }
}
if (!Array.isArray(manifest.bundles)) manifest.bundles = [];

manifest.bundles = manifest.bundles.filter((b) => b.version !== version);
manifest.bundles.push({
  version,
  file: fileName,
  checksum,
  size: buf.length,
  min_native_version: nativeVersion,
  created_at: now.toISOString(),
});
manifest.active = version;

// Keep only the most recent bundles on disk (the admin can roll back to any of these).
while (manifest.bundles.length > KEEP_BUNDLES) {
  const old = manifest.bundles.shift();
  try { fs.unlinkSync(path.join(otaDir, old.file)); } catch { /* already gone */ }
}

const tmp = manifestPath + '.tmp';
fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2));
fs.renameSync(tmp, manifestPath);

console.log(`[OTA] Published live bundle ${version} (${(buf.length / 1048576).toFixed(2)} MB, sha256 ${checksum.slice(0, 12)}...)`);
if (!manifest.enabled || manifest.rollback_to_builtin) {
  console.warn('[OTA] Note: live updates are currently paused or rolled back in Admin > App Version, devices will not receive this bundle until re-enabled.');
}
