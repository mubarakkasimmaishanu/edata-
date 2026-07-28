# Review Skill (eData Project Guidelines)

Used for reviewing source code for correctness, patterns, styling, readability, and performance.

## When to Trigger
- Prior to finalizing any PR, branch merge, or file updates.
- Inspecting code written by other agents or checking code for quality.
- Verifying conformity with standard PHP, MVC, and Yii2 coding paradigms.

## Guidelines
1. **Rebranding Verification:** 
   - Ensure absolutely no references to `BuyDigital` or `buydigital.ng` are introduced.
   - Verify that all customer support emails are mapped to `info@edata.com.ng` and logo branding is centered on `EDATA`.
2. **Purge Verification:**
   - Double-check that no deleted JAMB models are referenced or imported in revised scripts (specifically inside `common/models/Transaction.php` and `common/components/OrderTimer.php`).
3. **Correctness:** Double check syntax, imports, dependencies, namespace declarations, and error handling.
4. **Efficiency & Performance:** Look out for N+1 queries, unindexed queries, expensive memory allocations, or redundant operations.
5. **Format & Readability:** Ensure uniform indentation, meaningful variable/method names, and preserve original docstrings.
6. **Vending Remark Preservation:**
   - When reviewing modifications to vending logic, verify that successful order requests save the exact provider message/reference directly into the `remark` column. This is critical as the payment gateway webhooks search the table matching this exact reference value.
7. **Authentication Flow Consistency:**
   - Ensure `SiteController::actionLogout()` regenerates `auth_key` before calling `logout()` to revoke all active sessions.
   - Ensure `AccountController::actionChangePassword()` regenerates `auth_key` alongside the password hash update.
   - Verify Google Sign-In action disables CSRF in `beforeAction()` since it receives a POST from Google's client-side library.
   - Confirm new user signups set `status = User::STATUS_INACTIVE` and generate a 6-digit OTP code.
8. **Promo Code Cross-Service Consistency:**
   - When reviewing any purchase controller (`AirtimeDataController`, `ScratchCardController`, `CableTvController`, `ElectricityController`), verify all 4 have: `use` imports for PromoCode/PromoCodeUsage/PromoCodeAssignment, `POST promo_code` read, `PromoCode::validateCode()` call, `$payableAmount` calculation, usage logging, and counter increments.
   - Corresponding view files must have: `promo-code-input`, `apply-promo-btn`, `promo-status-msg`, AJAX POST to `promo/validate`, and `name="promo_code"` on the input.
9. **Color Palette Safety Check (CRITICAL):**
   - The mobile app uses a **unified sky-blue-only color palette**. During code review, verify that NO Tailwind color families other than `sky-*`, `slate-*`, and `rose-*` are introduced.
   - **Allowed:** `sky-*` (brand accents, icons, badges, indicators), `slate-*` (neutral text, backgrounds), `rose-*` (errors/failures only), wallet gradient `from-[#0051d5] to-[#0ea5e9]`, dark backgrounds `bg-[#111111]`/`bg-[#1D1D1D]`.
   - **Prohibited:** `emerald-*`, `amber-*`, `cyan-*`, `purple-*`, `indigo-*`, `orange-*`, `green-*`, `yellow-*`, `teal-*`, `violet-*`, `fuchsia-*`, `lime-*`, `pink-*`, `blue-*`, `red-*`.
   - Run `grep -E "emerald|amber|cyan|purple|indigo" MobileSimulator.tsx` to verify zero matches.
10. **Dashboard Compact Layout Preservation:**
    - The home dashboard has been specifically optimized to fit within a phone viewport with minimal scrolling. Do not increase padding, margins, gaps, card heights, icon sizes, or font sizes on the home tab without explicit user approval.
    - Key sizing anchors: wallet card `p-3`, tab container `p-3 space-y-3`, home content `space-y-2`, quick transfer buttons `w-9 h-9`, services grid icons `w-8 h-8`, membership cards `h-[100px]`.
11. **Package Name Consistency & Play Store Alignment Check**:
    - Verify that `applicationId` in `android/app/build.gradle` is set to `com.edata.app`.
    - Confirm matching package entries in `capacitor.config.ts`, `strings.xml`, and `MainActivity.java`.
    - Ensure `versionCode` is incremented relative to the previous live build on Play Console.
12. **Compliance Route Mapping & Protection Check**:
    - Verify `frontend/config/main.php` includes explicit route mappings for `privacy-policy` and `delete-account`.
    - Confirm public access without redirect loops or fallback intercepts.
