import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../Common/EmptyState';
import confetti from 'canvas-confetti';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Edit2,
  Trash2,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Check,
  MessageCircle
} from 'lucide-react';
import { shareInvoiceViaWhatsApp } from '../../utils/whatsappShare';

export const InvoicesList = () => {
  const { invoices, orders, setModalConfig, removeItem, editItem, formatMoney, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      (inv.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.items || []).some((item) =>
        (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchType = typeFilter === 'all' || inv.type === typeFilter;
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  // Calculate Metrics
  const totalInvoiced = invoices
    .filter((i) => i.type !== 'quotation')
    .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

  const totalCollected = invoices
    .filter((i) => i.type !== 'quotation')
    .reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0);

  const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);

  const handleDelete = (id, num) => {
    if (window.confirm(`Are you sure you want to delete "${num}"?`)) {
      removeItem('invoices', id);
    }
  };

  const handleMarkInvoicePaidInFull = async (invoice) => {
    const total = Number(invoice.totalAmount) || 0;
    const balance = Math.max(0, total - (Number(invoice.amountPaid) || 0));

    const confirmed = window.confirm(
      `Confirm Final Payment on Delivery for Invoice ${invoice.invoiceNumber}?\n\n` +
      `Client: ${invoice.clientName}\n` +
      `Remaining Balance to Settle: ${formatMoney(balance)}\n\n` +
      `Click OK to mark as PAID IN FULL.`
    );
    if (!confirmed) return;

    await editItem('invoices', invoice.id, {
      amountPaid: total,
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
          depositPaid: total,
          isPaidInFull: true,
          status: 'delivered'
        });
      }
    }

    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    showToast(`Invoice ${invoice.invoiceNumber} marked as PAID IN FULL on delivery!`, 'success');
  };

  const handleRecordQuickPayment = async (invoice) => {
    const balance = (Number(invoice.totalAmount) || 0) - (Number(invoice.amountPaid) || 0);
    const amountStr = window.prompt(
      `Enter payment amount received for ${invoice.invoiceNumber}:\n(Remaining Balance: ${formatMoney(balance)})`,
      balance.toString()
    );
    if (!amountStr) return;

    const added = Number(amountStr) || 0;
    if (added <= 0) return;

    const newPaid = (Number(invoice.amountPaid) || 0) + added;
    const isNowPaid = newPaid >= (Number(invoice.totalAmount) || 0);

    await editItem('invoices', invoice.id, {
      amountPaid: newPaid,
      status: isNowPaid ? 'paid' : 'partial'
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
          depositPaid: newPaid,
          isPaidInFull: isNowPaid,
          status: isNowPaid ? 'delivered' : linkedOrder.status
        });
      }
    }

    if (isNowPaid) {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    }
  };

  return (
    <div>
      {/* Top Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Invoiced</div>
            <div className="stat-value">{formatMoney(totalInvoiced)}</div>
            <div className="stat-note">Excludes draft proformas</div>
          </div>
          <div className="stat-icon-wrap">
            <FileText size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Payments Collected</div>
            <div className="stat-value" style={{ color: '#10b981' }}>
              {formatMoney(totalCollected)}
            </div>
            <div className="stat-note">Deposits & cleared balances</div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <DollarSign size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Outstanding Balances</div>
            <div className="stat-value" style={{ color: totalOutstanding > 0 ? '#f59e0b' : '#fff' }}>
              {formatMoney(totalOutstanding)}
            </div>
            <div className="stat-note">Receivables due from clients</div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <CreditCard size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Invoice #, Client Name, Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Document Types</option>
            <option value="invoice">Tax / Commercial Invoices</option>
            <option value="quotation">Proforma Quotations</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Payment Statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial Payment</option>
            <option value="paid">Fully Paid</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setModalConfig({ type: 'new_invoice' })}
        >
          <Plus size={16} />
          <span>New Quote / Invoice</span>
        </button>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Invoices or Quotations Yet"
          description="Never lose paper invoice booklets again. Issue branded proforma quotations, record customer deposits, and print tax receipts with one click."
          actionLabel="Create First Invoice"
          onAction={() => setModalConfig({ type: 'new_invoice' })}
        />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No documents match the filter criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="luxury-table">
            <thead>
              <tr>
                <th>Reference # & Type</th>
                <th>Client</th>
                <th>Date Issued</th>
                <th>Grand Total</th>
                <th>Amount Paid</th>
                <th>Balance Outstanding</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const balance = (Number(inv.totalAmount) || 0) - (Number(inv.amountPaid) || 0);

                return (
                  <tr key={inv.id}>
                    <td>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.82rem',
                          color: 'var(--gold-light)',
                          fontWeight: 700
                        }}
                      >
                        {inv.invoiceNumber}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.68rem',
                            background: inv.type === 'quotation' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(197, 160, 89, 0.15)',
                            color: inv.type === 'quotation' ? '#60a5fa' : '#e5c07b'
                          }}
                        >
                          {inv.type === 'quotation' ? 'Proforma Quote' : 'Invoice'}
                        </span>
                        {inv.orderNumber && (
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.68rem',
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.3)'
                            }}
                            title={`Generated automatically for Order #${inv.orderNumber}`}
                          >
                            Order #{inv.orderNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{inv.clientName}</div>
                      {inv.clientPhone && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          {inv.clientPhone}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        {inv.issueDate || 'Today'}
                      </div>
                      {inv.dueDate && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Due: {inv.dueDate}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.94rem' }}>
                        {formatMoney(inv.totalAmount)}
                      </div>
                    </td>

                    <td>
                      <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.86rem' }}>
                        {formatMoney(inv.amountPaid || 0)}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {balance <= 0 && Number(inv.totalAmount) > 0 ? (
                          <div className="payment-tick-badge paid-full">
                            <CheckCircle2 size={13} />
                            <span>PAID IN FULL ✓</span>
                          </div>
                        ) : (
                          <>
                            <div
                              style={{
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                color: '#f59e0b'
                              }}
                            >
                              {formatMoney(balance)}
                            </div>
                            <button
                              type="button"
                              className="btn-tick-settle"
                              title="Customer finished remaining balance upon delivery? Click to mark Paid in Full"
                              onClick={() => handleMarkInvoicePaidInFull(inv)}
                            >
                              <span className="tick-box">
                                <Check size={12} strokeWidth={3} />
                              </span>
                              <span>Mark Paid Full</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={`badge badge-${inv.status || 'unpaid'}`}>
                        {inv.status || 'unpaid'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn-outline-gold btn-sm"
                          title="Download PDF or Print Document"
                          onClick={() => setModalConfig({ type: 'print_invoice', data: inv })}
                        >
                          <Printer size={13} />
                          <span className="no-print">PDF / Print</span>
                        </button>

                        <button
                          className="btn-whatsapp btn-sm"
                          title={`Share ${inv.type === 'quotation' ? 'Quote' : 'Invoice'} PDF to Customer via WhatsApp (${inv.clientPhone || 'Client'})`}
                          onClick={() => setModalConfig({ type: 'print_invoice', data: inv })}
                        >
                          <MessageCircle size={13} />
                          <span className="no-print">WhatsApp PDF</span>
                        </button>

                        {balance > 0 && (
                          <button
                            className="btn-secondary btn-sm"
                            title="Record Payment"
                            onClick={() => handleRecordQuickPayment(inv)}
                          >
                            <DollarSign size={13} color="#10b981" />
                            <span className="no-print">Pay</span>
                          </button>
                        )}

                        <button
                          className="btn-secondary btn-sm"
                          title="Edit Document"
                          onClick={() => setModalConfig({ type: 'edit_invoice', data: inv })}
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          className="btn-danger btn-sm"
                          title="Delete Document"
                          onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
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
