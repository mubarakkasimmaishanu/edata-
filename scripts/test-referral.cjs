const assert = require('node:assert/strict');
const vm = require('node:vm');
const esbuild = require('esbuild');

async function run() {
  const result = await esbuild.build({
    entryPoints: ['src/services/deepLink.ts'], bundle: true, write: false,
    format: 'cjs', platform: 'node',
    plugins: [{
      name: 'native-test-fixtures',
      setup(build) {
        build.onResolve({ filter: /^@capacitor\// }, args => ({ path: args.path, namespace: 'fixture' }));
        build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: `
          export const Capacitor = {isNativePlatform: () => globalThis.native, getPlatform: () => globalThis.native ? 'android' : 'web'};
          export const registerPlugin = () => ({});
          export const App = {addListener: () => {throw new Error('Unexpected native listener');}};
          export const Clipboard = {};
        ` }));
      },
    }],
  });
  function fixture(url, { native = false, blockedStorage = false } = {}) {
    const stored = new Map();
    const context = {module: {exports: {}}, console, native, window: {location: {href: url}},
      localStorage: {
        getItem(key) { if (blockedStorage) throw new Error('Storage blocked'); return stored.get(key) ?? null; },
        setItem(key, value) { if (blockedStorage) throw new Error('Storage blocked'); stored.set(key, value); },
        removeItem(key) { stored.delete(key); },
      },
    };
    vm.runInNewContext(result.outputFiles[0].text, context);
    return {api: context.module.exports, stored};
  }
  for (const url of [
    'https://edata.com.ng/join?ref=NBD-295',
    'https://edata.com.ng/r/NBD-295',
    'https://edata.com.ng/app/?mode=signup&ref=nbd-295',
    'https://edata.com.ng/app/?ref=NBD%2D295',
  ]) {
    const {api} = fixture(url);
    api.captureBrowserReferral();
    assert.equal(api.getPendingReferral(), 'NBD-295');
    api.initDeepLinking();
  }
  const {api, stored} = fixture('https://edata.com.ng/app/?ref=NBD-295&click_id=clk_fixture');
  api.captureBrowserReferral();
  assert.equal(stored.get('edata_pending_click_id'), 'clk_fixture');
  api.clearPendingReferral();
  assert.equal(api.getPendingReferral(), null);
  const blocked = fixture('https://edata.com.ng/app/?ref=NBD-295', {blockedStorage: true});
  blocked.api.captureBrowserReferral();
  assert.equal(blocked.api.getPendingReferral(), 'NBD-295');
  const native = fixture('https://localhost/?ref=WRONG', {native: true});
  native.api.captureBrowserReferral();
  assert.equal(native.api.getPendingReferral(), null);
  const ordinary = fixture('https://edata.com.ng/');
  ordinary.api.captureBrowserReferral();
  assert.equal(ordinary.api.getPendingReferral(), null);
  console.log('PASS referral URLs, fresh browser capture, click tracking, blocked storage, clearing, and native isolation');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
