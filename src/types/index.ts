/**
 * DUGDHSAR — Complete Relational E-Commerce Types
 * Built according to the 24-table database schema with Integer Paise monetary storage.
 */

// Format integer paise into INR formatted currency (e.g. 17000 => "₹170", 17050 => "₹170.50")
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(rupees);
}

// 1. profiles
export interface Profile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'admin' | 'manager' | 'operations' | 'support' | 'dealer';
  avatarUrl?: string;
  authProvider?: 'password' | 'google' | 'otp';
  loyaltyPoints?: number;
  createdAt: string;
}

// 2. addresses
export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  flatNo: string;
  apartment: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  deliverySlot: '5:00 AM - 10:00 AM' | '6:00 PM - 10:00 PM' | '5:30 AM - 11:00 AM' | '5:00 PM - 7:00 PM' | string;
  instructions?: string;
}

// 3. categories
export interface Category {
  id: string;
  name: string;
  slug: string;
  hindiName: string;
  description: string;
  displayOrder: number;
  imageUrl?: string;
}

// 4. products
export interface Product {
  id: string;
  name: string;
  hindiName: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  description: string;
  heritageStory: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  ingredients: string[];
  shelfLife: string;
  storageInstructions: string;
  allergens: string[];
  purityScore: number; // 0 - 500 scale
  isSubscriptionEligible: boolean;
  isPublished: boolean;
  featured: boolean;
  variants: ProductVariant[];
  images: ProductImage[];
  nutritionalHighlights: { label: string; value: string }[];
  createdAt: string;
}

// 5. product_variants (strictly in integer paise)
export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  sizeLabel: string;
  pricePaise: number; // e.g. 17000 for ₹170
  compareAtPricePaise?: number; // e.g. 19000 for ₹190
  inStock: boolean;
  stockCount: number;
  isSubscriptionEligible: boolean;
}

// 6. product_images
export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
}

// 7. inventory_batches (FEFO batch-level tracking)
export interface InventoryBatch {
  id: string;
  batchNumber: string;
  variantId: string;
  mfgDate: string;
  expiryDate: string;
  initialQuantity: number;
  onHandQuantity: number;
  reservedQuantity: number;
  isQuarantined: boolean;
  quarantineReason?: string;
  coldChainTempC: number;
  status: 'active' | 'quarantined' | 'expired' | 'depleted';
  createdAt: string;
  updatedAt: string;
}

// 8. inventory
export interface Inventory {
  id: string;
  variantId: string;
  currentStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  updatedAt: string;
}

// 9. inventory_movements
export interface InventoryMovement {
  id: string;
  batchId?: string;
  variantId: string;
  delta: number;
  movementType: 'production_in' | 'order_reservation' | 'order_fulfillment' | 'manual_adjustment' | 'spoilage_waste' | 'quarantine_hold' | 'reservation_release' | 'restock' | 'order_deduction' | 'waste';
  reason: string;
  actorEmail?: string;
  referenceId?: string;
  createdAt: string;
}

// 10. inventory_reservations (15-minute checkout locks)
export interface InventoryReservation {
  id: string;
  batchId: string;
  variantId: string;
  quantity: number;
  expiresAt: string; // ISO string 15 min from creation
  status: 'active' | 'converted' | 'released' | 'expired';
  sessionId: string;
  userId?: string;
}

// 11. carts
export interface Cart {
  id: string;
  userId?: string;
  sessionToken: string;
  deliveryPincode?: string;
  couponCode?: string;
  updatedAt: string;
  items: CartItem[];
}

// 11. cart_items
export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  isSubscription: boolean;
  subscriptionFrequency?: 'daily' | 'alternate' | 'weekly' | 'weekdays';
  addedAt: string;
}

// 12. orders (strictly in integer paise)
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerId?: string;
  dealerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  items: OrderItem[];
  subtotalPaise: number;
  taxPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  paymentMethod: 'upi' | 'card' | 'cod' | 'netbanking' | 'razorpay';
  paymentStatus: 'pending' | 'captured' | 'failed' | 'refunded' | 'due_on_delivery';
  deliveryAddress: Address;
  shippingAddress?: Address | any;
  deliverySlot: '5:00 AM - 10:00 AM' | '6:00 PM - 10:00 PM' | '5:30 AM - 11:00 AM' | '5:00 PM - 7:00 PM' | string;
  deliveryPincode: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  estimatedDelivery: string;
}

// 13. order_items (immutable price snapshot in integer paise)
export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productNameSnapshot: string;
  sizeSnapshot: string;
  pricePaiseSnapshot: number;
  quantity: number;
  totalPaise: number;
  imageUrlSnapshot: string;
}

// 14. payments
export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'cod';
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature?: string;
  status: 'pending' | 'captured' | 'failed' | 'refunded' | 'due_on_delivery' | 'reconciled';
  amountPaise: number;
  idempotencyKey: string;
  createdAt: string;
}

// 15. refunds
export interface Refund {
  id: string;
  paymentId: string;
  orderId: string;
  amountPaise: number;
  reason: string;
  status: 'initiated' | 'processed' | 'failed';
  processedAt: string;
}

