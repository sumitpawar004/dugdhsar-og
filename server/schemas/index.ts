import { z } from 'zod';

/**
 * Strict Input Validation Schemas for DUGDHSAR API
 * All write schemas enforce .strict() to prevent Mass Assignment attacks.
 */

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
    pincode: z.string().regex(/^\d{6}$/, 'Must be a 6-digit postal pincode'),
  })
  .strict();

export const OrderItemSchema = z
  .object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    quantity: z.number().int().positive().max(50),
  })
  .strict();

export const ShippingAddressSchema = z
  .object({
    fullName: z.string().min(2).max(100),
    mobile: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
    addressLine1: z.string().min(5).max(200),
    addressLine2: z.string().max(200).optional(),
    landmark: z.string().max(100).optional(),
    city: z.string().min(2).max(50).default('Seoni'),
    pincode: z.string().regex(/^\d{6}$/, 'Must be a 6-digit pincode'),
  })
  .strict();

export const CreateOrderSchema = z
  .object({
    items: z.array(OrderItemSchema).min(1, 'At least 1 item is required'),
    shippingAddress: ShippingAddressSchema,
    deliverySlot: z.enum(['morning', 'evening']).default('morning'),
    paymentMethod: z.enum(['cod', 'upi', 'online']).default('cod'),
    orderNotes: z.string().max(500).optional(),
    couponCode: z.string().max(30).optional(),
  })
  .strict();

export const OrderStatusUpdateSchema = z
  .object({
    status: z.enum(['pending', 'confirmed', 'processing', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled', 'returned']),
    notes: z.string().max(250).optional(),
  })
  .strict();

export const CreateSubscriptionSchema = z
  .object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    dailyQuantity: z.number().int().positive().max(10),
    frequency: z.enum(['daily', 'alternate_days', 'weekly', 'custom']),
    deliverySlot: z.enum(['morning', 'evening']).default('morning'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    deliveryAddress: ShippingAddressSchema,
    notes: z.string().max(500).optional(),
  })
  .strict();

export const CancelSubscriptionSchema = z
  .object({
    reason: z.string().max(300).optional(),
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

export const ContactSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10).max(20).optional(),
    message: z.string().min(5, 'Message must be at least 5 characters').max(1000),
  })
  .strict();

export const VerifyDeliveryQrSchema = z
  .object({
    orderId: z.string().min(1, 'Order ID is required').max(120),
    token: z.string().min(4, 'QR verification token is required').max(120),
    deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    partnerName: z.string().min(1).max(120).optional(),
  })
  .strict();

export const StaffSlotAssignSchema = z
  .object({
    role: z.enum(['admin', 'manager', 'dealer']),
    email: z.string().email('Valid Google email is required'),
    name: z.string().min(1).max(100).optional(),
    replaceExisting: z.boolean().optional(),
  })
  .strict();



