# Security Skill (eData Project Guidelines)

Used for evaluating and fixing authentication, permission rules (RBAC), SQL injection risks, CSRF protections, and credential leak risks.

## Guidelines
1. **API Configurations & Key Security:**
   - Centralize provider API credentials inside `service_api_config`.
   - Restrict access to configuration actions utilizing strict RBAC checks: `Yii::$app->user->can('superadmin')`.
2. **Password Recovery Security:**
   - `actionForgotPassword` generates a 6-digit cryptographic OTP stored in `verification_token` along with an expiration timestamp (`{code}:{unix_expiry_timestamp}`).
   - OTP tokens expire automatically after 20 minutes.
   - Responses use generic success messages (*"If an account exists with that email..."*) to prevent user enumeration attacks.
3. **Transaction PIN Security & Identity Verification:**
   - PINs are stored securely as bcrypt hashes using `Yii::$app->security->generatePasswordHash()`. Never store plain text PINs.
   - Input fields for PINs must be numeric, 4 digits, masked (`type="password"`), and restricted via `maxlength="4"`.
   - Forgot PIN resets (`actionForgotPin`) require a 2-step email OTP verification process before updating the PIN hash in the database.
   - All PIN updates and resets are recorded in the `ActivityLog` table.
4. **Google Sign-In Token Verification:**
   - Always verify Google JWT ID tokens server-side. Never trust client-side token payloads without server verification.
   - Use official 4-color Google "G" SVG branding on client sign-in buttons.
5. **Data Sanitation & Parameterized Queries:**
   - All SQL queries use parameterized command bindings or Active Record to prevent SQL injection.
6. **Session Revocation & Single-Session Enforcements:**
   - Calling `User::generateAuthKey()` immediately revokes all active sessions across devices upon logout or password reset.
7. **Android App Signing & Manifest Security**:
   - `android:allowBackup="false"` in `AndroidManifest.xml` prevents unauthorized ADB backup extraction of local storage & session state.
   - Key Protection: Keystores (`*.jks`, `*.keystore`) are gitignored in `.gitignore`.
8. **Authenticated Account Deactivation & Audit Trail**:
   - Account deletion requests require password verification (`$user->validatePassword($password)`).
   - Deactivation immediately sets `status = User::STATUS_BLOCKED` and revokes `auth_key`.
   - All deletion actions log entries into `ActivityLog`.
