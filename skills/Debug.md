# Debug Skill (eData Project Guidelines)

Used for systematic troubleshooting, log analysis, fixing errors, and reproducing bug reports.

## When to Trigger
- Handling PHP exceptions, PDO database errors, or HTTP 500 status codes.
- Troubleshooting unexpected behavior or blank pages.
- Reviewing Apache/MySQL log files.

## Guidelines
1. **Analyze Stack Traces:** Read stack traces starting from the top application files downwards to identify the exact file and line number.
2. **Database Reset Check:**
   - If user signup throws an Integrity Exception / Duplicate Entry error on `auth_assignment` (e.g., `'user-X' for key 'PRIMARY'`), it indicates orphan role assignments.
   - Run the orphan cleanup queries found in `reset_database.sql` to purge dirty mappings.
3. **Isolate State:** Check the input variables (`$_POST`, `$_GET`, `$_SESSION`) and database records matching the failure scenario.
4. **Validate Assumptions:** Write test scripts inside the `scratch/` directory to run queries or functions independently.
5. **Clean Fix:** Address the root cause (e.g. key constraints, null pointer references) rather than patching symptoms.
6. **Vending Failover Logs:**
   - If a vending transaction fails or behaves unexpectedly, inspect the `api_response_log` column in the `airtime_data_order` table.
   - The log lists each attempted provider, request URLs, payloads, cURL status/error messages, and raw API response payloads sequentially.
7. **Membership Tier Pricing Debugging:**
   - If pricing seems incorrect for a transaction, verify the user's `user_level` in the database (`0` = Basic, `1` = Referred, `2` = Premium).
   - Check the `referred_price` and `premium_price` configured for the `service_type` (for scratch cards/airtime carrier discounts) or `data_plan` (for data bundles) in the database.
8. **2FA & OTP Debugging:**
   - If a user cannot verify their email, check `verification_token` in the `user` table. It should follow the format `{6-digit-code}:{unix_expiry_timestamp}`. If the timestamp portion is older than the current unix time, the OTP has expired and the user needs to resend.
   - If login is blocked with "Please verify your email", check the user's `status` field — it should be `9` (INACTIVE). Once verified, it should change to `10` (ACTIVE).
   - If Google Sign-In fails, verify the Google Client ID in `SiteController::actionGoogleAuth()` matches the one configured in the Google Cloud Console. Also check that `allow_url_fopen` or cURL is enabled for token verification API calls.
9. **Session Revocation Debugging:**
   - If a user reports being unexpectedly logged out, check if their `auth_key` was recently regenerated (e.g., due to a password change on another device or an admin action).
   - If logout doesn't invalidate other sessions, verify that `SiteController::actionLogout()` calls `$user->generateAuthKey()` and `$user->save(false)` before `Yii::$app->user->logout()`.
   - If sessions persist after password change, verify `AccountController::actionChangePassword()` calls `$user->generateAuthKey()` alongside the password hash update.
10. **Transaction PIN Debugging:**
    - If a user reports checkout blocks without a PIN input, verify that the controller's purchase action redirects to `account/set-pin` when `$user->hasTransactionPin()` is false.
    - If correct PIN keeps getting rejected, check if the bcrypt hash was saved successfully. Reset the PIN via `forgot-pin` to generate a fresh hash.
    - If PIN validation causes CSRF errors, verify that forms containing `<input name="transaction_pin">` are nested inside `ActiveForm::begin()` and `ActiveForm::end()`.
    - If Forgot PIN OTP emails fail to send, inspect email SMTP settings configured inside `common/config/main-local.php`. Verify the `verification_token` field contains the correct `{OTP}:{expiry}` format.
11. **Mailer System Debugging:**
    - If emails are not sending via Resend, verify that `resendApiKey` is configured correctly inside `common/config/params-local.php`.
    - If Resend API key is valid but calls fail, inspect Yii2 logs in `runtime/logs/app.log` for cURL execution errors or non-200 HTTP response payloads returned from `https://api.resend.com/emails`.
    - If failover does not occur when Resend API fails, check `common/components/ResendMailer.php` to ensure the `sendMessage()` method catches exceptions and returns the default parent method execution value.
