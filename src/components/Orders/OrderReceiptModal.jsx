import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { Printer, Download, CheckCircle2 } from 'lucide-react';
import { downloadReceiptHtml } from '../../utils/receiptDownloader';

export const OrderReceiptModal = () => {
  const { modalConfig, setModalConfig, settings, formatMoney } = useApp();
  const order = modalConfig.data;

  if (modalConfig.type !== 'order_receipt' || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadReceiptHtml(`DOFU_Order_Receipt_${order.orderNumber}`, 'printable-order-receipt');
  };

  const balance = Math.max(0, (Number(order.totalPrice) || 0) - (Number(order.depositPaid) || 0));
  const isFullyPaid = balance <= 0 && Number(order.depositPaid) > 0;

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        dateStyle: 'medium'
      })
    : new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={`Order & Payment Receipt (${order.orderNumber})`}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setModalConfig({ type: null })}>
            Done
          </button>
          <button className="btn btn-outline-gold" onClick={handleDownload} title="Download offline receipt">
            <Download size={16} />
            <span>Download Receipt</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint} title="Print or Save as PDF">
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
        </div>
      }
    >
      <div className="print-document" id="printable-order-receipt">
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
            style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 8px', display: 'block' }}
          />
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              color: '#111827',
              margin: '0 0 4px',
              fontWeight: 800,
              letterSpacing: '0.02em'
            }}
          >
            DOFU FURNITURE MWANZA
          </h2>
          <div style={{ fontSize: '0.84rem', color: '#854d0e', margin: '0 0 6px', fontWeight: 700 }}>
            OFFICIAL CUSTOM FURNITURE ORDER & PAYMENT RECEIPT
          </div>
          <div style={{ fontSize: '0.78rem', color: '#374151', lineHeight: 1.45 }}>
            <div><strong>LOCATION:</strong> BUGARIKA SOKON, BUGANDO, MWANZA</div>
            <div><strong>PHONE:</strong> +255769456793 | <strong>EMAIL:</strong> dofufurnituremwanza@gmail.com</div>
          </div>
        </div>

        {/* Order & Client Meta */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '18px',
            fontSize: '0.84rem',
            color: '#111827'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700 }}>
              ORDER & RECEIPT REFERENCE
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', fontFamily: 'var(--font-mono)' }}>
              {order.orderNumber}
            </div>
            <div>Date Placed: {formattedDate}</div>
            <div>Target Handover: <strong>{order.dueDate || 'Standard Production (14 Days)'}</strong></div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700 }}>
              CLIENT INFORMATION
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.96rem' }}>
              {order.clientName}
            </div>
            {order.clientPhone && <div>Phone: {order.clientPhone}</div>}
            <div>Status: <strong style={{ textTransform: 'uppercase' }}>{order.status || 'Active Order'}</strong></div>
          </div>
        </div>

        {/* Ordered Furniture Piece Details */}
        <div style={{ marginBottom: '18px' }}>
          <h4
            style={{
              fontSize: '0.84rem',
              textTransform: 'uppercase',
              color: '#374151',
              letterSpacing: '0.05em',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '4px',
              marginBottom: '10px'
            }}
          >
            ORDERED FURNITURE SPECIFICATIONS
          </h4>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px',
              background: '#fff',
              marginBottom: '12px'
            }}
          >
            {order.imageUrl && (
              <div
                style={{
                  width: '90px',
                  height: '80px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #d1d5db',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f9fafb'
                }}
              >
                <img
                  src={order.imageUrl}
                  alt="Product Reference"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            )}

            <div style={{ flex: 1, fontSize: '0.84rem', color: '#111827' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
                {order.itemName} {order.quantity > 1 ? `(Qty: ${order.quantity})` : ''}
              </div>
              <div style={{ color: '#854d0e', fontWeight: 600, marginTop: '2px' }}>
                🪵 Wood: {order.woodType || 'Hardwood Timber'}
              </div>
              {order.dimensions && <div>📐 Dimensions: {order.dimensions}</div>}
              {order.fabric && <div>🧵 Fabric/Leather: {order.fabric}</div>}
              {order.finishType && <div>🎨 Finish: {order.finishType}</div>}
            </div>
          </div>
        </div>

        {/* Payment & Deposit Summary */}
        <div
          style={{
            borderTop: '2px solid #111827',
            paddingTop: '12px',
            marginBottom: '18px',
            fontSize: '0.88rem',
            color: '#111827'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Total Agreed Order Value:</span>
            <span style={{ fontWeight: 700 }}>{formatMoney(order.totalPrice)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#059669',
              background: '#ecfdf5',
              padding: '8px 10px',
              borderRadius: '6px'
            }}
          >
            <span>DEPOSIT / PAYMENT RECEIVED:</span>
            <span>{formatMoney(order.depositPaid)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 700,
              fontSize: '0.94rem',
              padding: '4px 10px',
              color: balance <= 0 ? '#059669' : '#dc2626'
            }}
          >
            <span>{balance <= 0 ? 'STATUS:' : 'BALANCE REMAINING ON DELIVERY:'}</span>
            <span>{balance <= 0 ? '✓ FULLY PAID' : formatMoney(balance)}</span>
          </div>
        </div>

        {/* Official Terms & Workshop Guarantee */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#6b7280',
            borderTop: '1px dashed #d1d5db',
            paddingTop: '12px'
          }}
        >
          <p style={{ fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
            Thank you for trusting DOFU FURNITURE MWANZA with your custom furniture!
          </p>
          <p style={{ margin: 0 }}>
            LOCATION: BUGARIKA SOKON, BUGANDO, MWANZA | PHONE: +255769456793
          </p>
        </div>
      </div>
    </Modal>
  );
};
