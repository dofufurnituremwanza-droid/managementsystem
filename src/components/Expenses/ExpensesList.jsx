import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../Common/EmptyState';
import {
  Receipt,
  Search,
  Plus,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  TrendingDown
} from 'lucide-react';

export const ExpensesList = () => {
  const { expenses, setModalConfig, removeItem, formatMoney } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = expenses.filter((exp) => {
    const matchSearch =
      (exp.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.paidTo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.receiptRef || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalExpenseAmount = expenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete expense record "${title}"?`)) {
      removeItem('expenses', id);
    }
  };

  return (
    <div>
      {/* Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Workshop Expenses</div>
            <div className="stat-value" style={{ color: '#f87171' }}>
              {formatMoney(totalExpenseAmount)}
            </div>
            <div className="stat-note">Timber, wages, logistics & overheads</div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <TrendingDown size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Expense Entries Recorded</div>
            <div className="stat-value">{expenses.length}</div>
            <div className="stat-note">Digital receipts & vouchers</div>
          </div>
          <div className="stat-icon-wrap">
            <Receipt size={22} />
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
              placeholder="Search expenses by title, payee, receipt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Expense Categories</option>
            <option value="Timber & Raw Materials">Timber & Raw Materials</option>
            <option value="Fabrics & Upholstery">Fabrics & Foam</option>
            <option value="Artisan & Carpenter Wages">Artisan & Carpenter Wages</option>
            <option value="Transport & Delivery">Transport & Logistics</option>
            <option value="Workshop Rent & Utilities">Workshop Rent & Power</option>
            <option value="Tools & Machine Maintenance">Machinery & Tools</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setModalConfig({ type: 'new_expense' })}
        >
          <Plus size={16} />
          <span>Record Expense</span>
        </button>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Workshop Expenses Logged"
          description="Keep every timber delivery, artisan daily wage, saw blade replacement, and transport cost logged to understand your true profit margin."
          actionLabel="Record First Expense"
          onAction={() => setModalConfig({ type: 'new_expense' })}
        />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No expenses match your search query.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="luxury-table">
            <thead>
              <tr>
                <th>Expense Description</th>
                <th>Category</th>
                <th>Date Paid</th>
                <th>Paid To / Payee</th>
                <th>Payment Mode</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr key={exp.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                      {exp.title}
                    </div>
                    {exp.receiptRef && (
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.74rem',
                          color: 'var(--gold-light)'
                        }}
                      >
                        Ref: {exp.receiptRef}
                      </div>
                    )}
                    {exp.notes && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {exp.notes}
                      </div>
                    )}
                  </td>

                  <td>
                    <span className="badge badge-draft">{exp.category}</span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
                      <Calendar size={13} color="var(--gold-primary)" />
                      <span>{exp.date}</span>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.86rem', color: '#fff' }}>
                      {exp.paidTo || 'Direct Cash'}
                    </div>
                  </td>

                  <td>
                    <span
                      className="badge"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                    >
                      {exp.paymentMethod || 'Cash'}
                    </span>
                  </td>

                  <td>
                    <div style={{ fontWeight: 700, color: '#fca5a5', fontSize: '0.94rem' }}>
                      {formatMoney(exp.amount)}
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        className="btn-secondary btn-sm"
                        title="Edit Expense"
                        onClick={() => setModalConfig({ type: 'edit_expense', data: exp })}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn-danger btn-sm"
                        title="Delete Expense"
                        onClick={() => handleDelete(exp.id, exp.title)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
