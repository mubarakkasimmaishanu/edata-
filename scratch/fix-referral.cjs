const fs = require('fs');
const root = 'C:/xampp/htdocs/edata/';
function edit(path, before, after) {
  const original = fs.readFileSync(root + path, 'utf8');
  const content = original.replace(/\r\n/g, '\n');
  if (!content.includes(before)) throw new Error('Source mismatch in ' + path);
  const result = content.replace(before, after);
  fs.writeFileSync(root + path, original.includes('\r\n') ? result.replace(/\n/g, '\r\n') : result);
}
edit('.htaccess', '# ─── 6. LEGACY / CLASSIC DASHBOARD ACCESS ───', '# Referral landing pages must reach Yii before the customer SPA catch-all.\nRewriteRule ^(?:join/?|r/[A-Za-z0-9_.-]+/?)$ frontend/web/index.php [QSA,L]\n\n# ─── 6. LEGACY / CLASSIC DASHBOARD ACCESS ───');
edit('frontend/controllers/SiteController.php', "$this->layout = false; // Dedicated clean, high-performance responsive landing page", "$this->layout = false; // Dedicated clean, high-performance responsive landing page\n        Yii::$app->response->headers->set('Cache-Control', 'private, no-store, max-age=0');\n        Yii::$app->response->headers->set('Vary', 'User-Agent');");
edit('frontend/controllers/SiteController.php', "$webSignupUrl = \\yii\\helpers\\Url::to(['site/signup', 'ref' => $cleanRef, 'click_id' => $clickId], true);", "$webSignupUrl = \\yii\\helpers\\Url::to(['/app/', 'mode' => 'signup', 'ref' => $cleanRef, 'click_id' => $clickId], true);");
edit('frontend/views/site/join.php', '    // Helper: Safe clipboard write with fallback', `    var storeRedirectTimer = null;
    function cancelStoreRedirect() {
      if (storeRedirectTimer !== null) clearTimeout(storeRedirectTimer);
      storeRedirectTimer = null;
    }
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) cancelStoreRedirect();
    });

    // Helper: Safe clipboard write with fallback`);
edit('frontend/views/site/join.php', '    function handleStoreClick(e) {\n      if (e) e.preventDefault();', '    function handleStoreClick(e) {\n      if (e) e.preventDefault();\n      cancelStoreRedirect();');
edit('frontend/views/site/join.php', `      setTimeout(function() {
        if (isAndroid && androidIntentUrl) {
          window.location.href = androidIntentUrl;
        } else {
          window.location.href = playStoreUrl;
        }
      }, 150);`, `      // HTTPS works when a browser blocks an Android intent or market URI.
      window.location.href = playStoreUrl;`);
edit('frontend/views/site/join.php', '    function handleWebSignupClick(e) {', '    function handleWebSignupClick(e) {\n      cancelStoreRedirect();');
edit('frontend/views/site/join.php', `      setTimeout(function() {
        if (refCode) {
          writeToClipboard('edata-ref:' + refCode);
        }
        if (androidIntentUrl) {
          window.location.href = androidIntentUrl;
        } else {
          window.location.href = playStoreUrl;
        }
      }, 2900);`, `      storeRedirectTimer = setTimeout(function() {
        if (document.hidden) return;
        if (refCode) writeToClipboard('edata-ref:' + refCode);
        window.location.href = playStoreUrl;
      }, 2900);`);
