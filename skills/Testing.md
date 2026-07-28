# Testing Skill (eData Project Guidelines)

Used for planning, writing, and executing automated tests, as well as outlining manual verification protocols.

## When to Trigger
- Writing new business logic, calculations, or models.
- Validating bug fixes before shipping.
- Formulating verification steps in the walkthrough files.

## Guidelines
1. **Unified Transactions Page & Tab Filter Checks:**
   - Verify that clicking "Recent Transactions" in the sidebar navigation or navigating to category-specific transaction filters ("Airtime History", "Data History") routes to the unified history page and correctly triggers the tab filter and server-side UNION query results.
   - Confirm that wallet funding history remains fully functional in both the unified transaction index page and the dedicated history table inside the wallet index page.
2. **Local Signup checks:**
   - Test signups locally on localhost to verify that registrations complete without captcha errors.
3. **Automated Verification:** Draft code unit tests or integration tests when possible.
4. **Edge Cases:** Test boundary inputs, negative numbers, empty arrays, and invalid parameters.
5. **Validation Scripts:** Write temporary scripts to test DB constraints and functions in isolation.
6. **Failover Verification Protocol:**
   - When verifying changes to vending logic, test failover behavior by intentionally setting invalid credentials or endpoints for Provider 1, and valid mock/test credentials/endpoints for Provider 2.
   - Run a test purchase and check that the transaction resolves to `Success` and that the `api_response_log` confirms the correct transitions and status changes between providers.
7. **Multi-Tier Membership System Checks:**
   - Verify that new user signups default to `LEVEL_BASIC` and display the "Basic Member" slate badge.
   - Test upgrade triggers inside "My Profile" with both sufficient and insufficient wallet balances.
   - Verify that upgrade requests successfully deduct the configured fee immediately and write pending entries to the database.
   - Test admin review approvals: confirm status is updated to `Approved` and the user's level changes to Premium.
   - Test admin review rejections: confirm status is updated to `Rejected` and the upgrade fee is refunded to the user's wallet.
   - Verify that MTN/Glo/Airtel airtime and data plan transactions charge the correct amount dynamically based on the current user's level.
   - Test referral link tracking: navigate to signup page with `?ref=X` (valid user ID), register, and verify the new user has `referred_by` set to `X` and `user_level` set to `User::LEVEL_REFERRED`.
   - Check client referral card: verify the referral invitation card renders in the profile page, and the Copy Link utility copies the exact link to the clipboard.
   - Test manual admin updates: in the admin backend, select a user profile, change their membership tier using the level selector form, save, and verify that the level updates, correct pricing applies to their next transaction, and the action is recorded in the Activity Log.
8. **Promo Code & Sub Admin Allocation Verification**:
   - Validation Checklists: Test promo code validations using invalid codes, inactive statuses, expired dates, and mismatched service type restrictions. Verify that descriptive, user-friendly error messages are returned in each scenario.
   - Single-Redemption & Global Checks: Redeem a code as User X. Verify the discount applies. Try to redeem it again as User X; verify it is blocked. Complete redemptions up to the code's global limit; verify the code is blocked globally on subsequent attempts.
   - Sub Admin Referrer Checks: Create a promo code restricted to Sub Admin A. Validate the code as User Y (referred by Sub Admin A) and check that it succeeds. Validate it as User Z (referred by Sub Admin B or not referred) and check that validation blocks it.
   - Sub Admin Allocation Check: Set Sub Admin A's allocation limit to 2. Complete two successful redemptions using referred users of Sub Admin A. Verify that the 3rd user's validation attempt fails.
   - Checkout Audits: Verify that completed promo transactions log the promo code ID and discount amount in the `transaction` table, and write a redemption row to the `promo_code_usage` table.