12. **API & Simulator Integration Debugging:**
   - If mobile API checkouts fail with exception crashes, verify that `ApiController.php` calls `PromoCode::validateCode(...)` statically instead of `$promo->validateCode(...)` or `$promo->calculateDiscount(...)` (which do not exist).
   - If Exam Scratch Card (Category 3) purchases fail, confirm child order records are created using the `ExamScratchCard` model, provider IDs are correctly mapped (WAEC -> 1, NECO -> 2, etc.), and checkout values are sent as `card_type_id` and `quantity`.
   - If data plan promo codes are rejected, verify the frontend extracts the numeric `service_type_id` (the third part of the split composite ID `plan-X-Y`) instead of passing the composite string parameter.
   - If recipient IDs display reference tokens in history tables, verify the backend `transactions` endpoint returns the `phone_or_meter` field.
   - If the mobile simulator fails to start because port 3000 is already in use (EADDRINUSE error), locate the listening process ID on Windows using `netstat -ano | findstr :3000`, and terminate the process using `taskkill /F /PID <PID>` before running `npm run dev` again.
   - If the simulator defaults to local Sandbox Mode instead of syncing with your live database users, check if the local Yii2 backend is offline. The simulator pings the public route `http://localhost/edata/api/detect-network?phone=0803` on load and during login to auto-detect connectivity, using offline sandbox as a connection-failure fallback.
13. **Google OAuth Error 401: invalid_client Debugging:**
    - If Google Sign In displays `Error 401: invalid_client` ("The OAuth client was not found"), check `common/config/params.php` for `googleClientId`.
    - If `googleClientId` has a placeholder format like `518586633606-apiauth325212.apps.googleusercontent.com`, replace it with the real **Web Application OAuth 2.0 Client ID** generated from Google Cloud Console → APIs & Services → Credentials.
    - Ensure Authorized JavaScript origins include `http://localhost` and `https://edata.com.ng`, and Authorized redirect URIs include `http://localhost/edata/google-auth` and `https://edata.com.ng/google-auth`.
14. **Profile Photo Upload Debugging:**
    - Ensure migration `m260721_120000_add_photo_to_profile` has added `photo VARCHAR(255)` to `profile` table.
    - Form tags in `complete-profile.php` and `account/index.php` MUST have `enctype="multipart/form-data"`.
    - File uploads are processed in `SiteController::actionCompleteProfile()` and `AccountController::actionIndex()` using `UploadedFile::getInstanceByName('photo')` and saved to `@frontend/web/uploads/profiles/`.
15. **SSH & Remote Live Server Debugging:**
    - To inspect live server logs without opening interactive terminal password prompts, run a non-interactive Paramiko Python script saved in `scratch/fetch_recent_errors.py` or `scratch/fetch_error_log.py`.
    - Execute remote tail commands targeting `/home/dev/web/edata.com.ng/public_html/frontend/runtime/logs/app.log` or trigger `php yii migrate --interactive=0`.
16. **Live Environment Credentials & Config Protection:**
    - Preserve `common/config/main-local.php` during deployments to ensure production database connection parameters (`dev_airtime_to_cash`) and SMTP mailer secrets are retained.
    - Keep `common/config/main-local.php` in `.gitignore` and run setup scripts (`scratch/fix_server_now.py`) when deploying or recovering live database configurations.
17. **MySQL Illegal Mix of Collations (Error 1271) Debugging:**
    - If UNION SQL queries combining columns from different tables fail with `SQLSTATE[HY000]: General error: 1271 Illegal mix of collations`, explicitly cast variable string columns in subqueries using `CONVERT(column USING utf8mb4) COLLATE utf8mb4_unicode_ci`.
18. **cPanel / GitHub Actions Automated Pipeline Debugging:**
    - When setting up automated cPanel deployments (e.g. for BuyDigital or eData), ensure `.github/workflows/deploy.yml` utilizes secret-based FTP/SSH or cPanel Git Deployment tokens.
    - Check file write permissions on `.cpanel.yml` and target directories (`public_html/` or subfolder) to prevent `403 Forbidden` or deployment script sync failures.
19. **Deferred Transaction PIN & Checkout Interception Debugging:**
    - If a user completes initial login/signup without a 4-digit PIN, verify that financial checkout actions check `hasTransactionPin()`. If false, trigger the PIN creation modal or prompt before allowing purchase completion.
20. **Hostinger Native Mailer & SMTP Debugging:**
    - If emails fail with `getaddrinfo for domain failed: Name or service not known`, ensure the `host` field in `common/config/main-local.php` specifies a valid SMTP server (e.g. `smtp.yandex.com`) or set `'scheme' => 'native'` to use Hostinger's built-in mailer (`sendmail` / `PHP mail()`). Native transport on Hostinger sends emails instantly with 200 OK.
21. **Mobile CORS Preflight Redirect Debugging:**
    - Preflight `OPTIONS` requests sent by browser HTTP clients (such as Axios or `fetch`) fail with CORS errors if redirected. Ensure `frontend/config/main.php` includes explicit wildcard routing for OPTIONS requests: `'OPTIONS api/<action:[\w\/-]+>' => 'api/<action>'`.
22. **DevTools 401 Unauthorized Error Prevention:**
    - In React/Vite applications (`src/services/api.ts`), check for token existence in `localStorage` before initiating authenticated network requests to prevent browser DevTools from showing red HTTP 401 errors on initial page load when unauthenticated.
