import { generateReceiptPdfFile, downloadReceiptPdf } from './receiptDownloader';

/**
 * WhatsApp Sharing Utilities for DOFU FURNITURE MWANZA
 * Supports both WhatsApp Messenger and WhatsApp Business seamlessly on iOS, Android, and Desktop.
 * Provides direct PDF file sharing via native Web Share API Level 2 and formatted text messages.
 */

/**
 * Normalizes phone numbers into international WhatsApp format (E.164 without plus)
 * Defaults to Tanzania country code (255) when local format (07... / 06...) is provided.
 */
export const normalizePhoneForWhatsApp = (rawPhone) => {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).replace(/[^\d]/g, '');

  // If local Tanzanian number starting with 0 (e.g. 07... or 06...)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '255' + cleaned.substring(1);
  }

  return cleaned;
};

/**
 * Opens WhatsApp or WhatsApp Business directly without forcing the user to choose.
 * On iOS and Android mobile:
 * - Uses the native custom URL scheme `whatsapp://send` which is natively registered
 *   for both WhatsApp Messenger and WhatsApp Business.
 * - Seamlessly falls back to the universal link `https://api.whatsapp.com/send`.
 * On Desktop:
 * - Opens WhatsApp Web directly with pre-populated phone and message.
 */
export const openWhatsAppDirect = (rawPhone, messageText = '') => {
  const targetPhone = normalizePhoneForWhatsApp(rawPhone);
  const encoded = encodeURIComponent(messageText || '');
  const isMobile =
    typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    const nativeScheme = targetPhone
      ? `whatsapp://send?phone=${targetPhone}&text=${encoded}`
      : `whatsapp://send?text=${encoded}`;

    const universalLink = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    // On iOS Safari / Android: Launch native scheme directly
    try {
      window.location.href = nativeScheme;

      // If app is not installed or scheme fails to take focus, fallback to universal link
      setTimeout(() => {
        if (!document.hidden) {
          window.location.href = universalLink;
        }
      }, 1200);
    } catch (e) {
      window.location.href = universalLink;
    }
  } else {
    // Desktop: WhatsApp Web
    const webUrl = targetPhone
      ? `https://web.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Shares an Official Commercial Invoice or Proforma Quote as a TRUE PDF FILE directly to WhatsApp.
 * - On iOS Safari / Mobile: Uses native Web Share API Level 2.
 *   CRITICAL FOR IPHONES: iOS WebKit strictly requires passing ONLY `{ files: [pdfFile] }` without
 *   `title` or `text`. Passing title or text with files causes WebKit to reject the share.
 *   The iOS share sheet then presents both WhatsApp and WhatsApp Business for direct one-tap selection!
 * - Never forces an automatic download on iPhone / mobile if native share fails or is closed.
 * - On Desktop: Downloads the PDF and opens WhatsApp Web ready to send.
 */
export const shareInvoicePdfViaWhatsApp = async (invoice, elementId = 'printable-invoice', showToast) => {
  if (!invoice) return false;

  const isMobile =
    typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const defaultPhone = normalizePhoneForWhatsApp(invoice.clientPhone);
  let targetPhone = defaultPhone;

  const isQuote = invoice.type === 'quotation';
  const docType = isQuote ? 'Proforma' : 'Invoice';
  const cleanClient = (invoice.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `DOFU_${docType}_${invoice.invoiceNumber || 'INV'}_${cleanClient}`;

  // 1. Generate the true in-memory PDF File object
  let pdfFile = null;
  try {
    pdfFile = await generateReceiptPdfFile(filename, elementId);
  } catch (err) {
    console.warn('PDF generation error:', err);
  }

  // 2. Mobile Native Share (iOS Safari, Android Chrome)
  // WebKit iOS rule: pass ONLY `files` array (NO title, NO text)
  if (pdfFile && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    const sharePayload = { files: [pdfFile] };

    let canShare = false;
    try {
      canShare = typeof navigator.canShare === 'function' ? navigator.canShare(sharePayload) : true;
    } catch (e) {
      canShare = false;
    }

    if (canShare) {
      try {
        await navigator.share(sharePayload);
        if (showToast) {
          showToast(`Official PDF ${docType} shared! Select WhatsApp or WhatsApp Business.`, 'success');
        }
        return true;
      } catch (shareErr) {
        // User dismissed the iOS/Android share sheet. Do NOT trigger fallback download!
        if (shareErr.name === 'AbortError') {
          return false;
        }
        console.warn('Native file share failed:', shareErr);
      }
    }
  }

  // 3. Fallback:
  // On Mobile: NEVER force a file download into iPhone Downloads/Files folder.
  // Instead, open WhatsApp directly with customer details (compatible with both WhatsApp and WhatsApp Business).
  const formatMoney = (val) => `TZS ${Number(val || 0).toLocaleString()}`;
  const totalAmount = Number(invoice.totalAmount) || 0;
  const amountPaid = Number(invoice.amountPaid) || 0;
  const balance = Math.max(0, totalAmount - amountPaid);

  const summaryMsg = [
    `*DOFU FURNITURE MWANZA*`,
    `_Official ${docType} #${invoice.invoiceNumber || 'INV'}_`,
    `👤 *Client:* ${invoice.clientName || 'Valued Customer'}`,
    `💰 *Total Amount:* ${formatMoney(totalAmount)}`,
    amountPaid > 0 ? `💵 *Advance Paid:* ${formatMoney(amountPaid)}` : '',
    balance > 0 ? `⏳ *Balance Due:* ${formatMoney(balance)}` : `✅ *Status:* Paid in Full`,
    `\nThank you for choosing DOFU! Please contact us at +255 769 456 793 for any questions.`
  ]
    .filter(Boolean)
    .join('\n');

  if (isMobile) {
    let destPhone = targetPhone;
    if (!destPhone) {
      const input = window.prompt(
        'Enter customer WhatsApp phone number (e.g. 0769456793 or 255769456793):',
        invoice.clientPhone || '255'
      );
      if (input) destPhone = normalizePhoneForWhatsApp(input);
    }
    openWhatsAppDirect(destPhone, summaryMsg);
    if (showToast) {
      showToast('Opening WhatsApp! Tap "Download PDF" if you also need a saved file.', 'info', 4000);
    }
    return false;
  }

  // Desktop Fallback only:
  try {
    await downloadReceiptPdf(filename, elementId);
  } catch (e) {}

  let destPhone = targetPhone;
  if (!destPhone) {
    const input = window.prompt(
      'Enter customer WhatsApp phone number (e.g. 0769456793 or 255769456793):',
      invoice.clientPhone || '255'
    );
    if (input) destPhone = normalizePhoneForWhatsApp(input);
  }
  openWhatsAppDirect(destPhone, summaryMsg);
  if (showToast) {
    showToast(`PDF ${docType} downloaded. WhatsApp Web is opening.`, 'success', 5000);
  }
  return true;
};