// 16. coupons
export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  value: number; // percentage (e.g. 15 for 15%) or fixed paise (e.g. 5000 for ₹50)
  minOrderAmountPaise: number;
  maxDiscountPaise?: number;
  startsAt: string;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

// 17. coupon_redemptions
export interface CouponRedemption {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountPaise: number;
  redeemedAt: string;
}

// 18. delivery_zones
export interface DeliveryZone {
  id: string;
  zoneName: string;
  city: string;
  state: string;
  pincode?: string;
  hubAddress?: string;
  minOrderPaise: number;
  deliveryFeePaise: number;
  freeDeliveryThresholdPaise?: number;
  estimatedHours?: number;
  isColdChainActive?: boolean;
  isActive: boolean;
}

// 19. serviceable_pincodes (strict local delivery boundaries)
export interface ServiceablePincode {
  pincode: string;
  zoneId: string;
  localityName: string;
  city: string;
  isColdChainActive: boolean;
  estimatedDeliveryHours: number;
  isActive: boolean;
}

// 20. delivery_slots
export interface DeliverySlot {
  id: string;
  slotName: string;
  startTime: string;
  endTime: string;
  cutoffTime: string;
  maxCapacity: number;
  currentBookings: number;
  isActive?: boolean;
}

// 21. deliveries (Cold-chain transit & temperature tracking)
export interface Delivery {
  id: string;
  orderId: string;
  slotId: string;
  pincode: string;
  deliveryDate: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  insulatedBoxId?: string;
  dispatchTempC?: number;
  arrivalTempC?: number;
  status: 'pending' | 'assigned' | 'out_for_delivery' | 'delivered' | 'failed' | 'cold_chain_breach';
  deliveredAt?: string;
  recipientNotes?: string;
}

// 22. delivery_events
export interface DeliveryEvent {
  id: string;
  deliveryId: string;
  status: string;
  recordedTempC?: number;
  notes?: string;
  recordedAt: string;
}

// 23. admin_users
export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'inventory_manager' | 'delivery_lead';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

// 24. payment_webhook_events
export interface PaymentWebhookEvent {
  id: string;
  eventId: string;
  gateway: string;
  eventType: string;
  payload: Record<string, any>;
  status: 'pending' | 'processed' | 'duplicate' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

// 25. notification_logs
export interface NotificationLog {
  id: string;
  recipientIdentifier: string;
  channel: 'sms' | 'email' | 'whatsapp';
  templateName: string;
  payload: Record<string, any>;
  status: 'queued' | 'sent' | 'failed';
  sentAt: string;
}

// 26. order_status_events
export interface OrderStatusEvent {
  id: string;
  orderId: string;
  fromStatus?: string;
  toStatus: string;
  notes?: string;
  actor: string;
  createdAt: string;
}

// 20. wishlists
export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

// 21. reviews
export interface Review {
  id: string;
  productId: string;
  productName: string;
  userName: string;
  userCity: string;
  rating: number; // 1 - 5
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
  tags?: string[];
  helpfulCount?: number;
}

// 22. enquiries
export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  enquiryType: 'general' | 'wholesale' | 'farm_visit' | 'quality_assay';
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved';
  createdAt: string;
}

// 23. journal_posts
export interface JournalPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  authorRole: string;
  readTime: string;
  publishedAt: string;
  tags: string[];
}

// 24. audit_logs
export interface AuditLog {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  ipAddress: string;
  createdAt: string;
}

// QA & System Testing Data Interfaces
export interface QATestResult {
  id: string;
  category: 
    | 'Desktop' 
    | 'Tablet' 
    | 'Mobile' 
    | 'Navigation' 
    | 'Animations' 
    | 'Page transitions' 
    | 'Products' 
    | 'Search' 
    | 'Filters' 
    | 'Cart' 
    | 'Wishlist' 
    | 'Checkout' 
    | 'Authentication' 
    | 'Supabase integration' 
    | 'Payment verification' 
    | 'Admin access' 
    | 'Security rules';
  title: string;
  description: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  executionTimeMs?: number;
  details?: string;
}

export interface BatchPurityData {
  batchNumber: string;
  milkingDate: string;
  milkingTime: string;
  purityScore: number;
  fatContent: number;
  snfContent: number;
  adulterationTest: '100% Negative (Pure)' | 'Positive';
  mbrtScore: string;
  testedBy: string;
}

export interface Subscription {
  id: string;
  userId?: string;
  customerId?: string;
  dealerId?: string;
  customerEmail?: string;
  productName: string;
  variant: string;
  milkType?: 'cow' | 'buffalo' | string;
  pricePerUnit?: number; // In Rupees (e.g. 170, 190)
  pricePaise?: number; // In integer paise (e.g. 17000, 19000)
  quantity: number;
  frequency: 'daily' | 'alternate' | 'weekly' | 'weekdays' | string;
  deliverySlot?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string | any;
  notes?: string;
  startDate: string;
  status: 'active' | 'paused' | 'cancelled';
  nextDelivery: string;
  updatedAt?: string;
}
