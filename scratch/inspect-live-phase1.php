<?php
$root = '/home/dev/web/edata.com.ng/public_html';
require $root . '/vendor/autoload.php';
require $root . '/vendor/yiisoft/yii2/Yii.php';
$config = require $root . '/common/config/main-local.php';
$db = Yii::createObject($config['components']['db']);
$results = [];
foreach ([
    'virtual_accounts' => 'SELECT COUNT(*) FROM user_virtual_account',
    'missing_provider' => "SELECT COUNT(*) FROM user_virtual_account WHERE provider IS NULL OR TRIM(provider) = ''",
    'orphaned_accounts' => 'SELECT COUNT(*) FROM user_virtual_account a LEFT JOIN user u ON u.id=a.user_id WHERE u.id IS NULL',
    'duplicate_numbers' => 'SELECT COUNT(*) FROM (SELECT account_number FROM user_virtual_account GROUP BY account_number HAVING COUNT(*)>1) a',
] as $label => $sql) $results[$label] = (int)$db->createCommand($sql)->queryScalar();
$results['phase1_migrations'] = $db->createCommand("SELECT version FROM migration WHERE version LIKE 'm261112_12%' OR version LIKE 'm261112_13%'")->queryColumn();
$path = $root . '/frontend/runtime/logs/payvessel_webhook_audit.log';
$shapes = [];
$missingSignatures = 0;
$signedEvents = 0;
if (is_file($path)) {
    $file = fopen($path, 'rb');
    fseek($file, max(0, filesize($path) - 2000000));
    while (($line = fgets($file)) !== false) {
        if (strpos($line, 'SIGNATURE: ') === 0) {
            strlen(trim(substr($line, 11))) ? $signedEvents++ : $missingSignatures++;
        }
        if (strpos($line, 'PAYLOAD: ') !== 0) continue;
        $data = json_decode(substr($line, 9), true);
        if (!is_array($data)) continue;
        $shape = ['keys' => array_keys($data)];
        foreach ($data as $key => $value) {
            if (is_array($value)) $shape[$key . '_keys'] = array_keys($value);
        }
        foreach (['status', 'code', 'message', 'event'] as $key) {
            if (!isset($data[$key]) || !is_scalar($data[$key])) continue;
            $v = strtolower((string)$data[$key]);
            $shape[$key] = in_array($v, ['success','successful','completed','paid','00','true','1','failed','pending','payment.success','payment.successful'], true) ? $v : 'other';
        }
        $shapes[hash('sha256', json_encode($shape))] = $shape;
    }
    fclose($file);
}
$results['recent_webhook_signatures'] = ['present' => $signedEvents, 'missing' => $missingSignatures];
$results['recent_webhook_shapes'] = array_slice(array_values($shapes), -6);
echo json_encode($results, JSON_PRETTY_PRINT) . PHP_EOL;
