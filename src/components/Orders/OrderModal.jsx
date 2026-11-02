import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { ImageUploader } from '../Common/ImageUploader';
import confetti from 'canvas-confetti';

export const OrderModal = () => {
  const { modalConfig, setModalConfig, clients, invoices, addItem, editItem, showToast } = useApp();
  const isEditing = Boolean(modalConfig.data?.id);
  const existing = modalConfig.data || {};

  const generateOrderNum = () => `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    orderNumber: generateOrderNum(),
    clientId: '',
    clientName: '',
    clientPhone: '',
    imageUrl: '',
    category: 'Dining Table & Chairs',
    itemName: 'Dining Table & Chairs',
    color: '',
    dimensions: '',
    quantity: 1,
    unitPrice: '',
    totalPrice: '',
    depositPaid: '',
    orderDate: todayStr,
    dueDate: '',
    targetDeliveryDate: '',
    status: 'draft'
  });

  useEffect(() => {
    if (modalConfig.data) {
      const activeCat = existing.category || existing.itemName || 'Dining Table & Chairs';
      const orderDt = existing.orderDate || existing.createdAt?.split('T')[0] || todayStr;
      const deliveryDt = existing.targetDeliveryDate || existing.dueDate || '';

      setFormData({
        orderNumber: existing.orderNumber || generateOrderNum(),
        clientId: existing.clientId || '',
        clientName: existing.clientName || '',
        clientPhone: existing.clientPhone || '',
        imageUrl: existing.imageUrl || '',
        category: activeCat,
        itemName: existing.itemName || activeCat,
        color: existing.color || existing.fabric || '',
        dimensions: existing.dimensions || '',
        quantity: existing.quantity !== undefined ? existing.quantity : 1,
        unitPrice: existing.unitPrice || '',
        totalPrice: existing.totalPrice || '',
        depositPaid: existing.depositPaid !== undefined && existing.depositPaid !== 0 ? existing.depositPaid : '',
        orderDate: orderDt,
        dueDate: deliveryDt,
        targetDeliveryDate: deliveryDt,
        status: existing.status || 'draft'
      });
    } else {
      setFormData({
        orderNumber: generateOrderNum(),
        clientId: '',
        clientName: '',
        clientPhone: '',
        imageUrl: '',
        category: 'Dining Table & Chairs',
        itemName: 'Dining Table & Chairs',
        color: '',
        dimensions: '',
        quantity: 1,
        unitPrice: '',
        totalPrice: '',
        depositPaid: '',
        orderDate: todayStr,
        dueDate: '',
        targetDeliveryDate: '',
        status: 'draft'
      });
    }
  }, [modalConfig]);

  if (modalConfig.type !== 'new_order' && modalConfig.type !== 'edit_order') {
    return null;
  }

  // Handle client selection
  const handleClientSelect = (clientId) => {
    const selected = clients.find((c) => c.id === clientId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        clientId: selected.id,
        clientName: selected.name,
        clientPhone: selected.phone
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        clientId: '',
        clientName: '',
        clientPhone: ''
      }));
    }
  };

  const handlePriceChange = (qty, unit) => {
    const cleanQty = typeof qty === 'string' ? qty.replace(/^0+(?=\d)/, '') : qty;
    const cleanUnit = typeof unit === 'string' ? unit.replace(/^0+(?=\d)/, '') : unit;
    const q = cleanQty === '' ? '' : Math.max(1, Number(cleanQty) || 1);
    const u = cleanUnit === '' ? '' : Math.max(0, Number(cleanUnit) || 0);
    const total = (Number(q) || 0) * (Number(u) || 0);
    setFormData((prev) => ({
      ...prev,
      quantity: cleanQty,
      unitPrice: cleanUnit,
      totalPrice: total > 0 ? total : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim()) return;

    const finalItemName = formData.itemName?.trim() || formData.category || 'Bespoke Custom Furniture';
    const deliveryDate = formData.targetDeliveryDate || formData.dueDate || '';
    const qNum = Math.max(1, Number(formData.quantity) || 1);
    const uNum = Math.max(0, Number(formData.unitPrice) || 0);
    const dNum = Math.max(0, Number(formData.depositPaid) || 0);
    const tNum = qNum * uNum;

    const payload = {
      ...formData,
      quantity: qNum,
      unitPrice: uNum,
      totalPrice: tNum,
      depositPaid: dNum,
      itemName: finalItemName,
      color: formData.color || '',
      fabric: formData.color || '',
      orderDate: formData.orderDate || todayStr,
      targetDeliveryDate: deliveryDate,
      dueDate: deliveryDate
    };

    // Find if a linked invoice already exists
    const existingInvoice = invoices?.find(
      (inv) =>
        (existing.id && inv.orderId === existing.id) ||
        (formData.orderNumber && inv.orderNumber === formData.orderNumber)
    );

    const invoiceNum =
      existingInvoice?.invoiceNumber ||
      `INV-${formData.orderNumber.replace(/^[A-Za-z]+-?/, '') || Math.floor(1000 + Math.random() * 9000)}`;

    const selectedClient = clients?.find(
      (c) => c.id === formData.clientId || c.name === formData.clientName
    );
    const clientAddress = selectedClient?.address || selectedClient?.deliveryAddress || '';

    const totalPrice = Number(formData.totalPrice) || 0;
    const depositPaid = Number(formData.depositPaid) || 0;
    const invStatus =
      depositPaid >= totalPrice && totalPrice > 0
        ? 'paid'
        : depositPaid > 0
        ? 'partial'
        : 'unpaid';

    const itemDesc = `${finalItemName}${formData.color ? ` - Color: ${formData.color}` : ''}${
      formData.dimensions ? ` (${formData.dimensions})` : ''
    }`;

    const invoiceItem = {
      description: itemDesc,
      quantity: Number(formData.quantity) || 1,
      unitPrice: Number(formData.unitPrice) || 0,
      imageUrl: formData.imageUrl || ''
    };

    let savedRecord = null;
    let savedInvoiceId = existingInvoice?.id || null;

    if (isEditing) {
      savedRecord = await editItem('orders', existing.id, {
        ...payload,
        invoiceNumber: invoiceNum
      });

      const invoicePayload = {
        type: 'invoice',
        invoiceNumber: invoiceNum,
        orderId: existing.id,
        orderNumber: formData.orderNumber,
        clientId: formData.clientId || selectedClient?.id || '',
        clientName: formData.clientName,
        clientPhone: formData.clientPhone || selectedClient?.phone || '',
        clientAddress: clientAddress,
        issueDate: formData.orderDate || todayStr,
        dueDate: deliveryDate || formData.orderDate || todayStr,
        items: [invoiceItem],
        subtotal: totalPrice,
        discount: 0,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: totalPrice,
        amountPaid: depositPaid,
        paymentMethod: 'Bank Transfer / Cash',
        status: invStatus,
        notes: `Official Commercial Invoice for Order #${formData.orderNumber}. Category: ${
          formData.category || 'Custom Furniture'
        }. Delivery: ${clientAddress || 'Mwanza Workshop Handover'}`
      };

      if (existingInvoice) {
        await editItem('invoices', existingInvoice.id, invoicePayload);
      } else {
        const createdInv = await addItem('invoices', invoicePayload);
        savedInvoiceId = createdInv?.id;
      }

      showToast(`Order #${formData.orderNumber} & Official Invoice #${invoiceNum} updated!`, 'success');
    } else {
      savedRecord = await addItem('orders', {
        ...payload,
        invoiceNumber: invoiceNum
      });

      const invoicePayload = {
        type: 'invoice',
        invoiceNumber: invoiceNum,
        orderId: savedRecord?.id || '',
        orderNumber: formData.orderNumber,
        clientId: formData.clientId || selectedClient?.id || '',
        clientName: formData.clientName,
        clientPhone: formData.clientPhone || selectedClient?.phone || '',
        clientAddress: clientAddress,
        issueDate: formData.orderDate || todayStr,
        dueDate: deliveryDate || formData.orderDate || todayStr,
        items: [invoiceItem],
        subtotal: totalPrice,
        discount: 0,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: totalPrice,
        amountPaid: depositPaid,
        paymentMethod: 'Bank Transfer / Cash',
        status: invStatus,
        notes: `Auto-generated official invoice for Customer Order #${formData.orderNumber}. Category: ${
          formData.category || 'Custom Furniture'
        }. Delivery: ${clientAddress || 'Mwanza Workshop Handover'}`
      };

      const createdInv = await addItem('invoices', invoicePayload);
      savedInvoiceId = createdInv?.id;

      if (savedRecord?.id && createdInv?.id) {
        await editItem('orders', savedRecord.id, {
          invoiceId: createdInv.id,
          invoiceNumber: invoiceNum
        });
      }

      try {
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      } catch (err) {}

      showToast(
        `Order #${formData.orderNumber} recorded & Official Invoice #${invoiceNum} automatically prepared!`,
        'success'
      );
    }

    // Automatically open Order & Deposit Payment Receipt with instant link to official invoice
    setModalConfig({
      type: 'order_receipt',
      data: {
        ...payload,
        id: savedRecord?.id || existing.id,
        invoiceId: savedInvoiceId,
        invoiceNumber: invoiceNum
      }
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={isEditing ? `Edit Furniture Order (${formData.orderNumber})` : 'New Custom Furniture Order'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="form-grid">
        {/* 1. Order Number */}
        <div className="form-group">
          <label>Order Number</label>
          <input
            type="text"
            required
            className="form-input"
            value={formData.orderNumber}
            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
          />
        </div>

        {/* 2. Link Existing Client */}
        <div className="form-group">
          <label>Link Existing Client</label>
          <select
            className="form-select"
            value={formData.clientId}
            onChange={(e) => handleClientSelect(e.target.value)}
          >
            <option value="">-- Choose registered customer (or enter below) --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Name of the Client */}
        <div className="form-group">
          <label>Name of the Client *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Salim Rashid"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          />
        </div>

        {/* 4. Phone Number */}
        <div className="form-group">
          <label>Phone Number *</label>
          <input
            type="tel"
            required
            className="form-input"
            placeholder="e.g. +255 769 456 793"
            value={formData.clientPhone}
            onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
          />
        </div>

        {/* 5. Photo Design / Design Reference */}
        <ImageUploader
          value={formData.imageUrl}
          onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
          label="Photo Design / Design Reference"
        />

        {/* 6. Category */}
        <div className="form-group">
          <label>Category</label>
          <select
            className="form-select"
            value={formData.category}
            onChange={(e) => {
              const newCat = e.target.value;
              setFormData((prev) => ({
                ...prev,
                category: newCat,
                itemName: newCat
              }));
            }}
          >
            <option value="Dining Table & Chairs">Dining Table & Chairs</option>
            <option value="Living Room & Sofas">Living Room & Sofas</option>
            <option value="Bedroom & Bedframes">Bedroom & Bedframes</option>
            <option value="Office / Desks">Executive Desks & Shelving</option>
            <option value="Consoles & TV Units">TV Consoles & Credenzas</option>
            <option value="Outdoor Furniture">Outdoor & Patio Furniture</option>
            <option value="Custom Joinery">Bespoke Architectural Joinery</option>
          </select>
        </div>

        {/* 7. Color */}
        <div className="form-group">
          <label>Color</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Royal Blue, Warm Grey, Dark Brown, White..."
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
        </div>

        {/* 8. Dimensions */}
        <div className="form-group">
          <label>Dimensions</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 240cm × 100cm × 76cm"
            value={formData.dimensions}
            onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
          />
        </div>

        {/* 9. Quantity */}
        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            min="1"
            className="form-input"
            placeholder="1"
            value={formData.quantity ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handlePriceChange(e.target.value, formData.unitPrice)}
          />
        </div>

        {/* 10. Price */}
        <div className="form-group">
          <label>Price (Unit Price)</label>
          <input
            type="number"
            min="0"
            className="form-input"
            placeholder="0"
            value={formData.unitPrice ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handlePriceChange(formData.quantity, e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Total Price (Calculated)</label>
          <input
            type="number"
            readOnly
            className="form-input"
            style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 700 }}
            placeholder="0"
            value={formData.totalPrice ?? ''}
          />
        </div>

        {/* 11. Advance to be Paid */}
        <div className="form-group">
          <label>Advance to be Paid</label>
          <input
            type="number"
            min="0"
            className="form-input"
            placeholder="0"
            value={formData.depositPaid ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const clean = e.target.value === '' ? '' : e.target.value.replace(/^0+(?=\d)/, '');
              setFormData({ ...formData, depositPaid: clean });
            }}
          />
        </div>

        {/* 12. Order Date */}
        <div className="form-group">
          <label>Order Date</label>
          <input
            type="date"
            required
            className="form-input"
            value={formData.orderDate}
            onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
          />
        </div>

        {/* 13. Target Delivery Date */}
        <div className="form-group">
          <label>Target Delivery Date</label>
          <input
            type="date"
            className="form-input"
            value={formData.targetDeliveryDate}
            onChange={(e) =>
              setFormData({
                ...formData,
                targetDeliveryDate: e.target.value,
                dueDate: e.target.value
              })
            }
          />
        </div>

        <div
          className="form-full"
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setModalConfig({ type: null })}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {isEditing ? 'Update Order' : 'Create Order & Print Receipt'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