9. **Google Sign-In & 2FA Verification:**
   - Test Google Sign-In: Click "Continue with Google" on both login and signup pages. Verify that new Google users are auto-created with `STATUS_ACTIVE` (bypassing 2FA) and existing Google users are logged in directly.
   - Test Local Signup 2FA: Register a new user via email/password. Verify account status is `STATUS_INACTIVE`. Attempt login and confirm it is blocked with a redirect to verification.
   - Test OTP Verification: Navigate to `site/verify-email`, enter the 6-digit OTP code, and verify the account is activated. Test with an expired OTP (>20 minutes) and confirm rejection. Test with an invalid code and confirm rejection.
   - Test OTP Resend: Click "Resend Code" on the verification page and confirm a new OTP is generated with a refreshed timestamp.
   - Test Edge Cases: Try verifying an already-active account, try Google auth with a non-Google email, try registering with an email that already has a Google account.
10. **Session Persistence & Revocation Verification:**
    - Test Persistence: Log in, close the browser completely, reopen it, and verify the user is still logged in (30-day cookie).
    - Test Logout Revocation: Log in on two different browsers/devices. Log out on one. Refresh the other and verify the session is invalidated (redirected to login).
    - Test Password Change Revocation: Log in on two browsers. Change password on one. Verify the other browser's session is immediately invalidated on next request.
    - Test `auth_key` Integrity: After logout or password change, verify the `auth_key` value in the database differs from the previous value.
11. **Transaction PIN System Verification:**
    - Test Signup validation: Register a new user. Verify signup blocks if PIN or Confirm PIN is empty, not numeric, not 4 digits, or does not match. Confirm successful signup saves the bcrypt hash.
    - Test Zero PIN Redirect: Log in with a user who does not have a PIN (e.g. newly created Google Auth user). Try purchasing any service (Airtime/Data/Scratch Card/Cable TV/Electricity) or request premium membership upgrade. Verify they are immediately redirected to the `account/set-pin` page.
    - Test PIN Validation: Set a PIN. Try to purchase any service. Verify correct PIN proceeds with checkout. Verify incorrect PIN rejects with an error.
    - Test PIN Management Forms:
      - Set PIN: verify it blocks if a PIN is already set.
      - Change PIN: verify it blocks if current PIN is incorrect, or if new PIN does not match confirm PIN.
      - Forgot PIN request: verify OTP code is sent to registered email.
      - Forgot PIN verify: verify resetting PIN works with correct OTP and blocks with expired or incorrect OTP.
12. **Mailer System Verification:**
    - Verify Mailer Component: Run a check verifying that `Yii::$app->mailer` resolves to `common\components\ResendMailer`.
    - Test SMTP Fallback (Resend API key empty): Temporarily comment out or clear the `resendApiKey` in `params-local.php`. Send an email (e.g. forgot password request). Confirm that standard SMTP is selected and successfully sends the email.
    - Test Resend API Sending (Resend API key set): Configure a valid Resend API key. Send a transactional email (e.g. signup OTP). Verify that the email arrives instantly, and logs show execution through Resend HTTP API.
13. **Network Auto-Detection Verification:**
    - Test Auto-Detection: Enter phone numbers with standard Nigerian prefixes (e.g., `0803...` for MTN, `0805...` for Glo, `0802...` for Airtel, `0909...` for 9mobile). Verify the correct network badge and icon display immediately in the UI.
    - Test Manual Override: Click manual operator buttons to change the detected network. Verify the selected network updates correctly, the plan dropdown list changes dynamically, and payment form endpoints are updated to match the manual choice.
    - Test Mobile App Sync: Type numbers in the simulator's Airtime/Data/A2C fields. Verify auto-detection changes the network selection dropdown and displays the operator name/icon dynamically.
14. **Public Compliance & Account Deletion Verification**:
    - Test `/privacy-policy` and `/delete-account` URLs via HTTP requests (`curl` or browser). Confirm **200 OK** response and 0 redirects.
    - Test Account Deletion form submission with invalid credentials; verify error message displays and account remains active.
    - Test Account Deletion form submission with correct credentials; verify user status changes to `STATUS_BLOCKED`, session is terminated, activity log is written, and user is redirected to home page.
    - Test release AAB build verification: `cd android && gradlew bundleRelease`.
