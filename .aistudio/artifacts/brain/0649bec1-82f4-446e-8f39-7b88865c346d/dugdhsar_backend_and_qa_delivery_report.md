# Dugdhsar Pure Vedic A2 Dairy — Production Delivery Report

## 1. Customer Isolation & Security (Zero Data Leakage)
- **Account & Identity Scoping**: Patrons authenticate exclusively via Google Sign-In or verified phone credentials.
- **Isolated Query Scopes**:
  - `userOrders`: Filtered strictly by `order.userId === currentUser.id || order.customerEmail === currentUser.email`.
  - `userSubscriptions`: Filtered strictly by `subscription.userId === currentUser.id || subscription.customerEmail === currentUser.email`.
  - `userAddresses`: Filtered strictly by `address.userId === currentUser.id`.
- **Zero Cross-Account Leakage**: No patron can see or sync any other customer's order history, saved addresses, or delivery calendars.

---

## 2. Milk Calendar Generation & Subscription Model Connection
- **Conditional Generation**: The daily cold-chain milk delivery calendar is generated *only after* a patron initiates a regular milk subscription.
- **Auto-Prompt on Calendar Visit**: When a new or un-subscribed patron visits `/account/daily-milk-tracking`, the system automatically triggers `MorningSubscriptionModal` (connected to the subscription model).
- **Interactive State**:
  - Un-subscribed patrons receive a prominent Vedic invitation card with a 1-tap button to launch the subscription plan.
  - Subscribed patrons receive the full color-coded delivery calendar (Green: Delivered drops, Yellow: Scheduled, Red: Missed/Compensated, Vacation Mode, Discrepancy Reporting).

---

## 3. Subscriptions Control & Google Data Sheets Synchronization
- **Admin & Manager Access**: Both `super_admin` and `operations_manager` have total control over all platform subscriptions.
  - **View & Inspect**: All customer subscriptions with patron name, mobile, email, product, quantity, schedule frequency, delivery slot, and complete doorstep address in Seoni.
  - **Edit Subscription**: Update patron details, bottle quantity, morning/evening delivery slot, frequency, status, or delivery notes.
  - **1-Tap Pause / Resume / Cancel**: Immediate control over cold-chain bottling and delivery runs.
  - **Manual Subscription Creation**: Directly enroll patrons onto delivery routes.
- **Google Sheets Integration**:
  - **Live Webhook Auto-Sync**: Configured endpoint (Google Apps Script Web App) automatically receives JSON payloads upon every new subscription.
  - **1-Click Sync All**: Real-time batch sync for all subscriptions with live success indicators.
  - **Instant Google Sheet CSV Export**: 1-click download of a 14-column spreadsheet-ready `.csv` file.
  - **Live Sheet Preview**: Tabular spreadsheet preview right inside the Admin and Manager panel.

---

## 4. Product Management & Total Photo Control
- **Role Equality**: Both `super_admin` and `operations_manager` have permission to create, edit, update, and delete products.
- **Photo Controls**:
  - Upload / enter custom image URLs (HTTPS or local `/assets/...`).
  - Quick Vedic dairy image presets for A2 Milk, Vedic Bilona Ghee, Malai Paneer, Clay-Pot Dahi, White Makhan, and Khoya/Mawa.
  - Instant live image preview with aspect ratio preservation.
  - 1-Click "Delete Photo" / "Remove Photo" action.
- **Storefront Synchronization**: Changes reflect live on the digital storefront and product detail pages immediately.
