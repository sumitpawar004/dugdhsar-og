# DUGDHSAR REST API Specification (OpenAPI 3.1 & Reference)

> **Base URLs**:
> - Production: `https://dugdhsar.in/api` (and `/api/v1`)
> - Development: `http://localhost:3000/api` (and `/api/v1`)
> - Cloudflare Worker Edge Monolith: Single worker routing static assets from `./dist` and API via Express `httpServerHandler`.

---

## 1. Authentication & Security Headers

### Session Management
- **Primary Auth**: Google Identity Services (OAuth2 ID Token).
- **Session Tokens**: 15-minute access JWT stored in `dugdhsar_access` HttpOnly cookie or passed via `Authorization: Bearer <token>`.
- **Refresh Tokens**: 30-day rolling refresh token stored in `dugdhsar_refresh` HttpOnly cookie.
- **CSRF Defense**: Origin & Referer verification enforced on all state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).
- **2FA TOTP**: RFC 6238 TOTP enforced for `super_admin` access.

### Standard Request Headers
| Header | Type | Description | Required |
|---|---|---|---|
| `Authorization` | `string` | `Bearer <access_token>` | For protected endpoints |
| `Idempotency-Key` | `string` | Unique UUID or client transaction string (8-128 chars) | Mandatory on `/api/checkout/create-order` |
| `Origin` / `Referer` | `string` | Must match authorized origin (`https://dugdhsar.in`) | On all mutating requests |
| `X-Request-Id` | `string` | Correlation UUID for distributed debugging | Optional (auto-generated if missing) |

### Standard Response Headers
| Header | Description |
|---|---|
| `X-Request-Id` | Echoed correlation UUID |
| `X-Cache` | `HIT` or `MISS` on edge-cached catalog endpoints |
| `X-Idempotency-Hit` | `true` when replaying a 24-hour cached idempotent transaction |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |

---

## 2. HTTP Status Codes & Error Protocol

All error responses adhere to RFC 7807 problem details:

```json
{
  "success": false,
  "code": "BAD_REQUEST",
  "error": "Destination pincode is outside local cold-chain delivery zone.",
  "requestId": "60722fa4-0038-4c7a-a3f4-fcdd7cf63fec"
}
```

| HTTP Status | Machine Code | Description |
|---|---|---|
| `200 OK` | - | Successful request execution |
| `201 Created` | - | New resource created |
| `204 No Content` | - | Successful deletion or empty response |
| `400 Bad Request` | `BAD_REQUEST`, `VALIDATION_ERROR` | Schema validation failed or invalid input |
| `401 Unauthorized` | `UNAUTHORIZED`, `TOKEN_EXPIRED` | Missing or invalid authentication token |
| `403 Forbidden` | `FORBIDDEN`, `CSRF_VIOLATION` | Insufficient role permissions or CSRF rejection |
| `404 Not Found` | `NOT_FOUND` | Resource does not exist |
| `409 Conflict` | `IDEMPOTENCY_CONFLICT` | Idempotency key reused with modified payload |
| `422 Unprocessable` | `UNPROCESSABLE_ENTITY` | Business logic constraint failed |
| `429 Too Many Req` | `RATE_LIMIT_EXCEEDED`, `ACCOUNT_LOCKED` | Sliding-window or auth lockout exceeded |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | Internal edge error (safe redaction; no leaks) |
| `502 Bad Gateway` | `BAD_GATEWAY` | External provider (Google Sheets / Meta) down |
| `503 Unavailable` | `CIRCUIT_BREAKER_OPEN` | Outbound dependency circuit tripped |

---

## 3. Endpoints Directory

### 3.1 Health & Diagnostics
#### `GET /api/health`
Cheap diagnostic probe returning process status and server timestamp.
- **Auth**: None
- **Response `200`**:
  ```json
  { "status": "ok", "service": "dugdhsar-api", "timestamp": "2026-11-11T13:00:00.000Z" }
  ```

#### `GET /api/ready`
Deep readiness probe validating Cloudflare KV and D1 connectivity.
- **Auth**: None
- **Response `200`**:
  ```json
  { "status": "ready", "checks": { "kv": "connected", "d1": "connected" } }
  ```

---

### 3.2 Authentication & Identity
#### `POST /api/auth/google`
Exchange Google OAuth2 ID Token for authenticated session cookies and user profile.
- **Auth**: Public (Strict Rate Limited: 10/min)
- **Body**:
  ```json
  { "idToken": "eyJhbGciOiJSUzI1NiIs..." }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_123456",
      "email": "patron@example.com",
      "fullName": "Sanjay Sharma",
      "role": "customer"
    },
    "token": "eyJhbGciOi...",
    "requires2FA": false
  }
  ```

#### `POST /api/auth/refresh`
Rotate expired 15-minute access token using rolling 30-day refresh token.
- **Auth**: HttpOnly cookie `dugdhsar_refresh` or `{ "refreshToken": "..." }`
- **Response `200`**:
  ```json
  { "success": true, "token": "...", "expiresIn": 900 }
  ```

#### `POST /api/auth/logout`
Revoke active session tokens by `jti` in KV denylist and clear HttpOnly cookies.
- **Auth**: Bearer or Session Cookie
- **Response `200`**:
  ```json
  { "success": true, "message": "Logged out successfully." }
  ```

