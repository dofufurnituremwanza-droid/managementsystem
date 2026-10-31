import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { Printer, Download, X } from 'lucide-react';
import { downloadReceiptHtml } from '../../utils/receiptDownloader';

export const JobCardPrint = () => {
  const { modalConfig, setModalConfig, settings } = useApp();
  const order = modalConfig.data;

  if (modalConfig.type !== 'print_job_card' || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadReceiptHtml(`DOFU_JobCard_${order.orderNumber}`, 'printable-job-card');
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title="Workshop Job Card & Cutting Specification"
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setModalConfig({ type: null })}>
            Close
          </button>
          <button className="btn btn-outline-gold" onClick={handleDownload} title="Download offline Job Card">
            <Download size={16} />
            <span>Download</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Workshop Job Card</span>
          </button>
        </div>
      }
    >
      <div className="print-document" id="printable-job-card">
        {/* Document Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #1f2937',
            paddingBottom: '16px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="/logo.png" alt="DOFU Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.6rem',
                  color: '#111827',
                  margin: 0
                }}
              >
                {settings.businessName}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#4b5563', margin: '2px 0 0' }}>
                CARPENTRY & PRODUCTION WORKSHOP JOB CARD
              </p>
              <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0 }}>
                {settings.address} | Phone: {settings.phone}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                background: '#111827',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                fontWeight: 700,
                display: 'inline-block'
              }}
            >
              JOB #{order.orderNumber || 'ORD-001'}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: '6px 0 0' }}>
              Due Date:{' '}
              <strong style={{ color: '#dc2626' }}>
                {order.dueDate || 'Standard Production'}
              </strong>
            </p>
          </div>
        </div>

        {/* Client & Artisan Summary Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#111827'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700 }}>
              CLIENT REFERENCE
            </span>
            <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{order.clientName}</div>
            <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>{order.clientPhone}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700 }}>
              ASSIGNED WORKSHOP ARTISAN / CARPENTER
            </span>
            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1f2937' }}>
              {order.assignedTo || 'Lead Carpenter (Workshop)'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
              Production Phase:{' '}
              <strong style={{ textTransform: 'uppercase' }}>{order.status}</strong>
            </div>
          </div>
        </div>

        {/* Product Reference Image if attached */}
        {order.imageUrl && (
          <div
            style={{
              marginBottom: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#f9fafb',
              padding: '12px 16px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                width: '150px',
                height: '130px',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid #d1d5db',
                background: '#fff',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={order.imageUrl}
                alt="Product Reference Photo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700 }}>
                APPROVED PRODUCT REFERENCE PHOTO / DESIGN SKETCH
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', margin: '3px 0' }}>
                {order.itemName}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: 0 }}>
                Carpenters & upholsterers must cross-reference this photograph for joinery details, curves, and proportioning.
              </p>
            </div>
          </div>
        )}

        {/* Specifications & Cutting Sheet */}
        <div style={{ marginBottom: '20px' }}>
          <h4
            style={{
              fontSize: '0.88rem',
              textTransform: 'uppercase',
              color: '#374151',
              letterSpacing: '0.05em',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '6px',
              marginBottom: '12px'
            }}
          >
            FURNITURE ITEM & MATERIAL SPECIFICATIONS
          </h4>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.86rem',
              color: '#111827'
            }}
          >
            <tbody>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px', fontWeight: 600, width: '30%', background: '#f3f4f6' }}>
                  Furniture Piece Name
                </td>
                <td style={{ padding: '8px', fontWeight: 700, fontSize: '1rem' }}>
                  {order.itemName} (Qty: {order.quantity || 1})
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px', fontWeight: 600, background: '#f3f4f6' }}>
                  Timber / Wood Species
                </td>
                <td style={{ padding: '8px', color: '#854d0e', fontWeight: 600 }}>
                  {order.woodType || 'Hardwood / Timber'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px', fontWeight: 600, background: '#f3f4f6' }}>
                  Exact Dimensions (L × W × H)
                </td>
                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {order.dimensions || 'See workshop sketches'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px', fontWeight: 600, background: '#f3f4f6' }}>
                  Fabric / Leather & Color Code
                </td>
                <td style={{ padding: '8px' }}>
                  {order.fabric || 'Natural wood finish (No upholstery)'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px', fontWeight: 600, background: '#f3f4f6' }}>
                  Wood Stain / Finish / Hardware
                </td>
                <td style={{ padding: '8px' }}>
                  {order.finishType || 'Clear Matte Polyurethane / Brass Hinges'}
                </td>
              </tr>
              {order.notes && (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px', fontWeight: 600, background: '#f3f4f6' }}>
                    Artisan Instructions / Notes
                  </td>
                  <td style={{ padding: '8px', whiteSpace: 'pre-line', color: '#374151' }}>
                    {order.notes}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Workshop Quality Checklist */}
        <div
          style={{
            marginTop: '28px',
            border: '1px dashed #9ca3af',
            borderRadius: '6px',
            padding: '16px',
            color: '#111827'
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '8px' }}>
            WORKSHOP STAGE SIGN-OFF CHECKLIST
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              fontSize: '0.78rem'
            }}
          >
            <div style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>
              <div>[ ] 1. Timber Cutting</div>
              <div style={{ marginTop: '14px', borderTop: '1px solid #d1d5db', fontSize: '0.7rem' }}>
                Artisan Sign
              </div>
            </div>
            <div style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>
              <div>[ ] 2. Joinery & Framing</div>
              <div style={{ marginTop: '14px', borderTop: '1px solid #d1d5db', fontSize: '0.7rem' }}>
                Artisan Sign
              </div>
            </div>
            <div style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>
              <div>[ ] 3. Sanding & Stain</div>
              <div style={{ marginTop: '14px', borderTop: '1px solid #d1d5db', fontSize: '0.7rem' }}>
                Artisan Sign
              </div>
            </div>
            <div style={{ border: '1px solid #e5e7eb', padding: '8px', textAlign: 'center' }}>
              <div>[ ] 4. Final QC & Polish</div>
              <div style={{ marginTop: '14px', borderTop: '1px solid #d1d5db', fontSize: '0.7rem' }}>
                Manager Sign
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
