import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../Common/EmptyState';
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
  AlertCircle
} from 'lucide-react';

export const OrdersList = () => {
  const { orders, setModalConfig, removeItem, editItem, formatMoney } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = orders.filter((o) => {
    const matchSearch =
      (o.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.woodType || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleQuickStatusChange = async (id, newStatus) => {
    await editItem('orders', id, { status: newStatus });
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
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setModalConfig({ type: 'new_order' })}
        >
          <Plus size={16} />
          <span>New Furniture Order</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={Armchair}
          title="No Furniture Orders in Production"
          description="Stop writing customer furniture specs in fragile paper notebooks. Record client dimensions, timber choice, fabric, and assigned carpenters here."
          actionLabel="Create First Order"
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
                <th>Timber & Specs</th>
                <th>Production Stage</th>
                <th>Pricing & Deposit</th>
                <th>Delivery Due</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const balance = (Number(order.totalPrice) || 0) - (Number(order.depositPaid) || 0);

                return (
                  <tr key={order.id}>
                    <td>
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
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{order.clientName}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {order.clientPhone || 'No phone'}
                      </div>
                    </td>

                    <td>
                      <div style={{ color: '#d4a373', fontSize: '0.84rem', fontWeight: 500 }}>
                        🪵 {order.woodType || 'Hardwood'}
                      </div>
                      {order.fabric && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          🧵 {order.fabric}
                        </div>
                      )}
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
                      <div style={{ fontWeight: 600, color: '#fff' }}>
                        {formatMoney(order.totalPrice)}
                      </div>
                      <div
                        style={{
                          fontSize: '0.74rem',
                          color: balance <= 0 ? '#10b981' : '#f59e0b'
                        }}
                      >
                        {balance <= 0 ? 'Fully Paid' : `Bal: ${formatMoney(balance)}`}
                      </div>
                    </td>

                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.82rem',
                          color: order.dueDate ? '#fff' : 'var(--text-muted)'
                        }}
                      >
                        <Clock size={13} color="var(--gold-primary)" />
                        <span>{order.dueDate || 'Open'}</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn-outline-gold btn-sm"
                          title="Print Workshop Job Card & Cutting Sheet"
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
                                    unitPrice: order.unitPrice || order.totalPrice
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
    </div>
  );
};
