/**
 * WhatsApp Sharing Utilities for DOFU FURNITURE MWANZA
 * Generates formatted, luxury branded receipts and commercial invoices
 * for instant 1-click sharing to customers via WhatsApp.
 */

/**
 * Normalizes phone numbers into international WhatsApp format (E.164 without plus)
 * Defaults to Tanzania country code (255) when local format (07... / 06...) is provided.
 */
export const normalizePhoneForWhatsApp = (rawPhone) => {
  if (!rawPhone) return '';
  // Remove spaces, hyphens, parentheses, and plus sign
  let cleaned = String(rawPhone).replace(/[^\d]/g, '');

  // If local Tanzanian number starting with 0 (e.g. 07... or 06...)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '255' + cleaned.substring(1);
  }

  return cleaned;
};

/**
 * Shares an Order & Deposit Payment Receipt to WhatsApp
 */
export const shareOrderReceiptViaWhatsApp = (order, formatMoneyFn) => {
  if (!order) return;

  const defaultPhone = normalizePhoneForWhatsApp(order.clientPhone);
  let targetPhone = defaultPhone;

  // If no phone or user wants to verify/send to another number
  if (!targetPhone) {
    const input = window.prompt(
      'Enter customer WhatsApp phone number (e.g., 0769456793 or 255769456793):',
      order.clientPhone || '255'
    );
    if (!input) return;
    targetPhone = normalizePhoneForWhatsApp(input);
  }

  const formatMoney = formatMoneyFn || ((val) => `TZS ${Number(val || 0).toLocaleString()}`);
  const totalPrice = Number(order.totalPrice) || 0;
  const depositPaid = Number(order.depositPaid) || 0;
  const balance = Math.max(0, totalPrice - depositPaid);
  const isPaidInFull = balance <= 0 && totalPrice > 0;

  const orderDate = order.orderDate || new Date().toISOString().split('T')[0];
  const deliveryDate = order.targetDeliveryDate || order.dueDate || 'To be confirmed upon completion';

  const lines = [
    `*DOFU FURNITURE MWANZA*`,
    `_Custom Bespoke Furniture & Luxury Interior Architecture_`,
    `📍 Bugarika Sokon, Bugando, Mwanza`,
    `📞 +255 769 456 793 | ✉️ dofufurnituremwanza@gmail.com`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*OFFICIAL ORDER & PAYMENT RECEIPT*`,
    `📋 *Order Ref:* #${order.orderNumber || 'ORD'}`,
    order.invoiceNumber ? `📄 *Linked Invoice:* #${order.invoiceNumber}` : '',
    `📅 *Order Date:* ${orderDate}`,
    `🚚 *Target Delivery:* ${deliveryDate}`,
    `👤 *Client:* ${order.clientName || 'Valued Customer'}`,
    order.clientPhone ? `📞 *Phone:* ${order.clientPhone}` : '',
    order.clientAddress ? `📍 *Delivery Address:* ${order.clientAddress}` : '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*BESPOKE PIECE DETAILS:*`,
    `🛋️ *Item:* ${order.itemName || order.category || 'Custom Furniture'}`,
    order.category ? `🏷️ *Category:* ${order.category}` : '',
    order.color ? `🎨 *Color / Finish:* ${order.color}` : '',
    order.dimensions ? `📐 *Dimensions:* ${order.dimensions}` : '',
    `🔢 *Quantity:* ${order.quantity || 1}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *Total Agreed Amount:* ${formatMoney(totalPrice)}`,
    `💵 *Advance Deposit Paid:* ${formatMoney(depositPaid)}`,
    isPaidInFull
      ? `✅ *PAYMENT STATUS:* PAID IN FULL ✓ (Settled on Delivery)`
      : `⏳ *BALANCE DUE ON DELIVERY:* ${formatMoney(balance)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Issued by: *${order.recordedBy || 'DOFU Management'}*`,
    `Thank you for trusting *DOFU FURNITURE MWANZA* for your custom furniture! Your bespoke piece is being crafted with precision in our Mwanza workshop.`
  ].filter(Boolean);

  const messageText = lines.join('\n');
  const encoded = encodeURIComponent(messageText);
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${encoded}`;

  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Shares an Official Commercial Invoice or Proforma Quote to WhatsApp
 */
export const shareInvoiceViaWhatsApp = (invoice, formatMoneyFn) => {
  if (!invoice) return;

  const defaultPhone = normalizePhoneForWhatsApp(invoice.clientPhone);
  let targetPhone = defaultPhone;

  if (!targetPhone) {
    const input = window.prompt(
      'Enter customer WhatsApp phone number (e.g., 0769456793 or 255769456793):',
      invoice.clientPhone || '255'
    );
    if (!input) return;
    targetPhone = normalizePhoneForWhatsApp(input);
  }

  const formatMoney = formatMoneyFn || ((val) => `TZS ${Number(val || 0).toLocaleString()}`);
  const isQuote = invoice.type === 'quotation';
  const totalAmount = Number(invoice.totalAmount) || 0;
  const amountPaid = Number(invoice.amountPaid) || 0;
  const balance = Math.max(0, totalAmount - amountPaid);
  const isPaidInFull = balance <= 0 && totalAmount > 0;

  const docTitle = isQuote ? 'PROFORMA QUOTATION' : 'OFFICIAL COMMERCIAL INVOICE';
  const issueDate = invoice.issueDate || new Date().toISOString().split('T')[0];
  const dueDate = invoice.dueDate || 'Upon Delivery';

  // Format line items
  const itemsText = (invoice.items || [])
    .map((item, idx) => {
      const q = Number(item.quantity) || 1;
      const u = Number(item.unitPrice) || 0;
      return `${idx + 1}. *${item.description || 'Custom Item'}* (×${q}) — ${formatMoney(q * u)}`;
    })
    .join('\n');

  const lines = [
    `*DOFU FURNITURE MWANZA*`,
    `_Custom Bespoke Furniture & Luxury Interior Architecture_`,
    `📍 Bugarika Sokon, Bugando, Mwanza`,
    `📞 +255 769 456 793 | ✉️ dofufurnituremwanza@gmail.com`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*${docTitle}*`,
    `📄 *Document #:* ${invoice.invoiceNumber || 'INV'}`,
    invoice.orderNumber ? `📋 *Order Ref:* #${invoice.orderNumber}` : '',
    `📅 *Issue Date:* ${issueDate}`,
    `⏱️ *Payment Due:* ${dueDate}`,
    `👤 *Billed To:* ${invoice.clientName || 'Valued Customer'}`,
    invoice.clientPhone ? `📞 *Phone:* ${invoice.clientPhone}` : '',
    invoice.clientAddress ? `📍 *Address:* ${invoice.clientAddress}` : '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*ITEMS / SCOPE OF WORK:*`,
    itemsText || `Custom Bespoke Furniture Piece — ${formatMoney(totalAmount)}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *Subtotal:* ${formatMoney(invoice.subtotal || totalAmount)}`,
    Number(invoice.discount) > 0 ? `🏷️ *Discount:* -${formatMoney(invoice.discount)}` : '',
    Number(invoice.taxAmount) > 0 ? `🏛️ *VAT / Tax:* +${formatMoney(invoice.taxAmount)}` : '',
    `💰 *Total Amount:* ${formatMoney(totalAmount)}`,
    !isQuote ? `💵 *Amount Paid:* ${formatMoney(amountPaid)}` : '',
    !isQuote
      ? isPaidInFull
        ? `✅ *STATUS:* PAID IN FULL ✓`
        : `⏳ *BALANCE OUTSTANDING:* ${formatMoney(balance)}`
      : `📋 *STATUS:* Proforma Quote Pending Acceptance`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    invoice.paymentMethod ? `💳 *Payment Method:* ${invoice.paymentMethod}` : '',
    invoice.notes ? `📝 *Notes:* ${invoice.notes}` : '',
    `Official commercial document issued by *DOFU FURNITURE MWANZA*. For inquiries, call or WhatsApp +255 769 456 793.`
  ].filter(Boolean);

  const messageText = lines.join('\n');
  const encoded = encodeURIComponent(messageText);
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${encoded}`;

  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};
