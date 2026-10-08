/**
 * Postinstall patch for @codetrix-studio/capacitor-google-auth (iOS only).
 *
 * WHY: The published plugin pins GoogleSignIn ~> 6.2.4, which resolves GTMAppAuth 1.x.
 * GTMAppAuth < 4.1.1 has no Apple privacy manifest, so App Store Connect rejects the
 * binary with ITMS-91061 ("Missing privacy manifest - Frameworks/GTMAppAuth.framework").
 *
 * This script overwrites the plugin's podspec (GoogleSignIn ~> 7.1) and iOS Swift source
 * (migrated to the GoogleSignIn 7 API) with the copies in patches/capacitor-google-auth-ios.
 * Android and web code of the plugin are left untouched.
 *
 * Runs automatically after `npm install` / `npm ci` (see "postinstall" in package.json).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pluginDir = path.join(root, 'node_modules', '@codetrix-studio', 'capacitor-google-auth');
const patchDir = path.join(root, 'patches', 'capacitor-google-auth-ios');
const EXPECTED_VERSION = '3.4.0-rc.4';

if (!fs.existsSync(pluginDir)) {
  console.log('[patch-google-auth-ios] plugin not installed, skipping.');
  process.exit(0);
}

const { version } = JSON.parse(fs.readFileSync(path.join(pluginDir, 'package.json'), 'utf8'));
if (version !== EXPECTED_VERSION) {
  console.warn(
    `[patch-google-auth-ios] WARNING: expected plugin ${EXPECTED_VERSION} but found ${version}. ` +
      'Re-verify patches/capacitor-google-auth-ios before shipping an iOS build.'
  );
}

const files = [
  ['CodetrixStudioCapacitorGoogleAuth.podspec', 'CodetrixStudioCapacitorGoogleAuth.podspec'],
  ['Plugin.swift', path.join('ios', 'Plugin', 'Plugin.swift')],
];

for (const [src, dest] of files) {
  fs.copyFileSync(path.join(patchDir, src), path.join(pluginDir, dest));
}

const podspec = fs.readFileSync(path.join(pluginDir, 'CodetrixStudioCapacitorGoogleAuth.podspec'), 'utf8');
if (!/GoogleSignIn',\s*'~> 7\.1'/.test(podspec)) {
  console.error('[patch-google-auth-ios] ERROR: podspec does not require GoogleSignIn ~> 7.1');
  process.exit(1);
}

console.log('[patch-google-auth-ios] Applied GoogleSignIn 7.1 iOS patch (fixes ITMS-91061).');