/**
 * Shares an Order & Deposit Payment Receipt as a TRUE PDF FILE directly to WhatsApp.
 * Uses native Web Share API Level 2 on iPhone and Android mobile.
 */
export const shareOrderReceiptPdfViaWhatsApp = async (order, elementId = 'printable-order-receipt', showToast) => {
  if (!order) return false;

  const isMobile =
    typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const defaultPhone = normalizePhoneForWhatsApp(order.clientPhone);
  let targetPhone = defaultPhone;

  const cleanClient = (order.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `DOFU_Receipt_${order.orderNumber || 'ORD'}_${cleanClient}`;

  let pdfFile = null;
  try {
    pdfFile = await generateReceiptPdfFile(filename, elementId);
  } catch (err) {
    console.warn('PDF generation error:', err);
  }

  if (pdfFile && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    const sharePayload = { files: [pdfFile] };

    let canShare = false;
    try {
      canShare = typeof navigator.canShare === 'function' ? navigator.canShare(sharePayload) : true;
    } catch (e) {
      canShare = false;
    }

    if (canShare) {
      try {
        await navigator.share(sharePayload);
        if (showToast) {
          showToast('Official PDF Receipt shared! Select WhatsApp or WhatsApp Business.', 'success');
        }
        return true;
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') {
          return false;
        }
        console.warn('Native file share failed:', shareErr);
      }
    }
  }

  const formatMoney = (val) => `TZS ${Number(val || 0).toLocaleString()}`;
  const totalPrice = Number(order.totalPrice) || Number(order.price) || 0;
  const depositPaid = Number(order.depositPaid) || 0;
  const balance = Math.max(0, totalPrice - depositPaid);

  const summaryMsg = [
    `*DOFU FURNITURE MWANZA*`,
    `_Official Order & Payment Receipt #${order.orderNumber || 'ORD'}_`,
    `👤 *Client:* ${order.clientName || 'Valued Customer'}`,
    `🛋️ *Item:* ${order.itemName || order.category || 'Custom Furniture'}`,
    `💰 *Total Agreed Amount:* ${formatMoney(totalPrice)}`,
    `💵 *Advance Deposit Paid:* ${formatMoney(depositPaid)}`,
    balance > 0 ? `⏳ *Balance Due on Delivery:* ${formatMoney(balance)}` : `✅ *Payment:* Paid in Full`,
    `\nThank you for choosing DOFU FURNITURE MWANZA! Workshop Contact: +255 769 456 793`
  ]
    .filter(Boolean)
    .join('\n');

  if (isMobile) {
    let destPhone = targetPhone;
    if (!destPhone) {
      const input = window.prompt(
        'Enter customer WhatsApp phone number (e.g. 0769456793 or 255769456793):',
        order.clientPhone || '255'
      );
      if (input) destPhone = normalizePhoneForWhatsApp(input);
    }
    openWhatsAppDirect(destPhone, summaryMsg);
    if (showToast) {
      showToast('Opening WhatsApp! Tap "Download PDF" if you also need a saved file.', 'info', 4000);
    }
    return false;
  }

  // Desktop Fallback:
  try {
    await downloadReceiptPdf(filename, elementId);
  } catch (e) {}

  let destPhone = targetPhone;
  if (!destPhone) {
    const input = window.prompt(
      'Enter customer WhatsApp phone number (e.g. 0769456793 or 255769456793):',
      order.clientPhone || '255'
    );
    if (input) destPhone = normalizePhoneForWhatsApp(input);
  }
  openWhatsAppDirect(destPhone, summaryMsg);
  if (showToast) {
    showToast('PDF Receipt downloaded. WhatsApp Web is opening.', 'success', 5000);
  }
  return true;
};

