#!/usr/bin/env bash
set -euo pipefail
root=/home/dev/web/edata.com.ng/public_html
stage=/home/dev/phase1-release-20261112
release=654cd572f2e107a9e5c9c5c226da71edcf451495
cd "$root"
git diff --quiet
git diff --cached --quiet
git fetch origin
test "$(git rev-parse origin/main)" = "$release"
git merge-base --is-ancestor HEAD "$release"
umask 077
git rev-parse HEAD > "$stage/previous-commit.txt"
git archive HEAD > "$stage/previous-release.tar"
mkdir -p "$stage/migrations" "$stage/candidate"
for name in m261112_120000_create_payvessel_payment_claim m261112_130000_create_payvessel_unmatched_payment; do
    git show "$release:console/migrations/$name.php" > "$stage/migrations/$name.php"
    php -l "$stage/migrations/$name.php"
done
git archive "$release" common/components/GoogleAccessTokenVerifier.php common/components/PayvesselCreditGuard.php common/components/PayvesselSettlement.php common/components/PayvesselUnmatchedPayment.php common/components/PayvesselService.php frontend/controllers/ApiController.php frontend/controllers/WalletController.php frontend/web/payvessel-webhook.php backend/controllers/DepositController.php backend/views/deposit/unmatched-payments.php | tar -x -C "$stage/candidate"
find "$stage/candidate" -name '*.php' -print0 | xargs -0 -n 1 php -l
php yii migrate/up --migrationPath="$stage/migrations" --interactive=0
git merge --ff-only "$release"
test "$(git rev-parse HEAD)" = "$release"
printf 'DEPLOYED_COMMIT=%s\n' "$release"
php "$stage/inspect.php"
