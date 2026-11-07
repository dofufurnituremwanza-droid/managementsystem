/**
 * Number generator utilities for DOFU Management System
 * Orders start sequentially from ORD-001 (001, 002, 003, ...)
 * Invoices start sequentially from INV-001
 * Quotations start sequentially from QUO-001
 */

/**
 * Generate the next sequential order number starting from ORD-001
 * @param {Array} orders - Array of existing orders
 * @returns {string} - e.g. "ORD-001", "ORD-002", ...
 */
export const getNextOrderNumber = (orders = []) => {
  if (!orders || orders.length === 0) {
    return 'ORD-001';
  }

  const numbers = orders
    .map((o) => {
      if (!o || !o.orderNumber) return 0;
      // Extract numeric sequence from strings like "ORD-001", "ORD-12", "005", "ORD-999"
      const match = String(o.orderNumber).match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((n) => !isNaN(n) && n > 0);

  if (numbers.length === 0) {
    return 'ORD-001';
  }

  const maxNum = Math.max(...numbers);
  const nextNum = maxNum + 1;
  return `ORD-${String(nextNum).padStart(3, '0')}`;
};

/**
 * Generate the next sequential invoice or quotation number starting from 001
 * @param {Array} invoices - Array of existing invoices
 * @param {'invoice'|'quotation'} type - Document type
 * @returns {string} - e.g. "INV-001", "QUO-001"
 */
export const getNextInvoiceNumber = (invoices = [], type = 'invoice') => {
  const prefix = type === 'quotation' ? 'QUO' : 'INV';
  if (!invoices || invoices.length === 0) {
    return `${prefix}-001`;
  }

  const filteredInvoices = invoices.filter((i) => i.type === type || (!i.type && type === 'invoice'));

  const numbers = filteredInvoices
    .map((i) => {
      if (!i || !i.invoiceNumber) return 0;
      const match = String(i.invoiceNumber).match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter((n) => !isNaN(n) && n > 0);

  if (numbers.length === 0) {
    return `${prefix}-001`;
  }

  const maxNum = Math.max(...numbers);
  const nextNum = maxNum + 1;
  return `${prefix}-${String(nextNum).padStart(3, '0')}`;
};
