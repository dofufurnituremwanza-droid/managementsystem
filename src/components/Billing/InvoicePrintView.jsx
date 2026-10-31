import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { Printer, Download, CheckCircle2 } from 'lucide-react';

import { downloadReceiptHtml } from '../../utils/receiptDownloader';

export const InvoicePrintView = () => {
  const { modalConfig, setModalConfig, settings, formatMoney } = useApp();
  const invoice = modalConfig.data;

  if (modalConfig.type !== 'print_invoice' || !invoice) return null;

  const isQuote = invoice.type === 'quotation';
  const balance = (Number(invoice.totalAmount) || 0) - (Number(invoice.amountPaid) || 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadReceiptHtml(`DOFU_${isQuote ? 'Quote' : 'Invoice'}_${invoice.invoiceNumber}`, 'printable-invoice');
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={`Print ${isQuote ? 'Quotation' : 'Official Invoice'}`}
      size="xl"
      footer={
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setModalConfig({ type: null })}>
            Close
          </button>
          <button className="btn btn-outline-gold" onClick={handleDownload} title="Download offline copy">
            <Download size={16} />
            <span>Download</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print or Save to PDF</span>
          </button>
        </div>
      }
    >
      <div className="print-document" id="printable-invoice">
        {/* Header Branding */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '3px solid #c5a059',
            paddingBottom: '20px',
            marginBottom: '24px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src="/logo.png" alt="DOFU Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.7rem',
                    color: '#111827',
                    margin: 0,
                    lineHeight: 1.1
                  }}
                >
                  {settings.businessName}
                </h1>
                <p style={{ fontSize: '0.82rem', color: '#854d0e', margin: 0, fontWeight: 600 }}>
                  {settings.tagline}
                </p>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '10px', lineHeight: 1.5 }}>
              <div>{settings.address}</div>
              <div>Tel: {settings.phone} | Email: {settings.email}</div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.8rem',
                color: isQuote ? '#2563eb' : '#111827',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {isQuote ? 'PROFORMA QUOTE' : 'OFFICIAL INVOICE'}
            </h2>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#c5a059',
                marginTop: '4px'
              }}
            >
              {invoice.invoiceNumber || 'INV-001'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#4b5563', marginTop: '6px' }}>
              Date: <strong>{invoice.issueDate || new Date().toISOString().split('T')[0]}</strong>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#4b5563' }}>
              Due Date: <strong>{invoice.dueDate || 'Upon Receipt'}</strong>
            </div>
          </div>
        </div>

        {/* Bill To & Payment Summary Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '26px',
            color: '#111827'
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                color: '#6b7280',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}
            >
              ISSUED TO CLIENT:
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111827', marginTop: '4px' }}>
              {invoice.clientName}
            </div>
            {invoice.clientPhone && (
              <div style={{ fontSize: '0.84rem', color: '#4b5563', marginTop: '2px' }}>
                Phone: {invoice.clientPhone}
              </div>
            )}
            {invoice.clientAddress && (
              <div style={{ fontSize: '0.84rem', color: '#4b5563' }}>
                Delivery Site: {invoice.clientAddress}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                color: '#6b7280',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}
            >
              PAYMENT STATUS:
            </span>
            <div style={{ marginTop: '4px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  background:
                    invoice.status === 'paid'
                      ? '#d1fae5'
                      : invoice.status === 'partial'
                      ? '#fef3c7'
                      : '#fee2e2',
                  color:
                    invoice.status === 'paid'
                      ? '#065f46'
                      : invoice.status === 'partial'
                      ? '#92400e'
                      : '#b91c1c'
                }}
              >
                {invoice.status || 'Unpaid'}
              </span>
            </div>
            <div style={{ fontSize: '0.84rem', color: '#4b5563', marginTop: '6px' }}>
              Total: <strong>{formatMoney(invoice.totalAmount)}</strong>
            </div>
            {Number(invoice.amountPaid) > 0 && (
              <div style={{ fontSize: '0.84rem', color: '#059669' }}>
                Paid to Date: {formatMoney(invoice.amountPaid)}
              </div>
            )}
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: balance <= 0 ? '#059669' : '#dc2626', marginTop: '4px' }}>
              Balance Due: {balance <= 0 ? 'Fully Paid' : formatMoney(balance)}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ marginBottom: '24px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              color: '#111827',
              fontSize: '0.88rem'
            }}
          >
            <thead>
              <tr style={{ background: '#111827', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', width: '8%', textAlign: 'center' }}>#</th>
                <th style={{ padding: '10px 14px' }}>Description / Specifications</th>
                <th style={{ padding: '10px 14px', width: '12%', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '10px 14px', width: '20%', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '10px 14px', width: '22%', textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#6b7280' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>
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
                            border: '1px solid #e5e7eb',
                            flexShrink: 0
                          }}
                        />
                      )}
                      <div>{item.description}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    {formatMoney(item.unitPrice)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700 }}>
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
            marginBottom: '28px'
          }}
        >
          <div style={{ width: '320px', color: '#111827', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280' }}>Subtotal:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(invoice.subtotal)}</strong>
            </div>

            {Number(invoice.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#dc2626', borderBottom: '1px solid #f3f4f6' }}>
                <span>Discount:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-{formatMoney(invoice.discount)}</span>
              </div>
            )}

            {Number(invoice.taxAmount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>VAT ({invoice.taxRate || 0}%):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(invoice.taxAmount)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderTop: '2px solid #111827',
                borderBottom: '2px solid #111827',
                marginTop: '6px',
                fontSize: '1.1rem',
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
                fontWeight: 700,
                color: balance <= 0 ? '#065f46' : '#991b1b'
              }}
            >
              <span>Balance Outstanding:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {balance <= 0 ? 'PAID IN FULL' : formatMoney(balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Banking & Lipa Details + Terms */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            borderTop: '1px solid #e5e7eb',
            paddingTop: '18px',
            color: '#111827',
            fontSize: '0.78rem'
          }}
        >
          <div>
            <h4
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                color: '#374151',
                fontWeight: 700,
                marginBottom: '6px'
              }}
            >
              BANK & MOBILE MONEY PAYMENT DETAILS
            </h4>
            <div
              style={{
                background: '#f9fafb',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                whiteSpace: 'pre-line',
                lineHeight: 1.5,
                color: '#4b5563'
              }}
            >
              {settings.paymentDetails}
            </div>
          </div>

          <div>
            <h4
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                color: '#374151',
                fontWeight: 700,
                marginBottom: '6px'
              }}
            >
              TERMS & CONDITIONS
            </h4>
            <div
              style={{
                whiteSpace: 'pre-line',
                lineHeight: 1.45,
                color: '#6b7280',
                fontSize: '0.74rem'
              }}
            >
              {settings.terms}
            </div>
          </div>
        </div>

        {/* Client & Authorizer Signature Box */}
        <div
          style={{
            marginTop: '34px',
            display: 'flex',
            justifyContent: 'space-between',
            color: '#111827',
            paddingTop: '20px'
          }}
        >
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ height: '40px' }} />
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '6px', fontSize: '0.78rem', color: '#4b5563' }}>
              Authorized Signatory (DOFU)
            </div>
          </div>
          <div style={{ textAlign: 'center', width: '220px' }}>
            <div style={{ height: '40px' }} />
            <div style={{ borderTop: '1px solid #9ca3af', paddingTop: '6px', fontSize: '0.78rem', color: '#4b5563' }}>
              Client Acceptance & Date
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