/**
 * Shares an Order & Deposit Payment Receipt as a formatted text message to WhatsApp or WhatsApp Business
 */
export const shareOrderReceiptViaWhatsApp = (order, formatMoneyFn) => {
  if (!order) return;

  const defaultPhone = normalizePhoneForWhatsApp(order.clientPhone);
  let targetPhone = defaultPhone;

  if (!targetPhone) {
    const input = window.prompt(
      'Enter customer WhatsApp phone number (e.g. 0769456793 or 255769456793):',
      order.clientPhone || '255'
    );
    if (!input) return;
    targetPhone = normalizePhoneForWhatsApp(input);
  }

  const formatMoney = formatMoneyFn || ((val) => `TZS ${Number(val || 0).toLocaleString()}`);
  const totalPrice = Number(order.totalPrice) || Number(order.price) || 0;
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
  openWhatsAppDirect(targetPhone, messageText);
};

/**
 * Shares an Official Commercial Invoice or Proforma Quote as a formatted text message to WhatsApp or WhatsApp Business
 */
export const shareInvoiceViaWhatsApp = (invoice, formatMoneyFn) => {
  if (!invoice) return;

  const defaultPhone = normalizePhoneForWhatsApp(invoice.clientPhone);
  let targetPhone = defaultPhone;

  if (!targetPhone) {
    const input = window.prompt(
      'Enter customer WhatsApp phone number (e.g. 0769456793 or 255769456793):',
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
  openWhatsAppDirect(targetPhone, messageText);
};
