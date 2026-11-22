const fs = require('fs');
const root = 'C:/xampp/htdocs/edata/';
const config = root + 'common/config/params.php';
const api = root + 'frontend/controllers/ApiController.php';
const newId = '518586633606-cicn4tnirn59flm3mv384ja7nt42c7vg.apps.googleusercontent.com';
function edit(file, anchor, replacement) {
  const current = fs.readFileSync(file, 'utf8');
  if (current.split(anchor).length !== 2) throw Error('Unexpected source in ' + file);
  fs.writeFileSync(file, current.replace(anchor, replacement));
}
const configSource = fs.readFileSync(config, 'utf8');
const nativeEntry = configSource.match(/^    'googleClientId' => '[^']+',/m)[0];
const newline = configSource.includes('\r\n') ? '\r\n' : '\n';
edit(config, nativeEntry, nativeEntry + newline + "    'googleWebClientId' => '" + newId + "',");
const apiSource = fs.readFileSync(api, 'utf8');
const macro = 'GoogleAccessTokenVerifier::verify($accessToken, $webClientId)';
if (apiSource.split(macro).length !== 2) throw Error('Unexpected web verifier call');
fs.writeFileSync(api, apiSource.replace(macro, "GoogleAccessTokenVerifier::verify($accessToken, Yii::$app->params['googleWebClientId'] ?? $webClientId)"));

