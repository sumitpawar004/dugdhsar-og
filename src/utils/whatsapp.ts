import { Order } from '../types';

export const OFFICIAL_WHATSAPP_NUMBER = '917067672604';

export const formatWhatsAppOrderMessage = (order: Order): string => {
  const addr = order.deliveryAddress;
  const fullAddress = [
    addr.flatNo,
    addr.apartment,
    addr.street,
    addr.landmark ? `Near ${addr.landmark}` : '',
    addr.city,
    addr.pincode ? `PIN: ${addr.pincode}` : '',
    addr.state || 'Madhya Pradesh'
  ].filter(Boolean).join(', ');

  const itemsList = order.items.map((item, idx) => {
    const itemTotal = (item.totalPaise / 100).toFixed(0);
    return `${idx + 1}. *${item.productNameSnapshot}*\n   • Pack: ${item.sizeSnapshot}\n   • Quantity: ${item.quantity}\n   • Amount: ₹${itemTotal}`;
  }).join('\n\n');

  const paymentLabel = 
    order.paymentMethod === 'cod' ? 'Cash on Delivery (Pay at Doorstep)' :
    order.paymentMethod === 'upi' ? 'UPI Instant Payment' :
    order.paymentMethod === 'card' ? 'Credit / Debit Card' :
    order.paymentMethod === 'netbanking' ? 'Net Banking' : 'Prepaid Online';

  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return `🥛 *NEW ORDER CONFIRMATION — DUGDHSAR DAIRY*
━━━━━━━━━━━━━━━━━━━━
🆔 *Order Reference:* ${order.orderNumber}
📅 *Order Date:* ${orderDate}
⏰ *Delivery Slot:* ${order.deliverySlot}

👤 *CUSTOMER DETAILS:*
• *Full Name:* ${addr.fullName || order.customerName}
• *Mobile / WhatsApp:* ${addr.phone || order.customerPhone}
• *Delivery Address:* ${fullAddress}
• *City / Area:* ${addr.city || 'Seoni'}, MP (${addr.pincode || order.deliveryPincode})
• *Drop Instructions:* ${order.notes || addr.instructions || 'Standard Doorstep Delivery'}

📦 *ORDERED ITEMS (${order.items.length} ${order.items.length === 1 ? 'item' : 'items'}):*
${itemsList}

💰 *PAYMENT & BILLING SUMMARY:*
• *Subtotal:* ₹${(order.subtotalPaise / 100).toFixed(0)}
${order.discountPaise > 0 ? `• *Discount Applied:* -₹${(order.discountPaise / 100).toFixed(0)}\n` : ''}• *Delivery Charge:* ${order.shippingPaise === 0 ? 'FREE Cold-Chain Delivery' : `₹${(order.shippingPaise / 100).toFixed(0)}`}
• *Grand Total Payable:* ₹${(order.totalPaise / 100).toFixed(0)}
• *Payment Method:* ${paymentLabel}
• *Payment Status:* ${order.paymentStatus === 'captured' ? 'Paid / Online' : 'Pay on Delivery / Due'}

🛵 *Direct Route:* Gaushala Sanctuary (Sukla) ➔ Doorstep Delivery in Seoni, MP
📍 *Physical Shop:* Barghat Road, Sufi Nagar, Seoni, MP
━━━━━━━━━━━━━━━━━━━━
_Namaste Dugdhsar Team, please verify my order details and confirm morning/evening dispatch._`;
};

export const getWhatsAppOrderUrl = (order: Order): string => {
  const message = formatWhatsAppOrderMessage(order);
  return `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
