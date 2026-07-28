# Documentation Skill (eData Project Guidelines)

Used for writing, editing, and updating codebase documentation, API specifications, and README guides.

## Guidelines
1. **Reference Core Architecture:**
   - Align documentation changes to [Architecture.md](file:///c:/xampp/htdocs/edata/Architecture.md) and [MobileIntegration.md](file:///c:/xampp/htdocs/edata/Skills/MobileIntegration.md).
2. **API Endpoint Specifications:**
   - Keep REST API endpoints documented across all 6 service categories (Airtime, Data, Exam Pins, Cable TV, Electricity, A2C).
   - Document authentication rules for public endpoints (`login`, `google-auth`, `detect-network`, `forgot-password`) and bearer-authenticated endpoints (`profile`, `wallet`, `transactions`, `services`, `validate`, `promo`, `purchase`, `upgrade`, `set-pin`, `change-pin`, `forgot-pin`).
3. **Brand Asset Specs:**
   - Document standard placement for official **eData** brand emblem (`edata_logo.png`) and official 4-color Google Identity emblem.
4. **Accuracy:** Keep installation details, code snippets, and database structures accurate.
5. **Public & In-App Compliance Endpoint Documentation:**
   - Public Privacy Policy Web Page: `https://edata.com.ng/privacy-policy`
   - Public Account Deletion Web Page: `https://edata.com.ng/delete-account`
   - REST API Account Deletion Endpoint: `POST /api/delete-account` (requires Bearer token authentication & password confirmation)
6. **Admin Panel Configuration Routes:**
   - Streamlined 3-Tier API Routing Page: `https://edata.com.ng/office/configuration/api`
   - Dedicated Payment Gateways Page (Paystack & Katpay): `https://edata.com.ng/office/configuration/payment`