23. **Google Auth MySQL 1364 Null Default Constraint Debugging:**
    - If Google Auth fails with `Field 'phone' doesn't have a default value`, run migration `m260723_190000_make_profile_fields_nullable` to alter table `profile` columns (`phone`, `firstname`, `lastname`) to `NULL DEFAULT NULL`.
24. **OTP Registration Sandbox Fallback Cleanup:**
    - Ensure registration submit handlers (`MobileSimulator.tsx`, `AuthPage.tsx`) do NOT fall back to local `Sandbox OTP Code: 123456` or gate API requests behind `apiStatus === 'connected'`. Always invoke `api.signupRequest` directly so verification codes are delivered to the user's email.
25. **KatPay Encrypted Key Column Truncation (SQLSTATE 22001) Debugging:**
    - KatPay API secret keys (`katpay_secret_key`) are saved as 340-character encrypted JSON strings (`eyJpdiI6...`). If saving settings throws `Data truncation: 1406 Data too long for column 'katpay_secret_key'`, alter table `setting` columns `katpay_secret_key` and `katpay_public_key` to `TEXT` type (`ALTER TABLE setting MODIFY katpay_secret_key TEXT NULL, MODIFY katpay_public_key TEXT NULL;`).
26. **Admin Panel Missing Users Query Fix:**
    - If registered users exist in `user` table but fail to appear in the Admin Panel user list, check `UserController::actionLoadUsers()`. Ensure queries use `LEFT JOIN profile ON user.id = profile.user_id` instead of an implicit inner join (`FROM user, profile WHERE user.id = profile.user_id`) so unverified or profile-less users are never hidden.
27. **Mandatory End-of-Task Deployment Workflow:**
    - At the conclusion of every single task:
      1. Commit and push the mobile app codebase (`c:\Users\MY PC\Desktop\edata-mobile`) to GitHub `main`.
      2. Commit and push the Yii2 web backend codebase (`c:\xampp\htdocs\edata`) to GitHub `main`.
      3. Deploy/sync the latest code on Hostinger live server (`92.112.192.11`) using `git fetch origin && git reset --hard origin/main` and verify syntax with `php -l`.
28. **Play Store Upload Key Reset Debugging:**
    - If a user loses their original Android signing key for an existing app with Play App Signing enabled, generate a new keystore (`keytool -genkey -v -keystore edata-release-key.jks ...`), export public certificate (`keytool -exportcert -rfc -alias edata-key-alias -file upload_certificate.pem ...`), and submit a key reset request under Play Console -> Setup -> App Integrity.
29. **Package Name Alignment Debugging:**
    - `applicationId` in `android/app/build.gradle` MUST match the live Play Store URL (`https://play.google.com/store/apps/details?id=com.eDATA.app` -> `com.edata.app`). Also update `capacitor.config.ts`, `strings.xml`, and package structure of `MainActivity.java`.
30. **Yii2 Unmapped Route Redirect Debugging:**
    - If custom URL routes (such as `/privacy-policy` or `/delete-account`) automatically redirect to `/` or `/site/login`, check `urlManager.rules` in `frontend/config/main.php`. Ensure explicit mappings exist (e.g. `'privacy-policy' => 'site/privacy-policy'`, `'delete-account' => 'site/delete-account'`). Unmapped URLs fall back to default rules and get redirected by authentication/onboarding filters.
31. **KatPay Webhook & Financial Synchronization Debugging:**
    - Ensure KatPay webhook handlers in `katpay-webhook.php` & `WalletController::actionKatpayWebhook()` execute inside a single atomic database transaction (`Yii::$app->db->beginTransaction()`).
    - Every successful deposit must update `DepositHistory` (`STATUS_SUCCESSFUL`), `Wallet` balance, `ActivityLog`, and insert individual user in-app `Notification` (`GROUP_INDIVIDUAL`).
    - Truncate long merchant references using `substr($reference, 0, 30)` to prevent database column truncation errors (`deposit_history.reference` is `VARCHAR(30)`).
32. **Admin Ledger & Dashboard Recent Transactions Query Debugging:**
    - Never query `deposit_history` or `transaction` using implicit inner joins with `profile` (`FROM deposit_history, profile`). Use `LEFT JOIN profile ON deposit_history.created_by = profile.user_id LEFT JOIN user ON deposit_history.created_by = user.id` with fallback `COALESCE(NULLIF(TRIM(CONCAT(profile.firstname, ' ', profile.lastname)), ''), user.email, CONCAT('User #', created_by))` so users without profile records (e.g. Google Sign-In users) render reliably in Admin tables.
    - Merge `transaction` and `deposit_history` via `UNION ALL` in `SiteController::actionIndex()` so both deposits and purchases appear in the Admin Dashboard Recent Transactions table.

