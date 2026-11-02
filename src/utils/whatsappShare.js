import { generateReceiptPdfFile, downloadReceiptPdf } from './receiptDownloader';

/**
 * WhatsApp Sharing Utilities for DOFU FURNITURE MWANZA
 * Generates and shares true PDF files and luxury formatted messages
 * directly to customers via WhatsApp.
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
 * Shares an Official Commercial Invoice or Proforma Quote as a TRUE PDF FILE directly to WhatsApp.
 * Uses Web Share API Level 2 on Mobile (iOS Safari, Android Chrome, Edge) to attach the actual .pdf file
 * directly into the customer's WhatsApp chat.
 * On Desktop / fallback environments, automatically saves/downloads the PDF and opens WhatsApp
 * chat with the customer ready to send the file.
 */
export const shareInvoicePdfViaWhatsApp = async (invoice, elementId = 'printable-invoice', showToast) => {
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

  const isQuote = invoice.type === 'quotation';
  const docType = isQuote ? 'Proforma' : 'Invoice';
  const cleanClient = (invoice.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `DOFU_${docType}_${invoice.invoiceNumber || 'INV'}_${cleanClient}`;

  // 1. Generate the actual in-memory PDF file from the rendered invoice
  let pdfFile = null;
  try {
    pdfFile = await generateReceiptPdfFile(filename, elementId);
  } catch (err) {
    console.warn('PDF generation error:', err);
  }

  // 2. If Web Share API supports file sharing (Mobile Safari, Android Chrome, etc.)
  if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `${filename}.pdf`,
        text: `Official ${docType} #${invoice.invoiceNumber || ''} from DOFU FURNITURE MWANZA`
      });
      if (showToast) {
        showToast(`Official PDF ${docType} shared successfully to WhatsApp!`, 'success');
      }
      return;
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') return; // User closed share sheet
      console.warn('Native share failed, using download fallback:', shareErr);
    }
  }

  // 3. Desktop / Browser Fallback:
  // Automatically download the PDF file to user's device
  try {
    await downloadReceiptPdf(filename, elementId);
  } catch (e) {}

  // Open WhatsApp directly with client's chat
  const introMsg = encodeURIComponent(
    `Hello ${invoice.clientName || 'Valued Customer'},\n\nPlease find attached your official ${docType} #${invoice.invoiceNumber || ''} from DOFU FURNITURE MWANZA.\n\nThank you for choosing DOFU!`
  );
  const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${introMsg}` : `https://wa.me/?text=${introMsg}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  if (showToast) {
    showToast(
      `PDF ${docType} downloaded to your device! WhatsApp is opening so you can send the PDF file.`,
      'success',
      6000
    );
  }
};

/**
 * Shares an Order & Deposit Payment Receipt as a TRUE PDF FILE directly to WhatsApp.
 */
export const shareOrderReceiptPdfViaWhatsApp = async (order, elementId = 'printable-order-receipt', showToast) => {
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

  const cleanClient = (order.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `DOFU_Receipt_${order.orderNumber || 'ORD'}_${cleanClient}`;

  let pdfFile = null;
  try {
    pdfFile = await generateReceiptPdfFile(filename, elementId);
  } catch (err) {
    console.warn('PDF generation error:', err);
  }

  if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `${filename}.pdf`,
        text: `Official Order & Payment Receipt #${order.orderNumber || ''} from DOFU FURNITURE MWANZA`
      });
      if (showToast) {
        showToast('Official PDF Receipt shared successfully to WhatsApp!', 'success');
      }
      return;
    } catch (shareErr) {
      if (shareErr.name === 'AbortError') return;
      console.warn('Native share failed, using download fallback:', shareErr);
    }
  }

  // Desktop / Browser Fallback:
  try {
    await downloadReceiptPdf(filename, elementId);
  } catch (e) {}

  const introMsg = encodeURIComponent(
    `Hello ${order.clientName || 'Valued Customer'},\n\nPlease find attached your official Order & Payment Receipt #${order.orderNumber || ''} from DOFU FURNITURE MWANZA.\n\nThank you for choosing DOFU!`
  );
  const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${introMsg}` : `https://wa.me/?text=${introMsg}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  if (showToast) {
    showToast(
      'PDF Receipt downloaded to your device! WhatsApp is opening so you can send the PDF file.',
      'success',
      6000
    );
  }
};

/**
 * Shares an Order & Deposit Payment Receipt as a formatted text message to WhatsApp
 */
export const shareOrderReceiptViaWhatsApp = (order, formatMoneyFn) => {
  if (!order) return;

  const defaultPhone = normalizePhoneForWhatsApp(order.clientPhone);
  let targetPhone = defaultPhone;

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
 * Shares an Official Commercial Invoice or Proforma Quote as a formatted text message to WhatsApp
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
