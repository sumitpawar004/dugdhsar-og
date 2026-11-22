import { UserRole } from '../types';

export type UserStatus = 'active' | 'suspended' | 'deleted';
export type DealerStatus = 'active' | 'inactive';
export type ProductCategory = 'milk' | 'ghee' | 'paneer' | 'curd' | 'butter' | 'khoya-mawa';
export type MilkType = 'cow' | 'buffalo' | 'skimmed' | 'dairy';
export type SubscriptionFrequency = 'daily' | 'alternate_days' | 'weekdays' | 'weekly';
export type DeliverySlotCode = 'morning' | 'evening';
export type BillingCycle = 'prepaid_weekly' | 'prepaid_monthly' | 'postpaid_monthly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type InvoiceStatus = 'draft' | 'due' | 'paid' | 'partially_refunded' | 'void';
export type OrderType = 'one_time' | 'subscription_delivery';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';
export type PaymentMethod = 'razorpay' | 'cod' | 'upi_on_delivery';
export type OrderPaymentStatus = 'pending' | 'paid' | 'due_on_delivery' | 'failed' | 'refunded';
export type PaymentRecordStatus =
  | 'created'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type EnquiryStatus = 'new' | 'in_progress' | 'resolved' | 'spam';

export interface UserRow {
  id: string;
  google_sub: string | null;
  email: string;
  email_hash: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DealerRow {
  id: string;
  user_id: string;
  business_name: string;
  status: DealerStatus;
  created_at: string;
  updated_at: string;
}

export interface DealerPincodeRow {
  dealer_id: string;
  pincode: string;
  created_at: string;
}

export interface DealerCustomerRow {
  id: string;
  dealer_id: string;
  customer_id: string;
  assigned_at: string;
  assigned_by: string | null;
}

export interface AddressRow {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  is_default: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  hindi_name: string;
  category: ProductCategory;
  description: string;
  heritage_story: string | null;
  badge: string | null;
  image_url: string;
  shelf_life: string | null;
  purity_score: number;
  is_subscription_eligible: number;
  is_active: number;
  display_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  sku: string;
  size_label: string;
  unit_ml_or_g: number;
  price_paise: number;
  compare_at_price_paise: number | null;
  stock_qty: number;
  is_subscription_eligible: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface PlanRow {
  id: string;
  code: string;
  name: string;
  product_id: string;
  variant_id: string;
  milk_type: MilkType;
  frequency: SubscriptionFrequency;
  price_paise: number;
  billing_cycle: BillingCycle;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  dealer_id: string | null;
  address_id: string;
  plan_id: string | null;
  product_id: string;
  variant_id: string;
  quantity: number;
  frequency: SubscriptionFrequency;
  delivery_slot: DeliverySlotCode;
  unit_price_paise: number;
  billing_cycle: BillingCycle;
  paid_through_date: string | null;
  start_date: string;
  next_delivery_date: string;
  status: SubscriptionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SubscriptionPauseRow {
  id: string;
  subscription_id: string;
  skip_date: string;
  reason: string | null;
  created_by: string;
  created_at: string;
}

export interface SubscriptionInvoiceRow {
  id: string;
  invoice_number: string;
  subscription_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  scheduled_deliveries: number;
  skipped_deliveries: number;
  amount_paise: number;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponRow {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  min_order_paise: number;
  max_discount_paise: number | null;
  max_uses: number | null;
  per_user_limit: number;
  used_count: number;
  valid_from: string;
  valid_to: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  order_number: string;
  order_type: OrderType;
  user_id: string;
  dealer_id: string | null;
  subscription_id: string | null;
  address_id: string | null;
  coupon_id: string | null;
  shipping_address_json: string;
  delivery_pincode: string;
  delivery_date: string;
  delivery_slot: DeliverySlotCode;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: OrderPaymentStatus;
  subtotal_paise: number;
  tax_paise: number;
  delivery_fee_paise: number;
  discount_paise: number;
  total_paise: number;
  qr_token: string | null;
  qr_verified_at: string | null;
  qr_verified_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name_snapshot: string;
  size_snapshot: string;
  unit_price_paise: number;
  quantity: number;
  total_paise: number;
}

export interface PaymentRow {
  id: string;
  order_id: string | null;
  subscription_id: string | null;
  subscription_invoice_id: string | null;
  user_id: string;
  provider: PaymentMethod;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: PaymentRecordStatus;
  amount_paise: number;
  refunded_amount_paise: number;
  currency: string;
  signature_verified: number;
  error_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEventRow {
  event_id: string;
  provider: 'razorpay';
  event_type: string;
  received_at: string;
  processed_at: string | null;
}

export interface ReviewRow {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  author_city: string | null;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: number;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface EnquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: EnquiryStatus;
  handled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  actor_email: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id: string;
  details_json: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface SiteSettingRow {
  key: string;
  value_json: string;
  updated_by: string | null;
  updated_at: string;
}
