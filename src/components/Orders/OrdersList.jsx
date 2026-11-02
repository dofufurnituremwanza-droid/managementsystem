import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../Common/EmptyState';
import confetti from 'canvas-confetti';
import {
  Armchair,
  Search,
  Plus,
  Printer,
  Edit2,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  Check,
  AlertCircle,
  Receipt,
  RotateCcw,
  User,
  Calendar,
  X
} from 'lucide-react';

export const OrdersList = () => {
  const { orders, staff, setModalConfig, removeItem, editItem, formatMoney, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const todayStr = new Date().toLocaleDateString('en-CA');
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA');

  // Collect all unique recorders from orders as well as registered staff
  const staffOptions = Array.from(
    new Set([
      'DOFU Management',
      ...(staff || []).map((s) => s.name || s.username).filter(Boolean),
      ...orders.map((o) => o.recordedBy).filter(Boolean)
    ])
  );

  const filtered = orders.filter((o) => {
    const matchSearch =
      (o.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.woodType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.recordedBy || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || o.status === statusFilter;

    const orderRecorder = o.recordedBy || 'DOFU Management';
    const matchStaff = staffFilter === 'all' || orderRecorder.toLowerCase() === staffFilter.toLowerCase();

    const orderDateOnly = o.recordedDate || o.orderDate || (o.createdAt ? o.createdAt.split('T')[0] : '');
    let matchDate = true;
    if (dateFilter === 'today') {
      matchDate = orderDateOnly === todayStr;
    } else if (dateFilter === 'yesterday') {
      matchDate = orderDateOnly === yesterdayStr;
    } else if (dateFilter === 'custom' && customDate) {
      matchDate = orderDateOnly === customDate;
    }

    return matchSearch && matchStatus && matchStaff && matchDate;
  });

  const handleQuickStatusChange = async (id, newStatus) => {
    await editItem('orders', id, { status: newStatus });
  };

  const handleMarkPaidInFull = async (order) => {
    const total = Number(order.totalPrice) || 0;
    const currentPaid = Number(order.depositPaid) || 0;
    const remaining = Math.max(0, total - currentPaid);

    const confirmed = window.confirm(
      `Confirm Final Payment on Delivery for Order ${order.orderNumber}?\n\n` +
      `Client: ${order.clientName}\n` +
      `Item: ${order.itemName || order.category || 'Custom Furniture'}\n` +
      `Remaining Balance: ${formatMoney(remaining)}\n\n` +
      `Click OK to mark as PAID IN FULL and set status to Delivered & Installed.`
    );
    if (!confirmed) return;

    await editItem('orders', order.id, {
      previousDeposit: currentPaid,
      previousStatus: order.status || 'ready',
      depositPaid: total,
      isPaidInFull: true,
      status: 'delivered'
    });

    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    showToast(`Order ${order.orderNumber} marked as PAID IN FULL on delivery!`, 'success');
  };

  const handleUnmarkPaidInFull = async (order) => {
    const defaultRevert = order.previousDeposit !== undefined ? order.previousDeposit : 0;
    const promptInput = window.prompt(
      `Unmark finished payment for Order ${order.orderNumber}?\n\n` +
      `Enter previous advance deposit amount to restore (or keep ${defaultRevert}):`,
      String(defaultRevert)
    );
    if (promptInput === null) return;

    const restoredDeposit = Math.max(0, Number(promptInput) || 0);

    await editItem('orders', order.id, {
      depositPaid: restoredDeposit,
      isPaidInFull: false,
      status: order.previousStatus || 'ready'
    });

    showToast(`Order ${order.orderNumber} unmarked. Reverted to partial payment (${formatMoney(restoredDeposit)}).`, 'warning');
  };

  const handleDelete = (id, num) => {
    if (window.confirm(`Are you sure you want to delete order "${num}"?`)) {
      removeItem('orders', id);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Order #, Item Name, Client, Wood..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Production Stages</option>
            <option value="draft">Order Placed / Draft</option>
            <option value="carpentry">Carpentry & Cutting</option>
            <option value="upholstery">Upholstery & Finishing</option>
            <option value="quality_check">Quality Check (QC)</option>
            <option value="ready">Ready for Dispatch</option>
            <option value="delivered">Delivered & Completed</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            title="Filter by who recorded the order"
          >
            <option value="all">👤 All Staff / Recorders</option>
            {staffOptions.map((st) => (
              <option key={st} value={st}>
                👤 {st}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            title="Filter orders by date recorded"
          >
            <option value="all">📅 All Dates</option>
            <option value="today">📅 Recorded Today</option>
            <option value="yesterday">📅 Recorded Yesterday</option>
            <option value="custom">📅 Specific Date...</option>
          </select>

          {dateFilter === 'custom' && (
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '6px 10px' }}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
            />
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setModalConfig({ type: 'new_order' })}
        >
          <Plus size={16} />
          <span>Take Custom Order</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="No Custom Orders in Production"
          description="Take bespoke custom orders from your customers. Attach reference photos, record exact dimensions, timber species, fabric choice, and track production until delivery."
          actionLabel="Take First Customer Order"
          onAction={() => setModalConfig({ type: 'new_order' })}
        />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No orders matched your search criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="luxury-table">
            <thead>
              <tr>
                <th>Order # & Item Details</th>
                <th>Client</th>
                <th>Recorded By & Date</th>
                <th>Category & Color</th>
                <th>Production Stage</th>
                <th>Pricing & Advance</th>
                <th>Target Delivery</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const balance = (Number(order.totalPrice) || 0) - (Number(order.depositPaid) || 0);

                return (
                  <tr key={order.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {order.imageUrl ? (
                          <div
                            onClick={() => setPreviewImage({ url: order.imageUrl, title: order.itemName })}
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              border: '1px solid var(--border-gold-card)',
                              cursor: 'pointer',
                              background: '#090b0e'
                            }}
                            title="Click to zoom product photo"
                          >
                            <img
                              src={order.imageUrl}
                              alt={order.itemName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : null}

                        <div>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.78rem',
                              color: 'var(--gold-light)',
                              fontWeight: 600
                            }}
                          >
                            {order.orderNumber}
                          </div>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                            {order.itemName} {order.quantity > 1 ? `(×${order.quantity})` : ''}
                          </div>
                          {order.dimensions && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              📐 {order.dimensions}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{order.clientName}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {order.clientPhone || 'No phone'}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div
                          className={`staff-badge ${
                            order.recordedByRole === 'assistant' ? 'staff-badge-assistant' : 'staff-badge-owner'
                          }`}
                          title={`Recorded by: ${order.recordedBy || 'DOFU Management'} (${order.recordedByRole || 'owner'})`}
                        >
                          <User size={12} />
                          <span>{order.recordedBy || 'DOFU Management'}</span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.73rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Calendar size={11} color="var(--gold-primary)" />
                          <span>
                            {(order.recordedDate || order.orderDate) === todayStr
                              ? 'Today'
                              : (order.recordedDate || order.orderDate || 'Earlier')}
                            {order.recordedTime ? ` • ${order.recordedTime}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ color: 'var(--gold-light)', fontSize: '0.84rem', fontWeight: 600 }}>
                        🏷️ {order.category || 'Custom Furniture'}
                      </div>
                      {(order.color || order.fabric) ? (
                        <div style={{ fontSize: '0.74rem', color: '#93c5fd', marginTop: '2px' }}>
                          🎨 {order.color || order.fabric}
                        </div>
                      ) : null}
                    </td>

                    <td>
                      <select
                        className={`badge badge-${order.status}`}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          padding: '4px 8px',
                          fontFamily: 'inherit'
                        }}
                        value={order.status}
                        onChange={(e) => handleQuickStatusChange(order.id, e.target.value)}
                      >
                        <option value="draft">Draft</option>
                        <option value="carpentry">Carpentry</option>
                        <option value="upholstery">Upholstery</option>
                        <option value="quality_check">QC Inspection</option>
                        <option value="ready">Ready for Dispatch</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {order.assignedTo && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          👤 {order.assignedTo}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>
                          {formatMoney(order.totalPrice)}
                        </div>

                        {balance <= 0 && Number(order.totalPrice) > 0 ? (
                          <>
                            <div className="payment-tick-badge paid-full">
                              <CheckCircle2 size={13} />
                              <span>PAID IN FULL ✓</span>
                            </div>
                            <button
                              type="button"
                              className="btn-unmark-settle"
                              title="Customer hasn't finished paying or marked in error? Click to unmark and revert to partial payment"
                              onClick={() => handleUnmarkPaidInFull(order)}
                            >
                              <RotateCcw size={11} />
                              <span>Unmark Paid Full</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600 }}>
                              Advance: {formatMoney(order.depositPaid || 0)}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 700 }}>
                              Balance: {formatMoney(balance)}
                            </div>
                            <button
                              type="button"
                              className="btn-tick-settle"
                              title="Customer finished remaining balance upon delivery? Click to mark Paid in Full"
                              onClick={() => handleMarkPaidInFull(order)}
                            >
                              <span className="tick-box">
                                <Check size={12} strokeWidth={3} />
                              </span>
                              <span>Mark Finished Paying ✓</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.82rem',
                          color: (order.targetDeliveryDate || order.dueDate) ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        <Clock size={13} color="var(--gold-primary)" />
                        <span>{order.targetDeliveryDate || order.dueDate || 'Open'}</span>
                      </div>
                      {order.orderDate && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          📅 {order.orderDate}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn-outline-gold btn-sm"
                          title="Download PDF Order & Payment Receipt"
                          onClick={() => setModalConfig({ type: 'order_receipt', data: order })}
                        >
                          <Receipt size={13} />
                          <span className="no-print">PDF Receipt</span>
                        </button>

                        <button
                          className="btn-secondary btn-sm"
                          title="Print or Export Workshop Job Card PDF"
                          onClick={() => setModalConfig({ type: 'print_job_card', data: order })}
                        >
                          <Printer size={13} />
                          <span className="no-print">Job Card</span>
                        </button>

                        <button
                          className="btn-secondary btn-sm"
                          title="Create Invoice from this Order"
                          onClick={() =>
                            setModalConfig({
                              type: 'new_invoice',
                              data: {
                                clientId: order.clientId,
                                clientName: order.clientName,
                                clientPhone: order.clientPhone,
                                items: [
                                  {
                                    description: `${order.itemName} (${order.woodType}, ${order.dimensions || ''})`,
                                    quantity: order.quantity || 1,
                                    unitPrice: order.unitPrice || order.totalPrice,
                                    imageUrl: order.imageUrl || ''
                                  }
                                ],
                                depositPaid: order.depositPaid || 0
                              }
                            })
                          }
                        >
                          <FileText size={13} />
                        </button>

                        <button
                          className="btn-secondary btn-sm"
                          title="Edit Order"
                          onClick={() => setModalConfig({ type: 'edit_order', data: order })}
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          className="btn-danger btn-sm"
                          title="Delete Order"
                          onClick={() => handleDelete(order.id, order.orderNumber)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid var(--border-gold-card)',
              background: '#090b0e',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(15, 18, 24, 0.95)'
              }}
            >
              <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.94rem' }}>
                {previewImage.title || 'Product Reference'}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewImage(null)}
                style={{ padding: '6px' }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '75vh',
                overflow: 'auto'
              }}
            >
              <img
                src={previewImage.url}
                alt={previewImage.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
