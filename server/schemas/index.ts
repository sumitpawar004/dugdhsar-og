import { z } from 'zod';

/**
 * Strict Input Validation Schemas for DUGDHSAR API
 * All write schemas enforce .strict() to prevent Mass Assignment attacks.
 */

const IndianPhoneRegex = /^(\+91)?[6-9]\d{9}$/;
const PincodeRegex = /^\d{6}$/;
const YmdDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const GoogleAuthSchema = z
  .object({
    idToken: z.string().min(1, 'Google ID token is required'),
    email: z.string().email('Valid Google email is required').optional(),
    name: z.string().min(1).max(120).optional(),
    totpCode: z.string().length(6, 'TOTP code must be 6 digits').optional(),
    portalContext: z.enum(['customer', 'admin', 'manager', 'dealer']).optional(),
  })
  .strict();

export const RefreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required').optional(),
  })
  .strict();

export const TotpVerifySchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
    secret: z.string().min(16).optional(),
  })
  .strict();

export const PincodeSchema = z
  .object({
    pincode: z.string().regex(PincodeRegex, 'Must be a 6-digit postal pincode'),
  })
  .strict();

export const ProfileUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().regex(IndianPhoneRegex, 'Must be a valid Indian phone number').nullable().optional(),
  })
  .strict();

