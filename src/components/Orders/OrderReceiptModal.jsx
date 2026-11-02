import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { Printer, Download, CheckCircle2, Check, ShieldCheck, Sparkles, Phone, MapPin, Mail, RotateCcw, FileText, MessageCircle, MessageSquare } from 'lucide-react';
import { downloadReceiptPdf } from '../../utils/receiptDownloader';
import { shareOrderReceiptPdfViaWhatsApp, shareOrderReceiptViaWhatsApp } from '../../utils/whatsappShare';
import confetti from 'canvas-confetti';

export const OrderReceiptModal = () => {
  const { modalConfig, setModalConfig, invoices, settings, formatMoney, editItem, showToast } = useApp();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);

  const isOpen = modalConfig.type === 'order_receipt' && Boolean(modalConfig.data);
  const order = isOpen ? modalConfig.data : null;

  const linkedInvoice = isOpen && order
    ? invoices?.find(
        (inv) =>
          (order.id && inv.orderId === order.id) ||
          (order.orderNumber && inv.orderNumber === order.orderNumber) ||
          (order.invoiceId && inv.id === order.invoiceId)
      )
    : null;

  const orderQty = Math.max(1, Number(order?.quantity) || 1);
  let resolvedTotal = Number(order?.totalPrice) || Number(order?.price) || 0;
  let resolvedUnit = Number(order?.unitPrice) || 0;

  if (resolvedUnit > 0 && resolvedTotal === 0) {
    resolvedTotal = resolvedUnit * orderQty;
  } else if (resolvedTotal > 0 && resolvedUnit === 0) {
    resolvedUnit = Math.round(resolvedTotal / orderQty);
  }

  // Also check linkedInvoice if order values are 0
  if (resolvedTotal === 0 && linkedInvoice) {
    const invTotal = Number(linkedInvoice.totalAmount) || Number(linkedInvoice.subtotal) || 0;
    if (invTotal > 0) {
      resolvedTotal = invTotal;
      resolvedUnit = Math.round(invTotal / orderQty);
    }
  }

  const totalPrice = resolvedTotal;
  const depositPaid = Number(order?.depositPaid) || 0;
  const balance = Math.max(0, totalPrice - depositPaid);
  const isFullyPaid = balance <= 0 && totalPrice > 0;

  // Auto-heal any order in Firestore that was missing unitPrice or totalPrice
  React.useEffect(() => {
    if (isOpen && order?.id && (Number(order.totalPrice) <= 0 || !order.unitPrice) && resolvedTotal > 0) {
      editItem('orders', order.id, {
        totalPrice: resolvedTotal,
        unitPrice: resolvedUnit
      });
    }
  }, [isOpen, order?.id, resolvedTotal]);

  // Safe early exit AFTER all hooks have executed
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const filename = `DOFU_Receipt_${order.orderNumber}_${(order.clientName || 'Client').replace(/\s+/g, '_')}`;
      await downloadReceiptPdf(filename, 'printable-order-receipt');
      showToast('PDF Receipt generated and downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate PDF, opening print window.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSharePdfToWhatsApp = async () => {
    setIsSharingPdf(true);
    try {
      await shareOrderReceiptPdfViaWhatsApp(order, 'printable-order-receipt', showToast);
    } catch (err) {
      console.error(err);
      showToast('Failed to share PDF: ' + err.message, 'error');
    } finally {
      setIsSharingPdf(false);
    }
  };

  const handleShareTextToWhatsApp = () => {
    const payloadToShare = {
      ...order,
      totalPrice: resolvedTotal,
      unitPrice: resolvedUnit,
      depositPaid: Number(order.depositPaid) || 0
    };
    shareOrderReceiptViaWhatsApp(payloadToShare, formatMoney);
  };

  const handleMarkPaidInFull = async () => {
    const remaining = Math.max(0, totalPrice - depositPaid);
    const confirmed = window.confirm(
      `Confirm Final Payment on Delivery for Order ${order.orderNumber}?\n\n` +
      `Client: ${order.clientName}\n` +
      `Remaining Balance: ${formatMoney(remaining)}\n\n` +
      `Click OK to mark as PAID IN FULL and update status to Delivered & Installed.`
    );
    if (!confirmed) return;

    setIsUpdating(true);
    try {
      const prevDeposit = order.depositPaid || 0;
      const prevStatus = order.status || 'ready';
      await editItem('orders', order.id, {
        depositPaid: totalPrice,
        status: 'delivered',
        previousDeposit: prevDeposit,
        previousStatus: prevStatus
      });

      // Synchronize linked invoice if present
      if (linkedInvoice) {
        await editItem('invoices', linkedInvoice.id, {
          amountPaid: totalPrice,
          status: 'paid'
        });
      }

      // Update in-modal data so the receipt updates in real-time
      setModalConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          depositPaid: totalPrice,
          status: 'delivered',
          previousDeposit: prevDeposit,
          previousStatus: prevStatus
        }
      }));

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch (e) {}

      showToast(`Order ${order.orderNumber} settled! Marked as PAID IN FULL on delivery.`, 'success');
    } catch (err) {
      showToast(`Error updating order: ${err.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnmarkPaidInFull = async () => {
    const restoredDeposit = (order.previousDeposit !== undefined && order.previousDeposit !== null)
      ? Number(order.previousDeposit)
      : 0;

    const confirmed = window.confirm(
      `Unmark Order ${order.orderNumber} as Paid in Full?\n\n` +
      `Client: ${order.clientName}\n` +
      `Current Total: ${formatMoney(totalPrice)}\n` +
      `Advance will be restored to: ${formatMoney(restoredDeposit)}\n` +
      `Status will return to: Ready for Delivery.\n\n` +
      `Do you want to proceed?`
    );
    if (!confirmed) return;

    setIsUpdating(true);
    try {
      const restoredStatus = order.previousStatus || 'ready';
      await editItem('orders', order.id, {
        depositPaid: restoredDeposit,
        status: restoredStatus
      });

      // Synchronize linked invoice if present
      if (linkedInvoice) {
        await editItem('invoices', linkedInvoice.id, {
          amountPaid: restoredDeposit,
          status: restoredDeposit >= totalPrice && totalPrice > 0 ? 'paid' : restoredDeposit > 0 ? 'partial' : 'unpaid'
        });
      }

      setModalConfig((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          depositPaid: restoredDeposit,
          status: restoredStatus
        }
      }));

      showToast(`Order ${order.orderNumber} payment settlement unmarked. Reverted to advance deposit.`, 'info');
    } catch (err) {
      showToast(`Error unmarking order: ${err.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={`Order & Payment Receipt (${order.orderNumber})`}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {!isFullyPaid ? (
              <button
                type="button"
                className="btn-tick-settle"
                onClick={handleMarkPaidInFull}
                disabled={isUpdating}
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                title="Mark this order as completely paid upon delivery"
              >
                <span className="tick-box" style={{ width: '18px', height: '18px' }}>
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>Mark Paid in Full on Delivery ✓</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-unmark-settle"
                onClick={handleUnmarkPaidInFull}
                disabled={isUpdating}
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                title="Revert settlement back to partial advance / outstanding balance"
              >
                <RotateCcw size={14} />
                <span>Unmark Paid in Full (Revert)</span>
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
              title="Share this official PDF receipt directly to customer via WhatsApp or WhatsApp Business"
            >
              <MessageCircle size={16} />
              <span>{isSharingPdf ? 'Preparing PDF...' : 'Share PDF to WhatsApp'}</span>
            </button>
            <button
              type="button"
              className="btn btn-whatsapp"
              style={{ background: 'linear-gradient(135deg, #128c7e, #075e54)' }}
              onClick={handleShareTextToWhatsApp}
              title="Send order and payment details directly to customer's WhatsApp or WhatsApp Business"
            >
              <MessageSquare size={16} />
              <span>Send WhatsApp Message</span>
            </button>
            {linkedInvoice && (
              <button
                className="btn btn-outline-gold"
                onClick={() => setModalConfig({ type: 'print_invoice', data: linkedInvoice })}
                title={`Open and print official commercial invoice #${linkedInvoice.invoiceNumber}`}
              >
                <FileText size={16} />
                <span>View Official Invoice ({linkedInvoice.invoiceNumber})</span>
              </button>
            )}
            <button
              className="btn btn-outline-gold"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              title="Export official document to PDF file only"
            >
              <Download size={16} />
              <span>{isDownloading ? 'Generating PDF...' : 'Download PDF Receipt'}</span>
            </button>
            <button className="btn btn-primary" onClick={handlePrint} title="Print Receipt">
              <Printer size={16} />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Auto-Prepared Commercial Invoice Banner */}
      {linkedInvoice && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.15) 0%, rgba(139, 90, 43, 0.12) 100%)',
            border: '1px solid rgba(197, 160, 89, 0.4)',
            borderRadius: '10px',
            padding: '10px 16px',
            marginBottom: '16px',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(197, 160, 89, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-light)'
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
              >
                <span>Official Commercial Invoice Auto-Prepared:</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--gold-light)',
                    background: 'rgba(197, 160, 89, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}
                >
                  #{linkedInvoice.invoiceNumber}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: '#059669',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600
                  }}
                >
                  Ready in Billing ✓
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Full commercial invoice was automatically generated from this order. No manual re-typing required.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-gold"
            onClick={() => setModalConfig({ type: 'print_invoice', data: linkedInvoice })}
            style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={14} />
            <span>Open & Print Invoice →</span>
          </button>
        </div>
      )}

      {/* Interactive Settlement Banner: Mark or Unmark Paid in Full */}
      {!isFullyPaid ? (
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
              Outstanding Balance: <strong>{formatMoney(balance)}</strong>. Click this banner to record full payment upon work delivery and stamp as PAID IN FULL.
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#059669',
                color: '#ffffff'
              }}
            >
              <Check size={15} strokeWidth={3} />
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#34d399', letterSpacing: '0.02em' }}>
                CUSTOMER HAS FULLY PAID ON DELIVERY ✓
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Marked as Paid in Full ({formatMoney(totalPrice)}). Click unmark if this was done by mistake.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-unmark-settle"
            onClick={handleUnmarkPaidInFull}
            disabled={isUpdating}
            style={{ padding: '6px 12px', fontSize: '0.76rem' }}
            title="Unmark paid in full and revert back to advance deposit"
          >
            <RotateCcw size={13} />
            <span>Unmark Paid in Full</span>
          </button>
        </div>
      )}

      {/* The Printable A4 Document Content */}
      <div
        className="print-document"
        id="printable-order-receipt"
        style={{
          background: '#ffffff',
          color: '#111827',
          padding: '28px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        {/* DOFU Brand Header */}
        <div className="print-header-layout">
          <div className="print-header-brand">
            <img
              src="/logo.png"
              alt="DOFU Logo"
              style={{ width: '60px', height: '60px', objectFit: 'contain' }}
            />
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.45rem',
                  color: '#111827',
                  margin: 0,
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                  lineHeight: 1.15
                }}
              >
                DOFU FURNITURE MWANZA
              </h1>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#854d0e',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: '3px 0'
                }}
              >
                Custom Bespoke Furniture & Luxury Interior Architecture
              </div>
              <div style={{ fontSize: '0.76rem', color: '#4b5563', lineHeight: 1.4 }}>
                <div>📍 <strong>LOCATION:</strong> BUGARIKA SOKON, BUGANDO, MWANZA</div>
                <div>📞 <strong>PHONE:</strong> +255769456793 | ✉️ <strong>EMAIL:</strong> dofufurnituremwanza@gmail.com</div>
              </div>
            </div>
          </div>

          {/* Document Type Badge & Official Stamp */}
          <div className="print-header-stamp">
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.15rem',
                fontWeight: 900,
                color: '#111827',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              OFFICIAL RECEIPT
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.94rem',
                fontWeight: 800,
                color: '#c5a059',
                marginTop: '2px'
              }}
            >
              #{order.orderNumber}
            </div>

            {/* Visual Stamp Watermark */}
            <div style={{ marginTop: '8px' }}>
              {isFullyPaid ? (
                <div className="receipt-official-stamp paid">
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em' }}>★ DOFU MWANZA ★</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, margin: '1px 0' }}>✓ PAID IN FULL</div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700 }}>SETTLED ON DELIVERY</div>
                </div>
              ) : (
                <div className="receipt-official-stamp partial">
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em' }}>★ DOFU MWANZA ★</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 900, margin: '1px 0' }}>PARTIAL DEPOSIT</div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700 }}>BALANCE DUE ON DELIVERY</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client & Production Metadata Card */}
        <div className="print-meta-grid">
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '0.04em' }}>
              CLIENT INFORMATION
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a', marginTop: '2px' }}>
              {order.clientName || 'Valued Customer'}
            </div>
            <div style={{ marginTop: '2px' }}>
              <strong>Phone:</strong> {order.clientPhone || 'Not provided'}
            </div>
            <div>
              <strong>Order Date:</strong> {order.orderDate || formattedDate}
            </div>
            <div style={{ marginTop: '2px' }}>
              <strong>Recorded By:</strong>{' '}
              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                {order.recordedBy || 'DOFU Management'}
              </span>{' '}
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                ({order.recordedByRole === 'assistant' ? 'Assistant' : 'Owner/Admin'})
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '0.04em' }}>
              WORKSHOP & DELIVERY SPECIFICATIONS
            </div>
            <div style={{ marginTop: '2px' }}>
              <strong>Target Delivery Date:</strong>{' '}
              <span style={{ fontWeight: 700, color: '#b45309' }}>
                {order.targetDeliveryDate || order.dueDate || 'Standard Bespoke Handcrafting'}
              </span>
            </div>
            <div>
              <strong>Lead Craftsman:</strong> {order.assignedTo || 'DOFU Workshop Master Carpenter'}
            </div>
            <div>
              <strong>Production Phase:</strong>{' '}
              <span style={{ textTransform: 'uppercase', fontWeight: 700, color: '#0f172a' }}>
                {order.status || 'Active Production'}
              </span>
            </div>
          </div>
        </div>

        {/* Ordered Custom Piece Specifications (ALL Entered Data Displayed Perfectly) */}
        <div style={{ marginBottom: '18px' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#475569',
              letterSpacing: '0.05em',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '4px',
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>BESPOKE FURNITURE SPECIFICATIONS</span>
            <span style={{ fontSize: '0.72rem', color: '#b45309' }}>100% Custom Made-to-Order</span>
          </div>

          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '12px 14px',
              background: '#ffffff',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}
          >
            {/* Attached Reference Photo */}
            {order.imageUrl && (
              <div
                style={{
                  width: '110px',
                  height: '100px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
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
            )}

            {/* Spec Details Grid */}
            <div style={{ flex: 1, fontSize: '0.82rem', color: '#1e293b' }}>
              <div style={{ fontWeight: 800, fontSize: '1.02rem', color: '#0f172a', marginBottom: '4px' }}>
                {order.itemName} {order.quantity > 1 ? `(Qty: ${order.quantity})` : ''}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 14px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>🏷️ Category:</span>{' '}
                  <strong>{order.category || 'Custom Furniture'}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b' }}>💰 Product Price:</span>{' '}
                  <strong style={{ color: '#047857', fontFamily: 'var(--font-mono)' }}>
                    {formatMoney(resolvedUnit)} {orderQty > 1 ? `(x${orderQty})` : ''}
                  </strong>
                </div>

                {(order.color || order.fabric) && (
                  <div>
                    <span style={{ color: '#64748b' }}>🎨 Color:</span>{' '}
                    <strong>{order.color || order.fabric}</strong>
                  </div>
                )}

                {order.dimensions && (
                  <div>
                    <span style={{ color: '#64748b' }}>📐 Dimensions:</span>{' '}
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{order.dimensions}</strong>
                  </div>
                )}

                {order.woodType && (
                  <div>
                    <span style={{ color: '#64748b' }}>🪵 Timber Species:</span>{' '}
                    <strong style={{ color: '#854d0e' }}>{order.woodType}</strong>
                  </div>
                )}

                {order.finishType && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b' }}>✨ Finish:</span>{' '}
                    <strong>{order.finishType}</strong>
                  </div>
                )}

                {order.notes && (
                  <div
                    style={{
                      gridColumn: 'span 2',
                      marginTop: '4px',
                      padding: '6px 10px',
                      background: '#f8fafc',
                      borderRadius: '4px',
                      borderLeft: '3px solid #c5a059'
                    }}
                  >
                    <span style={{ color: '#64748b', fontWeight: 700 }}>Custom Carving / Notes:</span>{' '}
                    <span style={{ color: '#334155' }}>{order.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Financial & Settlement Breakdown */}
        <div
          style={{
            borderTop: '2px solid #0f172a',
            paddingTop: '12px',
            marginBottom: '18px',
            fontSize: '0.86rem',
            color: '#0f172a'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#475569' }}>Agreed Total Order Value:</span>
            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{formatMoney(totalPrice)}</strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: '#ecfdf5',
              borderRadius: '6px',
              margin: '6px 0',
              fontWeight: 800,
              fontSize: '0.98rem',
              color: '#059669'
            }}
          >
            <span>ADVANCE PAID / DEPOSIT:</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{formatMoney(depositPaid)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: balance <= 0 ? '#ecfdf5' : '#fef2f2',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '1rem',
              color: balance <= 0 ? '#047857' : '#b91c1c'
            }}
          >
            <span>{balance <= 0 ? 'PAYMENT STATUS:' : 'BALANCE REMAINING ON DELIVERY:'}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {balance <= 0 ? '✓ PAID IN FULL (0 TZS)' : formatMoney(balance)}
            </span>
          </div>
        </div>

        {/* Dual Signature Blocks (Customer & DOFU) */}
        <div className="print-signature-grid">
          <div>
            <div style={{ height: '36px' }} />
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>
              <strong>Client Acceptance & Handover Signature:</strong>
              <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>
                Date Received: ____________________
              </div>
            </div>
          </div>

          <div>
            <div style={{ height: '36px' }} />
            <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>
              <strong>DOFU Furniture Mwanza Authorized Signature:</strong>
              <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>
                Issued by: {order.recordedBy || 'DOFU Management'} • {order.recordedDate || order.orderDate || formattedDate}
              </div>
            </div>
          </div>
        </div>

        {/* Official Workshop Footer */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.74rem',
            color: '#64748b',
            borderTop: '1px solid #e2e8f0',
            marginTop: '18px',
            paddingTop: '10px',
            lineHeight: 1.45
          }}
        >
          <div style={{ fontWeight: 700, color: '#0f172a' }}>
            Thank you for choosing DOFU FURNITURE MWANZA for your custom furniture.
          </div>
          <div>All pieces are bespoke crafted at our Bugarika Sokon, Bugando workshop in Mwanza.</div>
        </div>
      </div>
    </Modal>
  );
};