#### `POST /api/auth/2fa/verify`
Verify 6-digit TOTP token for Super Admin login.
- **Auth**: Temporary 2FA token
- **Body**:
  ```json
  { "code": "583921" }
  ```

---

### 3.3 Product Catalog & Reviews
#### `GET /api/products`
Fetch active products with real-time stock calculated across non-quarantined batches.
- **Auth**: Public
- **Caching**: 5-minute edge cache (`X-Cache: HIT / MISS`)
- **Response `200`**:
  ```json
  {
    "success": true,
    "products": [
      {
        "id": "prod-gir-milk",
        "slug": "a2-desi-cow-whole-milk",
        "name": "A2 Desi Gir Cow Vedic Whole Milk",
        "variants": [
          {
            "id": "var-gir-1l",
            "sizeLabel": "1 Litre Glass Bottle",
            "pricePaise": 11000,
            "stockCount": 45,
            "inStock": true
          }
        ]
      }
    ]
  }
  ```

#### `POST /api/products`
Create or update product in master catalog.
- **Auth**: `super_admin` or `dealer`
- **Side Effect**: Automatically purges edge catalog cache.

#### `GET /api/reviews?productId=prod-gir-milk`
Retrieve verified patron reviews and ratings.

---

### 3.4 Inventory Governance & FEFO Batches
#### `GET /api/inventory/batches`
List all inventory batches sorted in First-Expired, First-Out (FEFO) order.
- **Auth**: `super_admin` or `dealer`

#### `POST /api/inventory/adjust`
Manually adjust batch stock count with audit reason.
- **Auth**: `super_admin`
- **Body**:
  ```json
  {
    "batchId": "batch-20261111-01",
    "delta": -2,
    "reason": "Damaged bottle during cold-box loading",
    "actorEmail": "admin@dugdhsar.in"
  }
  ```

#### `POST /api/inventory/quarantine`
Hold or release a batch under QA observation.
- **Auth**: `super_admin`

---

### 3.5 Delivery & Serviceable Pincodes
#### `POST /api/delivery/validate-pincode`
Check if patron address is serviceable by Dugdhsar's direct cold chain.
- **Auth**: Public
- **Body**:
  ```json
  { "pincode": "480661" }
  ```
- **Response `200`**:
  ```json
  {
    "success": true,
    "isServiceable": true,
    "locality": "Seoni Head Office & Sanjay Vihar",
    "city": "Seoni",
    "coldChainGuaranteed": true,
    "tempRangeCelsius": "2°C - 4°C",
    "minOrderPaise": 0,
    "deliveryFeePaise": 0
  }
  ```

---

### 3.6 Checkout, Idempotency & Orders
#### `POST /api/checkout/create-order`
Place a retail cold-chain delivery order.
- **Headers**: `Idempotency-Key: <unique-key>`
- **Auth**: Optional (Guest or Logged in Patron)
- **Features**:
  - Atomic FEFO deduction from earliest expiring active batches.
  - 24-hour replay deduplication via `Idempotency-Key`.
  - Automatic edge catalog cache purge.
- **Body**:
  ```json
  {
    "customer": { "fullName": "Sunil Verma", "email": "sunil@example.com", "phone": "+91 9876543210" },
    "address": { "pincode": "480661", "street": "Barghat Rd", "city": "Seoni", "state": "MP" },
    "items": [{ "variantId": "var-gir-1l", "quantity": 2 }],
    "paymentMethod": "cod",
    "deliverySlot": "5:30 AM - 7:00 AM"
  }
  ```

#### `GET /api/orders`
List orders with Row-Level Security isolation:
- `customer`: Sees only their own orders.
- `dealer`: Sees only orders in assigned pincodes/territory.
- `super_admin`: Sees all orders.

#### `DELETE /api/orders/:id`
Soft-delete an order (marks `deleted_at`, excludes from default list, records audit trail for DPDP Act compliance).
- **Auth**: `super_admin`

---

### 3.7 Subscriptions
#### `GET /api/subscriptions`
List active milk subscriptions with Row-Level Security isolation.

#### `POST /api/subscriptions`
Create a recurring daily or alternate day subscription.

#### `POST /api/subscriptions/:id/cancel`
Cancel a recurring subscription.

#### `DELETE /api/subscriptions/:id`
Soft-delete a subscription for DPDP compliance.
- **Auth**: `super_admin`

---

### 3.8 Feature Flags
#### `GET /api/feature-flags`
Get active feature flag evaluations for current user and IP context.
- **Auth**: Public

#### `POST /api/admin/feature-flags`
Update or toggle a feature flag dynamically at the edge without redeploying.
- **Auth**: `super_admin`
- **Body**:
  ```json
  {
    "key": "evening_delivery_slot",
    "enabled": true,
    "rolloutPercentage": 100
  }
  ```

---

### 3.9 Administrative Audit Trail
#### `GET /api/admin/audit-logs`
Query immutable append-only audit trail.
- **Auth**: `super_admin`
- **Query Params**: `limit=50&offset=0&action=order_status_update`
