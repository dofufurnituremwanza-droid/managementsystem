import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { Printer, CheckCircle2, ShoppingBag } from 'lucide-react';

export const SaleReceiptModal = () => {
  const { modalConfig, setModalConfig, settings, formatMoney } = useApp();
  const sale = modalConfig.data;

  if (modalConfig.type !== 'sale_receipt' || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = sale.saleDate
    ? new Date(sale.saleDate).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    : new Date().toLocaleDateString();

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={`Showroom Sales Receipt (${sale.receiptNumber})`}
      size="md"
      footer={
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setModalConfig({ type: null })}>
            Done
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
        </div>
      }
    >
      <div className="print-document" id="printable-sale-receipt">
        {/* Receipt Header */}
        <div
          style={{
            textAlign: 'center',
            borderBottom: '2px solid #111827',
            paddingBottom: '16px',
            marginBottom: '16px'
          }}
        >
          <img
            src="/logo.png"
            alt="DOFU Logo"
            style={{ width: '56px', height: '56px', objectFit: 'contain', margin: '0 auto 8px' }}
          />
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              color: '#111827',
              margin: 0,
              fontWeight: 800
            }}
          >
            {settings.businessName}
          </h2>
          <div style={{ fontSize: '0.8rem', color: '#4b5563', margin: '2px 0' }}>
            SHOWROOM SALES RECEIPT / CASH SALE
          </div>
          <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
            {settings.address} | Phone: {settings.phone}
          </div>
        </div>

        {/* Receipt Details Meta */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            color: '#111827',
            marginBottom: '16px',
            borderBottom: '1px dashed #d1d5db',
            paddingBottom: '12px'
          }}
        >
          <div>
            <div>
              Receipt #: <strong style={{ fontFamily: 'var(--font-mono)' }}>{sale.receiptNumber}</strong>
            </div>
            <div>Date & Time: {formattedDate}</div>
            <div>Cashier / Staff: DOFU Showroom</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div>
              Client: <strong>{sale.clientName || 'Walk-in Customer'}</strong>
            </div>
            {sale.clientPhone && <div>Phone: {sale.clientPhone}</div>}
            <div>Payment: {sale.paymentMethod || 'Cash'}</div>
          </div>
        </div>

        {/* Purchased Items */}
        <div style={{ marginBottom: '18px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.86rem',
              color: '#111827'
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #111827', background: '#f3f4f6' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Item / Description</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', width: '12%' }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '25%' }}>Price</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', width: '28%' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {sale.imageUrl && (
                      <img
                        src={sale.imageUrl}
                        alt="Product Photo"
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: '1px solid #e5e7eb',
                          flexShrink: 0
                        }}
                      />
                    )}
                    <div>
                      <div style={{ fontWeight: 700 }}>{sale.itemName}</div>
                      {sale.sku && (
                        <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                          SKU: {sale.sku}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>
                  {sale.quantity}
                </td>
                <td style={{ padding: '10px', textAlign: 'right' }}>
                  {formatMoney(sale.unitPrice)}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>
                  {formatMoney(sale.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div
          style={{
            borderTop: '2px solid #111827',
            paddingTop: '12px',
            marginBottom: '20px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.92rem',
              marginBottom: '6px'
            }}
          >
            <span>Subtotal:</span>
            <span style={{ fontWeight: 600 }}>{formatMoney(sale.totalAmount)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '1.1rem',
              fontWeight: 800,
              color: '#111827',
              marginBottom: '6px'
            }}
          >
            <span>Total Amount Paid:</span>
            <span>{formatMoney(sale.amountPaid)}</span>
          </div>

          {sale.balance > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.86rem',
                color: '#dc2626',
                fontWeight: 700
              }}
            >
              <span>Balance Remaining:</span>
              <span>{formatMoney(sale.balance)}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              color: '#4b5563',
              marginTop: '4px'
            }}
          >
            <span>Payment Method:</span>
            <span style={{ fontWeight: 600 }}>{sale.paymentMethod}</span>
          </div>
        </div>

        {/* Footer Warranty & Thanks */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#6b7280',
            borderTop: '1px dashed #d1d5db',
            paddingTop: '12px'
          }}
        >
          <p style={{ fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>
            Thank you for purchasing with DOFU Furniture & Interior Design!
          </p>
          <p style={{ margin: 0 }}>
            Crafted with passion in Mwanza, Tanzania.
          </p>
        </div>
      </div>
    </Modal>
  );
};
