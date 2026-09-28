# Security Specification & Threat Model (TDD)

## 1. Data Invariants

1. **Denial-by-Default Catch-All**:
   Any read or write to unmapped collections or arbitrary subcollections is unconditionally rejected (`match /{document=**} { allow read, write: if false; }`).

2. **Authentication & Admin Control**:
   - Write actions to catalog (`medicines`, `categories`, `suppliers`, `settings`) and administrative collections (`admins`) require authenticated and verified users.
   - Bootstrapped admin email `Stefanus.Gamat@gmail.com` and users in `/admins/$(request.auth.uid)` hold administrative privileges.
   - Authenticated users can record transactions and log stock movements.

3. **Immutable Identifiers & Strict Timestamps**:
   - Primary identifiers (`id`) and reference keys cannot be forged or mutated during document updates (`incoming().id == existing().id`).
   - Transaction records once marked `completed` or `voided` cannot be deleted arbitrarily; voids require authorized audit fields.

4. **Volumetric & Type Boundary Guards**:
   - Document ID length restricted through `isValidId()` <= 128 characters adhering to `^[a-zA-Z0-9_\-]+$`.
   - String fields enforce explicit `.size()` boundaries (e.g., name <= 200 chars, invoiceNumber <= 64 chars).
   - Numerical fields (`stock`, `sellPrice`, `total`, `qtyChange`) must be valid numbers.

---

## 2. The "Dirty Dozen" Attack Payloads

1. **Unauthenticated Catalog Wipe**:
   - Anonymous unauthenticated user attempts `DELETE /medicines/med_paracetamol_500` -> **PERMISSION_DENIED**.
2. **Ghost Field Poisoning (Shadow Update)**:
   - Authenticated user attempts `POST /medicines/med_01` with unauthorized payload `{ id: "med_01", name: "Paracetamol", isSuperAdminPrivilege: true }` -> **PERMISSION_DENIED**.
3. **ID Poisoning / Path Buffer Overflow**:
   - Attacker attempts `PUT /medicines/` with a 2KB malicious ID string `med_AAAAA...` -> **PERMISSION_DENIED** via `isValidId()`.
4. **Negative Stock Injection**:
   - Attacker attempts `POST /medicines/med_02` with non-numeric or malformed stock data `{ stock: "infinite" }` -> **PERMISSION_DENIED**.
5. **Unauthorized Admin Elevation**:
   - Non-admin user attempts `SET /admins/$(request.auth.uid)` to self-assign admin status -> **PERMISSION_DENIED**.
6. **Email Spoofing without Verification**:
   - User with unverified email `request.auth.token.email_verified == false` matching admin email attempts admin write -> **PERMISSION_DENIED**.
7. **Transaction Total Tampering**:
   - Malicious user tries updating a transaction with negative total or modifying invoice number after completion -> **PERMISSION_DENIED**.
8. **Orphaned Stock Movement**:
   - Attacker attempts inserting a stock movement with invalid type `{ type: "stolen" }` -> **PERMISSION_DENIED**.
9. **Blanket Query Scraping**:
   - Client executes unbounded query without authentication -> **PERMISSION_DENIED**.
10. **PII Blanket Read Attack**:
    - Unauthenticated entity attempts `GET /customers/cust_01` -> **PERMISSION_DENIED**.
11. **System Config Overwrite by Cashier**:
    - Non-admin attempts modifying `/settings/pharmacy` SIA / SIPA license numbers -> **PERMISSION_DENIED**.
12. **Catch-All Probe Attack**:
    - Attacker attempts accessing `/system_secrets/keys` -> **PERMISSION_DENIED** by catch-all default-deny rule.

---

## 3. Test Runner Specifications

The Firestore rules are validated against the 12 threat scenarios to ensure that:
1. `isAdmin()` correctly checks the `/admins/{userId}` collection and matches bootstrapped admin email with `email_verified == true`.
2. Valid schema helpers (`isValidMedicine`, `isValidCategory`, `isValidTransaction`, etc.) enforce allowed key sets and field types.
3. Deny-all catch-all prevents any shadow collection traversal.
