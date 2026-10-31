import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { Plus, Trash2 } from 'lucide-react';

export const InvoiceModal = () => {
  const { modalConfig, setModalConfig, clients, addItem, editItem, settings } = useApp();
  const isEditing = Boolean(modalConfig.data?.id);
  const existing = modalConfig.data || {};

  const generateNumber = (type) =>
    `${type === 'quotation' ? 'QUO' : 'INV'}-${Math.floor(1000 + Math.random() * 9000)}`;

  const [formData, setFormData] = useState({
    type: 'invoice', // invoice, quotation
    invoiceNumber: generateNumber('invoice'),
    clientId: '',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    subtotal: 0,
    discount: 0,
    taxRate: settings.taxRate || 0,
    taxAmount: 0,
    totalAmount: 0,
    amountPaid: 0,
    paymentMethod: 'Bank Transfer',
    status: 'unpaid', // unpaid, partial, paid, overdue
    notes: ''
  });

  useEffect(() => {
    if (modalConfig.data) {
      const initialType = existing.type || 'invoice';
      const itemsList =
        existing.items && existing.items.length > 0
          ? existing.items
          : [{ description: '', quantity: 1, unitPrice: 0 }];

      setFormData({
        type: initialType,
        invoiceNumber: existing.invoiceNumber || generateNumber(initialType),
        clientId: existing.clientId || '',
        clientName: existing.clientName || '',
        clientPhone: existing.clientPhone || '',
        clientAddress: existing.clientAddress || '',
        issueDate: existing.issueDate || new Date().toISOString().split('T')[0],
        dueDate: existing.dueDate || '',
        items: itemsList,
        subtotal: existing.subtotal || 0,
        discount: existing.discount || 0,
        taxRate: existing.taxRate !== undefined ? existing.taxRate : settings.taxRate || 0,
        taxAmount: existing.taxAmount || 0,
        totalAmount: existing.totalAmount || 0,
        amountPaid: existing.amountPaid || 0,
        paymentMethod: existing.paymentMethod || 'Bank Transfer',
        status: existing.status || 'unpaid',
        notes: existing.notes || ''
      });
    } else {
      setFormData({
        type: 'invoice',
        invoiceNumber: generateNumber('invoice'),
        clientId: '',
        clientName: '',
        clientPhone: '',
        clientAddress: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
        subtotal: 0,
        discount: 0,
        taxRate: settings.taxRate || 0,
        taxAmount: 0,
        totalAmount: 0,
        amountPaid: 0,
        paymentMethod: 'Bank Transfer',
        status: 'unpaid',
        notes: ''
      });
    }
  }, [modalConfig]);

  if (modalConfig.type !== 'new_invoice' && modalConfig.type !== 'edit_invoice') {
    return null;
  }

  // Recalculate totals
  const recalculate = (items, discount = formData.discount, taxRate = formData.taxRate, paid = formData.amountPaid) => {
    const sub = items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0
    );
    const disc = Number(discount) || 0;
    const postDisc = Math.max(0, sub - disc);
    const tax = Math.round(postDisc * ((Number(taxRate) || 0) / 100));
    const grand = postDisc + tax;
    const amountPaid = Number(paid) || 0;

    let status = 'unpaid';
    if (amountPaid >= grand && grand > 0) {
      status = 'paid';
    } else if (amountPaid > 0) {
      status = 'partial';
    }

    setFormData((prev) => ({
      ...prev,
      items,
      subtotal: sub,
      discount: disc,
      taxRate: Number(taxRate) || 0,
      taxAmount: tax,
      totalAmount: grand,
      amountPaid,
      status
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    recalculate(updated);
  };

  const addItemRow = () => {
    const updated = [...formData.items, { description: '', quantity: 1, unitPrice: 0 }];
    recalculate(updated);
  };

  const removeItemRow = (index) => {
    if (formData.items.length <= 1) return;
    const updated = formData.items.filter((_, idx) => idx !== index);
    recalculate(updated);
  };

  const handleTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      invoiceNumber: generateNumber(newType)
    }));
  };

  const handleClientSelect = (clientId) => {
    const selected = clients.find((c) => c.id === clientId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        clientId: selected.id,
        clientName: selected.name,
        clientPhone: selected.phone,
        clientAddress: selected.address || ''
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        clientId: '',
        clientName: '',
        clientPhone: '',
        clientAddress: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim() || formData.items.length === 0) return;

    if (isEditing) {
      await editItem('invoices', existing.id, formData);
    } else {
      await addItem('invoices', formData);
    }
    setModalConfig({ type: null });
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={
        isEditing
          ? `Edit ${formData.type === 'quotation' ? 'Quotation' : 'Invoice'} (${formData.invoiceNumber})`
          : `Create New ${formData.type === 'quotation' ? 'Proforma Quotation' : 'Official Invoice'}`
      }
      size="xl"
    >
      <form onSubmit={handleSubmit} className="form-grid">
        {/* Document Type Selector */}
        <div className="form-group">
          <label>Document Category</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn btn-sm ${formData.type === 'invoice' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => handleTypeChange('invoice')}
            >
              Commercial Invoice
            </button>
            <button
              type="button"
              className={`btn btn-sm ${formData.type === 'quotation' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
              onClick={() => handleTypeChange('quotation')}
            >
              Proforma Quotation
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Document Reference #</label>
          <input
            type="text"
            required
            className="form-input"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Select Registered Client</label>
          <select
            className="form-select"
            value={formData.clientId}
            onChange={(e) => handleClientSelect(e.target.value)}
          >
            <option value="">-- Choose client or enter details below --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Client Full Name *</label>
          <input
            type="text"
            required
            className="form-input"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Client Phone Number</label>
          <input
            type="tel"
            className="form-input"
            value={formData.clientPhone}
            onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Delivery / Site Address</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Masaki, Plot 44"
            value={formData.clientAddress}
            onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Issue Date</label>
          <input
            type="date"
            className="form-input"
            value={formData.issueDate}
            onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Due Date</label>
          <input
            type="date"
            className="form-input"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>

        {/* Dynamic Line Items Section */}
        <div className="form-group form-full" style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ margin: 0 }}>Itemized Furniture & Interior Design Services *</label>
            <button type="button" className="btn btn-outline-gold btn-sm" onClick={addItemRow}>
              <Plus size={14} />
              Add Line Item
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {formData.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 90px 140px 120px 40px',
                  gap: '10px',
                  alignItems: 'center'
                }}
              >
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Description (e.g. 8-Seater Hardwood Dining Table, Teak Wood, 240x100cm)"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="Unit Price"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                />
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    textAlign: 'right',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: 'var(--gold-light)'
                  }}
                >
                  {((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString()}
                </div>
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  style={{ padding: '8px', borderRadius: '6px' }}
                  onClick={() => removeItemRow(idx)}
                  disabled={formData.items.length <= 1}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Adjustments */}
        <div className="form-group">
          <label>Discount Amount (Off Subtotal)</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={formData.discount}
            onChange={(e) => recalculate(formData.items, e.target.value, formData.taxRate, formData.amountPaid)}
          />
        </div>

        <div className="form-group">
          <label>VAT / Tax Rate (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            className="form-input"
            value={formData.taxRate}
            onChange={(e) => recalculate(formData.items, formData.discount, e.target.value, formData.amountPaid)}
          />
        </div>

        <div className="form-group">
          <label>Payment Received / Deposit</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={formData.amountPaid}
            onChange={(e) => recalculate(formData.items, formData.discount, formData.taxRate, e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <select
            className="form-select"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          >
            <option value="Bank Transfer">Bank Transfer (CRDB / NMB)</option>
            <option value="Mobile Money (M-Pesa)">Mobile Money (M-Pesa / TigoPesa)</option>
            <option value="Cash at Workshop">Cash at Workshop / Showroom</option>
            <option value="Card (POS)">Credit / Debit Card</option>
            <option value="Cheque">Bank Cheque</option>
          </select>
        </div>

        {/* Live Calculation Card */}
        <div
          className="form-group form-full"
          style={{
            background: 'rgba(15, 18, 25, 0.7)',
            border: '1px solid var(--border-gold-card)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              CALCULATED TOTAL
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
              {formData.totalAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              DEPOSIT PAID
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: '#10b981' }}>
              {formData.amountPaid.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              BALANCE OUTSTANDING
            </span>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: formData.totalAmount - formData.amountPaid <= 0 ? '#10b981' : '#f59e0b'
              }}
            >
              {Math.max(0, formData.totalAmount - formData.amountPaid).toLocaleString()}
            </div>
          </div>
        </div>

        <div
          className="form-full"
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
            {isEditing ? 'Save Changes' : `Generate ${formData.type === 'quotation' ? 'Quote' : 'Invoice'}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
