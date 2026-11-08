# Physical Product Integration & Middleman Aggregator (STATUS: IMPLEMENTED & VERIFIED)

This specification defines the complete end-to-end architecture, backend controls, REST APIs, and mobile client UI components for the eData Physical Product Integration module.

---

## 1. Business & Architectural Model

### 1.1 Middleman Aggregator Model
- **Non-Inventory Platform**: eData does not directly manufacture, warehouse, or deliver physical hardware. Instead, it operates as a secure middleman aggregator connecting end users with verified hardware distributors, meter vendors, POS aggregators, and device merchants.
- **Administrative Processing Fee**: eData charges a non-refundable administrative fee (default ₦5,000, dynamically configured by Admin per user membership tier: Basic vs. Premium) directly debited from the user's active wallet balance upon request submission.
- **Admin Control**: 100% of physical product catalog items, prices, installment plans, gallery images, specifications, DisCo providers, POS terminal types, and post-payment instructions are configured via the backend Admin Dashboard. The mobile client (React + Capacitor) functions strictly as a UI mirror.

---

## 2. Core Product Lines & Workflows

### 2.1 Prepaid Meters
- **Category Code**: `prepaid_meter`
- **Icon**: Electricity Meter
- **Flow**:
  1. Select Applicant Type: **Personal Use** or **Buying for Another Person**.
  2. Select Distribution Company (DisCo): EKEDC, IKEDC, AEDC, IBEDC, KEDCO, JED, PHED, EEDC, YEDC, BEDC, KAEDCO.
  3. Select Meter Type: Single Phase (1 Phase), Three Phase (3 Phase), Maximum Demand (MD).
  4. Select State (all 37 Nigerian States) & Local Government Area (774 LGAs).
  5. Old Meter / Existing Bill Verification:
     - Toggle: *Does applicant have an existing bill or old meter?*
     - If Yes: collect Old Meter / Account Number & Name on Bill.
  6. Delivery Address & Contact Phone Number.
  7. Fee Breakdown & 4-Digit Transaction PIN Confirmation.
  8. Submission as `Pending Request` in Admin Dashboard.
  9. Direct link to Live Chat Agent on WhatsApp.

### 2.2 Installment Phones (Flexible Pay-Small-Small)
- **Category Code**: `installment_phone`
- **Icon**: Smartphone / Device Brand
- **Visual Design Reference**: Modern device installment interface:
  - 2-Column Catalog Grid with product thumbnail, price badge, product name, and available installment options.
  - Detail View with:
    - Multiple gallery images with counter pill (`1/6`).
    - Prominent outright cash price and flexible installment plan cards:
      - 2 Months (Monthly breakdown)
      - 4 Weeks (Weekly breakdown)
      - 3 Months, 6 Months, etc.
    - Delivery Availability Badge (e.g. `Ships now`, `Ships next week`).
    - Storage Capacity Pills (e.g. 64GB, 128GB, 256GB).
    - Color Variant Pills.
    - Technical Specifications accordion.
    - Quality Guarantee Card (e.g., Battery health > 70%, 100% functional, SIM-unlocked).
- **Application Flow**:
  1. Applicant Type: Personal vs Another Person.
  2. State & LGA selection.
  3. Delivery Address.
  4. Contact Phone Number & Applicant NIN (National Identity Number).
  5. ₦5,000 Admin Fee payment via 4-Digit PIN.
  6. Post-Payment Notice: *"A guarantor will be required upon delivery."*
  7. WhatsApp Live Chat Agent button.

### 2.3 POS Device Terminals & 60-Day Retrieval Policy
- **Category Code**: `pos_device`
- **Icon**: Point of Sale Terminal
- **Brands Supported**: Moniepoint, Kuda, Kolomoni, OPay, PalmPay (dynamically manageable).
- **Terminal Types**:
  - `Digital (Android)` - Smart touchscreen with thermal receipt printer.
  - `MPOS (Mini)` - Bluetooth pocket terminal.
