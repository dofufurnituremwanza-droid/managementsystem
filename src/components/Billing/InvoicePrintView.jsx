import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { Printer, Download, CheckCircle2, Check, ShieldCheck, MessageCircle } from 'lucide-react';
import { downloadReceiptPdf } from '../../utils/receiptDownloader';
import { shareInvoicePdfViaWhatsApp, shareInvoiceViaWhatsApp } from '../../utils/whatsappShare';
import confetti from 'canvas-confetti';

export const InvoicePrintView = () => {
  const { modalConfig, setModalConfig, orders, settings, formatMoney, editItem, showToast } = useApp();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);

  const invoice = modalConfig.data;

  if (modalConfig.type !== 'print_invoice' || !invoice) return null;

  const isQuote = invoice.type === 'quotation';
  const totalAmount = Number(invoice.totalAmount) || 0;
  const amountPaid = Number(invoice.amountPaid) || 0;
  const balance = Math.max(0, totalAmount - amountPaid);
  const isFullyPaid = balance <= 0 && totalAmount > 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const docType = isQuote ? 'Proforma' : 'Invoice';
      const cleanClient = (invoice.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `DOFU_${docType}_${invoice.invoiceNumber}_${cleanClient}`;

      await downloadReceiptPdf(filename, 'printable-invoice');
      showToast(`PDF ${docType} generated and downloaded successfully!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Error generating PDF, opening system print.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSharePdfToWhatsApp = async () => {
    setIsSharingPdf(true);
    try {
      await shareInvoicePdfViaWhatsApp(invoice, 'printable-invoice', showToast);
    } catch (err) {
      console.error(err);
      showToast('Failed to share PDF: ' + err.message, 'error');
    } finally {
      setIsSharingPdf(false);
    }
  };

  const handleMarkPaidInFull = async () => {
    const confirmed = window.confirm(
      `Confirm Final Payment on Delivery for Invoice ${invoice.invoiceNumber}?\n\n` +
      `Client: ${invoice.clientName}\n` +
      `Remaining Balance: ${formatMoney(balance)}\n\n` +
      `Click OK to mark as PAID IN FULL.`
    );
    if (!confirmed) return;

    setIsUpdating(true);
    try {
      await editItem('invoices', invoice.id, {
        amountPaid: totalAmount,
        status: 'paid'
      });

      // Synchronize linked order if present
      if (invoice.orderId || invoice.orderNumber) {
        const linkedOrder = orders?.find(
          (o) =>
            (invoice.orderId && o.id === invoice.orderId) ||
            (invoice.orderNumber && o.orderNumber === invoice.orderNumber)
        );
        if (linkedOrder) {
          await editItem('orders', linkedOrder.id, {
            depositPaid: totalAmount,
            isPaidInFull: true,
            status: 'delivered'
          });
        }
      }

      // Update in-modal data so it reflects immediately
      setModalConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          amountPaid: totalAmount,
          status: 'paid'
        }
      }));

      try {
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.5 }
        });
      } catch (e) {}

      showToast(`Invoice ${invoice.invoiceNumber} marked as PAID IN FULL on delivery!`, 'success');
    } catch (err) {
      showToast(`Failed to update invoice: ${err.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={`${isQuote ? 'Proforma Quotation' : 'Official Commercial Invoice'} (${invoice.invoiceNumber})`}
      size="xl"
      footer={
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {!isQuote && !isFullyPaid && (
              <button
                type="button"
                className="btn-tick-settle"
                onClick={handleMarkPaidInFull}
                disabled={isUpdating}
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
              >
                <span className="tick-box" style={{ width: '18px', height: '18px' }}>
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>Mark Paid in Full on Delivery ✓</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} className="modal-footer-actions">
            <button className="btn btn-secondary" onClick={() => setModalConfig({ type: null })}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-whatsapp"
              onClick={handleSharePdfToWhatsApp}
              disabled={isSharingPdf || isDownloading}
              title={`Share official PDF ${isQuote ? 'proforma quote' : 'invoice'} directly to customer via WhatsApp`}
            >
              <MessageCircle size={16} />
              <span>{isSharingPdf ? 'Preparing PDF...' : 'Share PDF to WhatsApp'}</span>
            </button>
            <button
              className="btn btn-outline-gold"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              title={`Download as true .PDF file only`}
            >
              <Download size={16} />
              <span>{isDownloading ? 'Generating PDF...' : `Download PDF ${isQuote ? 'Proforma' : 'Invoice'}`}</span>
            </button>
            <button className="btn btn-primary" onClick={handlePrint} title="Print Document">
              <Printer size={16} />
              <span>Print</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Interactive Settlement Banner if Customer Has Outstanding Balance */}
      {!isQuote && !isFullyPaid && (
        <div className="btn-tick-settle-modal" onClick={handleMarkPaidInFull} title="Click to settle remaining balance upon delivery">
          <div className="tick-box-large">
            <Check size={20} strokeWidth={3} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>CUSTOMER FINISHED PAYMENT ON DELIVERY?</span>
              <span style={{ fontSize: '0.74rem', background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                CLICK TO MARK PAID IN FULL ✓
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#d1fae5', marginTop: '2px' }}>
              Remaining Balance Due: <strong>{formatMoney(balance)}</strong>. Click to record final settlement and mark as PAID IN FULL.
            </div>
          </div>
        </div>
      )}

      <div
        className="print-document"
        id="printable-invoice"
        style={{
          background: '#ffffff',
          color: '#111827',
          padding: '28px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        {/* Header Branding */}
        <div className="print-header-layout">
          <div className="print-header-brand">
            <img src="/logo.png" alt="DOFU Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  color: '#111827',
                  margin: 0,
                  fontWeight: 900,
                  lineHeight: 1.15
                }}
              >
                DOFU FURNITURE MWANZA
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#854d0e', margin: '3px 0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Custom Bespoke Furniture & Luxury Interior Architecture
              </p>
              <div style={{ fontSize: '0.76rem', color: '#4b5563', lineHeight: 1.45, marginTop: '4px' }}>
                <div>📍 <strong>LOCATION:</strong> BUGARIKA SOKON, BUGANDO, MWANZA</div>
                <div>📞 <strong>PHONE:</strong> +255769456793 | ✉️ <strong>EMAIL:</strong> dofufurnituremwanza@gmail.com</div>
              </div>
            </div>
          </div>

          <div className="print-header-stamp">
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.45rem',
                color: isQuote ? '#2563eb' : '#111827',
                margin: 0,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {isQuote ? 'PROFORMA QUOTE' : 'OFFICIAL INVOICE'}
            </h2>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#c5a059',
                marginTop: '3px'
              }}
            >
              {invoice.invoiceNumber || 'INV-001'}
            </div>
            {invoice.orderNumber && (
              <div
                style={{
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#1d4ed8',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  marginTop: '3px',
                  display: 'inline-block',
                  fontWeight: 700
                }}
              >
                Order Ref: #{invoice.orderNumber}
              </div>
            )}
            <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '4px' }}>
              Issue Date: <strong>{invoice.issueDate || new Date().toISOString().split('T')[0]}</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
              Payment Due: <strong>{invoice.dueDate || 'Upon Delivery'}</strong>
            </div>

            {/* Official Stamp Watermark */}
            <div style={{ marginTop: '8px' }}>
              {isQuote ? (
                <div
                  style={{
                    border: '2px solid #2563eb',
                    color: '#2563eb',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    transform: 'rotate(-2deg)'
                  }}
                >
                  PROFORMA ESTIMATE (VALID 30 DAYS)
                </div>
              ) : isFullyPaid ? (
                <div className="receipt-official-stamp paid">
                  <div style={{ fontSize: '0.62rem', fontWeight: 800 }}>★ DOFU MWANZA ★</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, margin: '1px 0' }}>✓ PAID IN FULL</div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700 }}>TAX INVOICE CLEARED</div>
                </div>
              ) : (
                <div className="receipt-official-stamp partial">
                  <div style={{ fontSize: '0.62rem', fontWeight: 800 }}>★ DOFU MWANZA ★</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 900, margin: '1px 0' }}>PARTIAL PAYMENT</div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700 }}>BALANCE DUE ON DELIVERY</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To & Payment Summary Card */}
        <div className="print-meta-grid">
          <div>
            <span
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                color: '#64748b',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}
            >
              BILLED TO CUSTOMER:
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '3px' }}>
              {invoice.clientName || 'Walk-in Client'}
            </div>
            {invoice.clientPhone && (
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                Phone: <strong>{invoice.clientPhone}</strong>
              </div>
            )}
            {invoice.clientAddress && (
              <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                Delivery Location: {invoice.clientAddress}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                color: '#64748b',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}
            >
              PAYMENT STATUS:
            </span>
            <div style={{ marginTop: '3px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  background:
                    isFullyPaid || invoice.status === 'paid'
                      ? '#d1fae5'
                      : invoice.status === 'partial'
                      ? '#fef3c7'
                      : '#fee2e2',
                  color:
                    isFullyPaid || invoice.status === 'paid'
                      ? '#065f46'
                      : invoice.status === 'partial'
                      ? '#92400e'
                      : '#b91c1c'
                }}
              >
                {isFullyPaid ? 'PAID IN FULL ✓' : invoice.status === 'partial' ? 'PARTIAL PAYMENT' : 'UNPAID'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '5px' }}>
              Grand Total: <strong>{formatMoney(invoice.totalAmount)}</strong>
            </div>
            {amountPaid > 0 && (
              <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 700 }}>
                Paid to Date: {formatMoney(amountPaid)}
              </div>
            )}
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: balance <= 0 ? '#059669' : '#dc2626', marginTop: '3px' }}>
              Balance Due: {balance <= 0 ? '✓ PAID IN FULL (0 TZS)' : formatMoney(balance)}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ marginBottom: '20px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              color: '#0f172a',
              fontSize: '0.86rem'
            }}
          >
            <thead>
              <tr style={{ background: '#0f172a', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', width: '6%', textAlign: 'center' }}>#</th>
                <th style={{ padding: '10px 12px' }}>Description / Furniture Specifications</th>
                <th style={{ padding: '10px 12px', width: '10%', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '10px 12px', width: '22%', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '10px 12px', width: '22%', textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt="Product"
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                            border: '1px solid #e2e8f0',
                            flexShrink: 0
                          }}
                        />
                      )}
                      <div>{item.description}</div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {formatMoney(item.unitPrice)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {formatMoney((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '24px'
          }}
        >
          <div style={{ width: '320px', color: '#0f172a', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Subtotal:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(invoice.subtotal)}</strong>
            </div>

            {Number(invoice.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: '#dc2626', borderBottom: '1px solid #f1f5f9' }}>
                <span>Discount:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-{formatMoney(invoice.discount)}</span>
              </div>
            )}

            {Number(invoice.taxAmount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>VAT ({invoice.taxRate || 0}%):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(invoice.taxAmount)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderTop: '2px solid #0f172a',
                borderBottom: '2px solid #0f172a',
                marginTop: '4px',
                fontSize: '1.05rem',
                fontWeight: 800
              }}
            >
              <span>Grand Total:</span>
              <span style={{ color: '#c5a059', fontFamily: 'var(--font-mono)' }}>
                {formatMoney(invoice.totalAmount)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#059669', fontSize: '0.86rem' }}>
              <span>Deposit / Amount Paid:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(invoice.amountPaid || 0)}</strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: balance <= 0 ? '#ecfdf5' : '#fef2f2',
                borderRadius: '6px',
                marginTop: '6px',
                fontWeight: 800,
                color: balance <= 0 ? '#047857' : '#b91c1c'
              }}
            >
              <span>Balance Outstanding:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {balance <= 0 ? '✓ PAID IN FULL (0 TZS)' : formatMoney(balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Banking & Lipa Details + Terms */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '18px',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '16px',
            color: '#1e293b',
            fontSize: '0.78rem'
          }}
        >
          <div>
            <h4
              style={{
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                color: '#334155',
                fontWeight: 800,
                marginBottom: '4px'
              }}
            >
              BANK & MOBILE MONEY PAYMENT DETAILS
            </h4>
            <div
              style={{
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                whiteSpace: 'pre-line',
                lineHeight: 1.45,
                color: '#475569'
              }}
            >
              {settings.paymentDetails || 'M-Pesa / Tigo Pesa: +255 769 456 793\nBank: CRDB Bank / NMB Bank\nAccount Name: DOFU FURNITURE MWANZA'}
            </div>
          </div>

          <div>
            <h4
              style={{
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                color: '#334155',
                fontWeight: 800,
                marginBottom: '4px'
              }}
            >
              TERMS & CONDITIONS
            </h4>
            <div
              style={{
                whiteSpace: 'pre-line',
                lineHeight: 1.45,
                color: '#64748b',
                fontSize: '0.74rem'
              }}
            >
              {settings.terms || '1. 50% commitment deposit required before production begins.\n2. Balance upon final inspection & delivery.\n3. Custom furniture crafted with premium Tanzanian hardwoods.'}
            </div>
          </div>
        </div>

        {/* Dual Signatures */}
        <div className="print-signature-grid">
          <div>
            <div style={{ height: '36px' }} />
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.76rem', color: '#475569' }}>
              <strong>Authorized Signatory (DOFU)</strong>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Stamp & Signature</div>
            </div>
          </div>
          <div>
            <div style={{ height: '36px' }} />
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px', fontSize: '0.76rem', color: '#475569' }}>
              <strong>Client Acceptance & Handover</strong>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Date: ____________________</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