export const AddressCreateSchema = z
  .object({
    label: z.string().trim().min(1).max(40).default('Home'),
    recipientName: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(IndianPhoneRegex, 'Must be a valid Indian phone number').nullable().optional(),
    line1: z.string().trim().min(4).max(200),
    line2: z.string().trim().max(200).nullable().optional(),
    landmark: z.string().trim().max(120).nullable().optional(),
    city: z.string().trim().min(2).max(60).default('Seoni'),
    state: z.string().trim().min(2).max(60).default('Madhya Pradesh'),
    pincode: z.string().trim().regex(PincodeRegex, 'Must be a 6-digit pincode'),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lng: z.number().min(-180).max(180).nullable().optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export const AddressUpdateSchema = AddressCreateSchema.partial().strict();

export const OrderItemSchema = z
  .object({
    productId: z.string().min(1).optional(),
    variantId: z.string().min(1),
    quantity: z.number().int().positive().max(50),
  })
  .strict();

export const ShippingAddressSchema = z
  .object({
    fullName: z.string().min(2).max(100),
    mobile: z.string().regex(IndianPhoneRegex, 'Must be a valid 10-digit Indian mobile number').optional(),
    phone: z.string().regex(IndianPhoneRegex, 'Must be a valid 10-digit Indian mobile number').optional(),
    addressLine1: z.string().min(4).max(200).optional(),
    line1: z.string().min(4).max(200).optional(),
    addressLine2: z.string().max(200).optional(),
    line2: z.string().max(200).optional(),
    landmark: z.string().max(100).optional(),
    city: z.string().min(2).max(60).default('Seoni'),
    state: z.string().min(2).max(60).default('Madhya Pradesh'),
    pincode: z.string().regex(PincodeRegex, 'Must be a 6-digit pincode'),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lng: z.number().min(-180).max(180).nullable().optional(),
  })
  .strict();

export const CheckoutCalculateSchema = z
  .object({
    items: z.array(OrderItemSchema).min(1, 'At least 1 item is required').max(30),
    pincode: z.string().regex(PincodeRegex, 'Must be a 6-digit pincode').optional(),
    couponCode: z.string().trim().max(40).optional(),
  })
  .strict();

export const CreateOrderSchema = z
  .object({
    items: z.array(OrderItemSchema).min(1, 'At least 1 item is required').max(30),
    addressId: z.string().min(1).optional(),
    shippingAddress: ShippingAddressSchema.optional(),
    address: ShippingAddressSchema.optional(),
    customer: z
      .object({
        id: z.string().optional(),
        fullName: z.string().max(120).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(20).optional(),
      })
      .strict()
      .optional(),
    deliveryDate: z.string().regex(YmdDateRegex, 'Delivery date must be YYYY-MM-DD').optional(),
    deliverySlot: z.enum(['morning', 'evening']).default('morning'),
    paymentMethod: z.enum(['razorpay', 'cod', 'upi_on_delivery', 'upi', 'online']).default('cod'),
    orderNotes: z.string().max(500).optional(),
    notes: z.string().max(500).optional(),
    couponCode: z.string().trim().max(40).optional(),
    sessionId: z.string().max(120).optional(),
  })
  .strict();

export const OrderStatusUpdateSchema = z
  .object({
    status: z.enum([
      'pending',
      'confirmed',
      'processing',
      'dispatched',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned',
    ]),
    expectedStatus: z
      .enum([
        'pending',
        'confirmed',
        'processing',
        'dispatched',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'returned',
      ])
      .optional(),
    notes: z.string().max(250).optional(),
  })
  .strict();

export const CreateSubscriptionSchema = z
  .object({
    planId: z.string().min(1).optional(),
    productId: z.string().min(1).optional(),
    variantId: z.string().min(1).optional(),
    addressId: z.string().min(1).optional(),
    deliveryAddress: ShippingAddressSchema.optional(),
    quantity: z.number().int().positive().max(20).optional(),
    dailyQuantity: z.number().int().positive().max(20).optional(),
    frequency: z.enum(['daily', 'alternate_days', 'weekdays', 'weekly']).default('daily'),
    deliverySlot: z.enum(['morning', 'evening']).default('morning'),
    billingCycle: z.enum(['prepaid_weekly', 'prepaid_monthly', 'postpaid_monthly']).default('prepaid_monthly'),
    startDate: z.string().regex(YmdDateRegex, 'Start date must be YYYY-MM-DD').optional(),
    notes: z.string().max(500).optional(),
  })
  .strict();

export const UpdateSubscriptionSchema = z
  .object({
    quantity: z.number().int().positive().max(20).optional(),
    frequency: z.enum(['daily', 'alternate_days', 'weekdays', 'weekly']).optional(),
    deliverySlot: z.enum(['morning', 'evening']).optional(),
    addressId: z.string().min(1).optional(),
    status: z.enum(['active', 'paused', 'cancelled']).optional(),
    unitPricePaise: z.number().int().nonnegative().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .strict();

export const SubscriptionSkipSchema = z
  .object({
    skipDate: z.string().regex(YmdDateRegex, 'Skip date must be YYYY-MM-DD'),
    reason: z.string().trim().max(250).optional(),
  })
  .strict();

export const CancelSubscriptionSchema = z
  .object({
    reason: z.string().max(300).optional(),
  })
  .strict();

export const AdminProductCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    hindiName: z.string().trim().min(1).max(160).optional(),
    slug: z.string().trim().min(2).max(120).optional(),
    category: z.enum(['milk', 'ghee', 'paneer', 'curd', 'butter', 'khoya-mawa']),
    description: z.string().trim().min(5).max(1200),
    heritageStory: z.string().trim().max(1000).optional(),
    badge: z.string().trim().max(80).optional(),
    imageUrl: z.string().trim().min(1).max(400).optional(),
    shelfLife: z.string().trim().max(120).optional(),
    purityScore: z.number().int().min(0).max(500).optional(),
    isSubscriptionEligible: z.boolean().optional(),
    displayOrder: z.number().int().min(0).max(999).optional(),
    variant: z
      .object({
        sizeLabel: z.string().trim().min(1).max(80),
        unitMlOrG: z.number().int().positive().default(1000),
        pricePaise: z.number().int().nonnegative(),
        compareAtPricePaise: z.number().int().nonnegative().nullable().optional(),
        stockQty: z.number().int().nonnegative().default(50),
        sku: z.string().trim().min(2).max(60).optional(),
      })
      .strict(),
  })
  .strict();

export const AdminVariantUpdateSchema = z
  .object({
    pricePaise: z.number().int().nonnegative().optional(),
    compareAtPricePaise: z.number().int().nonnegative().nullable().optional(),
    stockQty: z.number().int().nonnegative().optional(),
    stockDelta: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const AdminPlanUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    pricePaise: z.number().int().nonnegative().optional(),
    frequency: z.enum(['daily', 'alternate_days', 'weekdays', 'weekly']).optional(),
    billingCycle: z.enum(['prepaid_weekly', 'prepaid_monthly', 'postpaid_monthly']).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const AdminSiteSettingUpdateSchema = z
  .object({
    value: z.unknown(),
  })
  .strict();

export const CreateReviewSchema = z
  .object({
    productId: z.string().min(1),
    authorName: z.string().trim().min(2).max(100).optional(),
    userName: z.string().trim().min(2).max(100).optional(),
    authorCity: z.string().trim().max(80).optional(),
    userCity: z.string().trim().max(80).optional(),
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().min(2).max(140),
    comment: z.string().trim().min(5).max(1200),
  })
  .strict();

export const ModerateReviewSchema = z
  .object({
    status: z.enum(['pending', 'approved', 'rejected']),
  })
  .strict();

export const ContactSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().trim().email('Invalid email address'),
    phone: z.string().trim().regex(IndianPhoneRegex, 'Invalid phone number').optional(),
    subject: z.string().trim().min(2).max(160).optional(),
    message: z.string().trim().min(5, 'Message must be at least 5 characters').max(1000),
  })
  .strict();

export const UpdateEnquirySchema = z
  .object({
    status: z.enum(['new', 'in_progress', 'resolved', 'spam']),
  })
  .strict();

export const DealerPincodesAssignSchema = z
  .object({
    pincodes: z.array(z.string().regex(PincodeRegex, 'Must be 6-digit pincode')).min(1).max(50),
  })
  .strict();

export const DealerCustomerAssignSchema = z
  .object({
    customerId: z.string().min(1),
  })
  .strict();

export const InventoryAdjustSchema = z
  .object({
    batchId: z.string().min(1),
    delta: z.number().int(),
    reason: z.string().min(1).max(200),
  })
  .strict();

export const QuarantineSchema = z
  .object({
    batchId: z.string().min(1),
    isQuarantined: z.boolean(),
    quarantineReason: z.string().max(200).optional(),
  })
  .strict();

export const VerifyDeliveryQrSchema = z
  .object({
    orderId: z.string().min(1, 'Order ID is required').max(120).optional(),
    token: z.string().min(4, 'QR verification token is required').max(120),
    deliveryDate: z.string().regex(YmdDateRegex).optional(),
    partnerName: z.string().min(1).max(120).optional(),
  })
  .strict();

export const StaffSlotAssignSchema = z
  .object({
    role: z.enum(['admin', 'manager', 'dealer']),
    email: z.string().email('Valid Google email is required'),
    name: z.string().min(1).max(100).optional(),
    replaceExisting: z.boolean().optional(),
    pincodes: z.array(z.string().regex(PincodeRegex)).max(30).optional(),
  })
  .strict();

export const RazorpayCreateOrderSchema = z
  .object({
    orderId: z.string().min(1).max(120).optional(),
    subscriptionInvoiceId: z.string().min(1).max(120).optional(),
  })
  .strict()
  .refine(
    (data) => Boolean(data.orderId) !== Boolean(data.subscriptionInvoiceId),
    'Provide exactly one of orderId or subscriptionInvoiceId.'
  );

export const RazorpayVerifyPaymentSchema = z
  .object({
    razorpayOrderId: z.string().min(4).max(120),
    razorpayPaymentId: z.string().min(4).max(120),
    razorpaySignature: z.string().min(32).max(256),
  })
  .strict();

