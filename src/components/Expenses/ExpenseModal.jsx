import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';

export const ExpenseModal = () => {
  const { modalConfig, setModalConfig, addItem, editItem } = useApp();
  const isEditing = Boolean(modalConfig.data?.id);
  const existing = modalConfig.data || {};

  const [formData, setFormData] = useState({
    title: '',
    category: 'Timber & Raw Materials',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paidTo: '',
    paymentMethod: 'Cash',
    receiptRef: '',
    notes: ''
  });

  useEffect(() => {
    if (modalConfig.data) {
      setFormData({
        title: existing.title || '',
        category: existing.category || 'Timber & Raw Materials',
        amount: existing.amount || '',
        date: existing.date || new Date().toISOString().split('T')[0],
        paidTo: existing.paidTo || '',
        paymentMethod: existing.paymentMethod || 'Cash',
        receiptRef: existing.receiptRef || '',
        notes: existing.notes || ''
      });
    } else {
      setFormData({
        title: '',
        category: 'Timber & Raw Materials',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paidTo: '',
        paymentMethod: 'Cash',
        receiptRef: '',
        notes: ''
      });
    }
  }, [modalConfig]);

  if (modalConfig.type !== 'new_expense' && modalConfig.type !== 'edit_expense') {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(formData.amount) || 0;
    if (!formData.title.trim() || !amt) return;

    const payload = {
      ...formData,
      amount: amt
    };

    if (isEditing) {
      await editItem('expenses', existing.id, payload);
    } else {
      await addItem('expenses', payload);
    }
    setModalConfig({ type: null });
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={isEditing ? 'Edit Workshop Expense' : 'Record Workshop / Operational Expense'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group form-full">
          <label>Expense Title / Description *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Mvule Timber Logs purchase or Carpenter artisan daily wages"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            className="form-select"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="Timber & Raw Materials">Timber & Raw Materials</option>
            <option value="Fabrics & Upholstery">Fabrics & Foam Upholstery</option>
            <option value="Artisan & Carpenter Wages">Artisan & Carpenter Labor Wages</option>
            <option value="Transport & Delivery">Transport & Vehicle Delivery</option>
            <option value="Workshop Rent & Utilities">Workshop Rent & Utilities (Power/Fuel)</option>
            <option value="Tools & Machine Maintenance">Tools & Machinery Maintenance</option>
            <option value="Office & Client Hospitality">Office, Site Visits & Hospitality</option>
          </select>
        </div>

        <div className="form-group">
          <label>Expense Amount *</label>
          <input
            type="number"
            min="0"
            required
            className="form-input"
            placeholder="0"
            value={formData.amount ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const clean = e.target.value === '' ? '' : e.target.value.replace(/^0+(?=\d)/, '');
              setFormData({ ...formData, amount: clean });
            }}
          />
        </div>

        <div className="form-group">
          <label>Date Paid</label>
          <input
            type="date"
            className="form-input"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Paid To (Vendor / Artisan)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Mwenge Sawmill or Driver Juma"
            value={formData.paidTo}
            onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <select
            className="form-select"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          >
            <option value="Cash">Cash (Petty Cash)</option>
            <option value="M-Pesa / TigoPesa">Mobile Money (M-Pesa / TigoPesa)</option>
            <option value="Bank Transfer">Bank Transfer (CRDB/NMB)</option>
            <option value="Card">Card</option>
          </select>
        </div>

        <div className="form-group">
          <label>Physical Receipt / Voucher #</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. REC-9921"
            value={formData.receiptRef}
            onChange={(e) => setFormData({ ...formData, receiptRef: e.target.value })}
          />
        </div>

        <div className="form-group form-full">
          <label>Notes / Purpose</label>
          <textarea
            className="form-textarea"
            placeholder="e.g. 5 planks of seasoned Teak for the Masaki Penthouse dining table project"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div
          className="form-full modal-form-actions"
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setModalConfig({ type: null })}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {isEditing ? 'Save Changes' : 'Record Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