- **Flow**:
  1. Select POS Brand.
  2. Applicant Type: Personal vs Another Person.
  3. Select Terminal Type.
  4. State & LGA selection.
  5. Delivery Address.
  6. Phone Number, Applicant NIN, and Applicant BVN (Bank Verification Number).
  7. Prominent Inactivity & Retrieval Warning:
     > **Policy Notice**: If this POS terminal remains inactive for **60 consecutive days**, it will be automatically flagged and retrieved by company field officers.
  8. Fee payment via 4-Digit PIN.
  9. WhatsApp Live Chat Agent button.

### 2.4 Other Physical Products ("Others")
- **Category Code**: `others`
- **Icon**: Utility Products / Solar Inverter / Smart Appliances
- **Mandatory Feature**: **Auto-Sliding Image Carousel displaying > 5 images** every 3.5 seconds with touch-pause, swipe gestures, and active pagination indicator dots.
- **Flow**:
  1. Product Catalog browsing & detail preview.
  2. Applicant Type: Personal vs Another Person.
  3. State, LGA, Delivery Address, and Contact Phone Number.
  4. Fee payment via 4-Digit PIN.
  5. WhatsApp Live Chat Agent button.

---

## 3. Applicant Types & Profile Synchronization

### 3.1 Buying for Personal Use
- System queries `GET /index.php?r=api/physical-products-profile-data`.
- Auto-populates `full_name`, `phone`, `email`, `state`, `lga`, `address`, `nin`, and `bvn` from existing `User` and `Profile` models.
- If user submits missing fields (e.g., new address or NIN), the backend automatically saves newly submitted details back to `profile` and `user` tables.

### 3.2 Buying for Another Person (`third_party`)
- Renders blank recipient fields for applicant details.
- Automatically captures the logged-in user's credentials into the **Guarantor** section (`guarantor_name`, `guarantor_phone`, `guarantor_email`, `guarantor_user_id`, `custom_attributes.guarantor_address`).
- Post-Payment Notice: *"This applicant will be contacted within the next Three Hours."*

---

## 4. Backend Database Schemas

### 4.1 Tables Created (Migration `m261106_120000_create_physical_products_tables.php`)
1. **`physical_product`**:
   - `id`, `category` (`prepaid_meter`, `installment_phone`, `pos_device`, `others`)
   - `name`, `brand`, `model_number`, `description`, `price`, `slash_price`
   - `image_url`, `gallery_images` (JSON array of image URLs)
   - `specifications` (JSON key-value pairs)
   - `is_active`, `is_featured`, `sort_order`, `stock_status`
   - `admin_fee_basic`, `admin_fee_premium`
   - `post_payment_info` (custom text displayed post-purchase)
2. **`physical_product_plan`**:
   - `id`, `product_id`, `plan_name`, `frequency` (`weekly`, `monthly`, `outright`)
   - `frequency_label`, `duration_value`, `installment_amount`, `down_payment`
   - `shipping_badge` (`Ships now`, `Ships next week`, etc.)
   - `is_default`, `is_active`, `sort_order`
3. **`physical_product_request`**:
   - `id`, `reference` (unique tracking ID, e.g. `PR-MTR-672C19...`)
   - `user_id`, `product_id`, `service_type_code`
   - `application_type` (`personal`, `third_party`)
   - `applicant_name`, `applicant_phone`, `applicant_email`
   - `delivery_state`, `delivery_lga`, `delivery_address`
   - `applicant_nin`, `applicant_bvn`
   - `meter_type`, `disco_name`, `old_meter_number`, `old_meter_name`
   - `pos_terminal_type`, `pos_brand`
   - `plan_id`, `installment_frequency`, `installment_amount`
   - `admin_fee_paid`, `transaction_id`
   - `status` (`pending`, `processing`, `approved`, `rejected`, `delivered`)
   - `guarantor_user_id`, `guarantor_name`, `guarantor_phone`, `guarantor_email`
   - `retrieval_status` (`normal`, `flagged_60_days`, `retrieved`)
   - `last_active_at`, `custom_attributes` (JSON)
