import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { Plus, Trash2, ImagePlus, X } from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';
import { getNextInvoiceNumber } from '../../utils/numberGenerator';

export const InvoiceModal = () => {
  const { modalConfig, setModalConfig, clients, invoices, addItem, editItem, settings } = useApp();
  const isEditing = Boolean(modalConfig.data?.id);
  const existing = modalConfig.data || {};

  const generateNumber = (type) => getNextInvoiceNumber(invoices, type);

  const [formData, setFormData] = useState({
    type: 'invoice', // invoice, quotation
    invoiceNumber: generateNumber('invoice'),
    clientId: '',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: '' }],
    subtotal: 0,
    discount: '',
    taxRate: settings.taxRate || '',
    taxAmount: 0,
    totalAmount: 0,
    amountPaid: '',
    paymentMethod: 'Bank Transfer',
    status: 'unpaid', // unpaid, partial, paid, overdue
    notes: ''
  });

  useEffect(() => {
    if (modalConfig.data) {
      const initialType = existing.type || 'invoice';
      const itemsList =
        existing.items && existing.items.length > 0
          ? existing.items.map((it) => {
              const q = Math.max(1, Number(it.quantity) || 1);
              const u = Number(it.unitPrice) || 0;
              const fallbackUnit =
                u > 0
                  ? u
                  : Number(existing.totalAmount) > 0
                  ? Math.round(Number(existing.totalAmount) / q)
                  : Number(existing.subtotal) > 0
                  ? Math.round(Number(existing.subtotal) / q)
                  : '';
              return { ...it, quantity: q, unitPrice: fallbackUnit };
            })
          : [{ description: '', quantity: 1, unitPrice: '' }];

      const computedSub = itemsList.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
      );
      const rawSub = Number(existing.subtotal) || 0;
      const rawTotal = Number(existing.totalAmount) || 0;
      const finalSub = rawSub > 0 ? rawSub : computedSub > 0 ? computedSub : rawTotal;
      const finalTotal = rawTotal > 0 ? rawTotal : finalSub;

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
        subtotal: finalSub,
        discount: existing.discount || '',
        taxRate: existing.taxRate !== undefined ? (existing.taxRate || '') : (settings.taxRate || ''),
        taxAmount: existing.taxAmount || 0,
        totalAmount: finalTotal,
        amountPaid: existing.amountPaid || '',
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
        items: [{ description: '', quantity: 1, unitPrice: '' }],
        subtotal: 0,
        discount: '',
        taxRate: settings.taxRate || '',
        taxAmount: 0,
        totalAmount: 0,
        amountPaid: '',
        paymentMethod: 'Bank Transfer',
        status: 'unpaid',
        notes: ''
      });
    }
  }, [modalConfig, invoices]);

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
      discount,
      taxRate,
      taxAmount: tax,
      totalAmount: grand,
      amountPaid: paid,
      status
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    let cleanVal = value;
    if ((field === 'quantity' || field === 'unitPrice') && typeof value === 'string') {
      cleanVal = value.replace(/^0+(?=\d)/, '');
    }
    updated[index][field] = cleanVal;
    recalculate(updated);
  };

  const handleItemImageSelect = async (index, file) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 800, 0.75);
      handleItemChange(index, 'imageUrl', compressed);
    } catch (err) {
      console.error('Invoice line item photo compress error:', err);
    }
  };

  const addItemRow = () => {
    const updated = [...formData.items, { description: '', quantity: 1, unitPrice: '' }];
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

    const sanitizedItems = formData.items.map((it) => ({
      ...it,
      quantity: Math.max(1, Number(it.quantity) || 1),
      unitPrice: Math.max(0, Number(it.unitPrice) || 0)
    }));
    const disc = Math.max(0, Number(formData.discount) || 0);
    const taxRate = Math.max(0, Number(formData.taxRate) || 0);
    const paid = Math.max(0, Number(formData.amountPaid) || 0);
    const sub = sanitizedItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const postDisc = Math.max(0, sub - disc);
    const tax = Math.round(postDisc * (taxRate / 100));
    const grand = postDisc + tax;
    let status = 'unpaid';
    if (paid >= grand && grand > 0) status = 'paid';
    else if (paid > 0) status = 'partial';

    const payload = {
      ...formData,
      items: sanitizedItems,
      subtotal: sub,
      discount: disc,
      taxRate,
      taxAmount: tax,
      totalAmount: grand,
      amountPaid: paid,
      status
    };

    if (isEditing) {
      await editItem('invoices', existing.id, payload);
    } else {
      await addItem('invoices', payload);
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
              <div key={idx} className="invoice-item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.imageUrl ? (
                    <div
                      style={{
                        position: 'relative',
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-gold-card)',
                        flexShrink: 0
                      }}
                      title="Item Photo"
                    >
                      <img
                        src={item.imageUrl}
                        alt="Product"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleItemChange(idx, 'imageUrl', '')}
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: 'rgba(239, 68, 68, 0.9)',
                          border: 'none',
                          color: '#fff',
                          padding: '1px 3px',
                          cursor: 'pointer',
                          borderRadius: '0 0 0 4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Remove photo"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <label
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        border: '1px dashed rgba(197, 160, 89, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--gold-light)',
                        flexShrink: 0,
                        background: 'rgba(255, 255, 255, 0.02)'
                      }}
                      title="Attach product photo to line item"
                    >
                      <ImagePlus size={15} />
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleItemImageSelect(idx, e.target.files?.[0])}
                      />
                    </label>
                  )}
                  <input
                    type="text"
                    required
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Description (e.g. 8-Seater Hardwood Dining Table, Teak Wood, 240x100cm)"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  />
                </div>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="1"
                  value={item.quantity ?? ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  placeholder="0"
                  value={item.unitPrice ?? ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
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
            placeholder="0"
            value={formData.discount ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => recalculate(formData.items, e.target.value.replace(/^0+(?=\d)/, ''), formData.taxRate, formData.amountPaid)}
          />
        </div>

        <div className="form-group">
          <label>VAT / Tax Rate (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            className="form-input"
            placeholder="0"
            value={formData.taxRate ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => recalculate(formData.items, formData.discount, e.target.value.replace(/^0+(?=\d)/, ''), formData.amountPaid)}
          />
        </div>

        <div className="form-group">
          <label>Payment Received / Deposit</label>
          <input
            type="number"
            min="0"
            className="form-input"
            placeholder="0"
            value={formData.amountPaid ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => recalculate(formData.items, formData.discount, formData.taxRate, e.target.value.replace(/^0+(?=\d)/, ''))}
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
          className="form-group form-full invoice-calc-card"
          style={{
            background: 'rgba(15, 18, 25, 0.7)',
            border: '1px solid var(--border-gold-card)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
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
            {isEditing ? 'Save Changes' : `Generate ${formData.type === 'quotation' ? 'Quote' : 'Invoice'}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