4. **Service Type Hierarchy**:
   - Category ID 7: `Physical Products`
   - Service Type 47: `Prepaid Meter`
   - Service Type 48: `Installment Phone`
   - Service Type 49: `POS Device`
   - Service Type 50: `Other Physical Products`

---

## 5. Security & Financial Safeguards

1. **KYC Requirement**:
   - Users must complete Level 2 KYC to access physical product checkout.
   - If KYC is incomplete, system blocks checkout and redirects to Verification.
2. **Transaction PIN Guard & Anti-Brute Force**:
   - Every submission requires a 4-digit PIN.
   - 5 failed attempts trigger a 15-minute lockout via `PinService`.
3. **Strict Wallet Balance Validation**:
   - Admin fee is checked against current wallet balance.
   - If balance is insufficient, transaction **strictly aborts** and prompts user to Fund Wallet. No negative balances allowed.
4. **Atomic Wallet Debit**:
   - Debited using `Wallet::debitAtomic($userId, $adminFee, $ref, $description)`.
5. **Unified Transaction Logging**:
   - Recorded in `transaction` table with category ID 7.
   - PDF receipt generated via `ReceiptService.php`.

---

## 6. REST API Endpoints

All endpoints are hosted on `frontend/controllers/ApiController.php`:

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `?r=api/physical-products-services` | Optional | Returns 4 service types, DisCos, POS brands, dynamic tier fees, WhatsApp chat URL |
| `GET` | `?r=api/physical-products-states-lgas` | Optional | Returns all 37 Nigerian states & 774 LGAs |
| `GET` | `?r=api/physical-products-catalog` | Optional | Returns products filtered by category with gallery images, specs, and plans |
| `GET` | `?r=api/physical-products-profile-data` | Bearer | Returns auto-fill profile data, KYC status, wallet balance, and PIN setup status |
| `POST` | `?r=api/physical-products-submit` | Bearer | Validates PIN, checks KYC, debits wallet atomically, logs request, returns post-payment info |

---

## 7. Automated POS 60-Day Inactivity Monitor

The console command `yii pos-monitor/sweep` runs periodically (e.g. via daily cron):
```bash
php yii pos-monitor/sweep
```
- Scans `physical_product_request` where `service_type_code = 'pos_device'` and `status = 'delivered'`.
- If `last_active_at` is older than 60 days, sets `retrieval_status = 'flagged_60_days'`.
- Notifies AdminLTE dashboard with alert badges for field team retrieval.

---

## 8. Mobile Client Architecture (`C:\Users\MY PC\Desktop\edata-mobile`)

- **Types**: `src/types.ts` (`PhysicalProductCategory`, `PhysicalProductItem`, `PhysicalProductPlan`, `PhysicalProductSubmitPayload`, `PhysicalProductSubmitResponse`).
- **API Client**: `src/services/api.ts` (`getPhysicalProductServices`, `getPhysicalProductsStatesLgas`, `getPhysicalProductsCatalog`, `getPhysicalProductsProfileData`, `submitPhysicalProductRequest`).
- **UI Components** (`src/components/physical/`):
  - `PhysicalProductsHub.tsx`: Master navigation hub.
  - `PrepaidMeterFlow.tsx`: DisCo, meter type, old bill check, address, fee payment.
  - `InstallmentPhoneFlow.tsx`: Smartphone catalog, image counter, plan cards, guarantee card, NIN.
  - `PosDeviceFlow.tsx`: Brand, terminal type, 60-day warning card, NIN, BVN.
  - `OtherProductsFlow.tsx`: Dynamic catalog with > 5 image auto-sliding carousel (3.5s interval).
  - `PhysicalPinModal.tsx`: Secure 4-digit PIN sheet with wallet balance check & shortfall prompt.
  - `PhysicalSuccessModal.tsx`: Request reference, post-payment notice, WhatsApp Live Chat button.
- **Entry Points**:
  - `UserDashboard.tsx`: Physical Hub quick service tile.
  - `ServicesCatalog.tsx`: Physical Products filter tab & service cards.
  - `TransactionHistory.tsx`: `Physical Product` category filter, `📦` icon, request status chip, retry routing.
