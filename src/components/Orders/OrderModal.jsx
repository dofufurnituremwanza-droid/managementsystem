import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { ImageUploader } from '../Common/ImageUploader';
import { getNextOrderNumber } from '../../utils/numberGenerator';
import confetti from 'canvas-confetti';

export const OrderModal = () => {
  const {
    modalConfig,
    setModalConfig,
    clients,
    orders,
    invoices,
    expenses,
    addItem,
    editItem,
    removeItem,
    formatMoney,
    isOwner,
    isAssistant,
    showToast
  } = useApp();
  const isEditing = Boolean(modalConfig.data?.id);
  const existing = modalConfig.data || {};

  const generateOrderNum = () => getNextOrderNumber(orders);
  const todayStr = new Date().toISOString().split('T')[0];

  const getInitialImages = (data) => {
    if (Array.isArray(data?.images) && data.images.length > 0) {
      return data.images.filter(Boolean);
    }
    if (data?.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim().length > 0) {
      return [data.imageUrl.trim()];
    }
    return [];
  };

  const initialImages = getInitialImages(existing);

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    orderNumber: existing.orderNumber || generateOrderNum(),
    clientId: existing.clientId || '',
    clientName: existing.clientName || '',
    clientPhone: existing.clientPhone || '',
    imageUrl: initialImages[0] || '',
    images: initialImages,
    category: existing.category || 'Dining Table & Chairs',
    itemName: existing.itemName || 'Dining Table & Chairs',
    color: existing.color || existing.fabric || '',
    dimensions: existing.dimensions || '',
    quantity: existing.quantity !== undefined && existing.quantity !== '' ? Number(existing.quantity) || 1 : 1,
    unitPrice: existing.unitPrice || '',
    totalPrice: existing.totalPrice || '',
    depositPaid: existing.depositPaid || '',
    productionExpenses: existing.productionExpenses !== undefined && existing.productionExpenses !== '' ? existing.productionExpenses : '',
    expectedProfit: existing.expectedProfit !== undefined && existing.expectedProfit !== '' ? existing.expectedProfit : '',
    expenseCategory: existing.expenseCategory || 'Timber & Raw Materials',
    expenseNotes: existing.expenseNotes || '',
    autoLogExpense: existing.autoLogExpense !== undefined ? existing.autoLogExpense : true,
    linkedExpenseId: existing.linkedExpenseId || '',
    orderDate: existing.orderDate || todayStr,
    dueDate: existing.dueDate || '',
    targetDeliveryDate: existing.targetDeliveryDate || existing.dueDate || '',
    status: existing.status || 'draft'
  });

  useEffect(() => {
    setIsSaving(false);
    if (modalConfig.data) {
      const activeCat = existing.category || existing.itemName || 'Dining Table & Chairs';
      const orderDt = existing.orderDate || existing.createdAt?.split('T')[0] || todayStr;
      const deliveryDt = existing.targetDeliveryDate || existing.dueDate || '';

      const rawQty = existing.quantity !== undefined && existing.quantity !== '' ? Number(existing.quantity) || 1 : 1;
      const rawTotal = Number(existing.totalPrice) || Number(existing.price) || 0;
      const rawUnit = Number(existing.unitPrice) || (rawTotal > 0 ? Math.round(rawTotal / rawQty) : 0);
      const calculatedTotal = rawTotal > 0 ? rawTotal : (rawUnit * rawQty);
      const existingImgs = getInitialImages(existing);

      setFormData({
        orderNumber: existing.orderNumber || generateOrderNum(),
        clientId: existing.clientId || '',
        clientName: existing.clientName || '',
        clientPhone: existing.clientPhone || '',
        imageUrl: existingImgs[0] || '',
        images: existingImgs,
        category: activeCat,
        itemName: existing.itemName || activeCat,
        color: existing.color || existing.fabric || '',
        dimensions: existing.dimensions || '',
        quantity: rawQty,
        unitPrice: rawUnit > 0 ? rawUnit : '',
        totalPrice: calculatedTotal > 0 ? calculatedTotal : '',
        depositPaid: existing.depositPaid !== undefined && existing.depositPaid !== '' && existing.depositPaid !== 0 ? existing.depositPaid : '',
        productionExpenses: existing.productionExpenses !== undefined && existing.productionExpenses !== '' ? existing.productionExpenses : '',
        expectedProfit: existing.expectedProfit !== undefined && existing.expectedProfit !== '' ? existing.expectedProfit : '',
        expenseCategory: existing.expenseCategory || 'Timber & Raw Materials',
        expenseNotes: existing.expenseNotes || '',
        autoLogExpense: existing.autoLogExpense !== undefined ? existing.autoLogExpense : true,
        linkedExpenseId: existing.linkedExpenseId || '',
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
        images: [],
        category: 'Dining Table & Chairs',
        itemName: 'Dining Table & Chairs',
        color: '',
        dimensions: '',
        quantity: 1,
        unitPrice: '',
        totalPrice: '',
        depositPaid: '',
        productionExpenses: '',
        expectedProfit: '',
        expenseCategory: 'Timber & Raw Materials',
        expenseNotes: '',
        autoLogExpense: true,
        linkedExpenseId: '',
        orderDate: todayStr,
        dueDate: '',
        targetDeliveryDate: '',
        status: 'draft'
      });
    }
  }, [modalConfig, orders]);

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
    const q = cleanQty === '' ? 1 : Math.max(1, Number(cleanQty) || 1);
    const u = cleanUnit === '' ? 0 : Math.max(0, Number(cleanUnit) || 0);
    const total = q * u;
    setFormData((prev) => {
      const exp = Number(prev.productionExpenses) || 0;
      const profit = total > 0 && exp > 0 ? Math.max(0, total - exp) : prev.expectedProfit;
      return {
        ...prev,
        quantity: cleanQty,
        unitPrice: cleanUnit,
        totalPrice: total > 0 ? total : '',
        expectedProfit: profit !== '' ? profit : ''
      };
    });
  };

  const handleTotalPriceChange = (total) => {
    const cleanTotal = typeof total === 'string' ? total.replace(/^0+(?=\d)/, '') : total;
    const q = Math.max(1, Number(formData.quantity) || 1);
    const t = cleanTotal === '' ? 0 : Math.max(0, Number(cleanTotal) || 0);
    const u = t > 0 ? Math.round(t / q) : '';
    setFormData((prev) => {
      const exp = Number(prev.productionExpenses) || 0;
      const profit = t > 0 && exp > 0 ? Math.max(0, t - exp) : prev.expectedProfit;
      return {
        ...prev,
        unitPrice: u > 0 ? u : '',
        totalPrice: cleanTotal,
        expectedProfit: profit !== '' ? profit : ''
      };
    });
  };

  const handleExpensesChange = (val) => {
    const clean = typeof val === 'string' ? val.replace(/^0+(?=\d)/, '') : val;
    const expNum = clean === '' ? 0 : Math.max(0, Number(clean) || 0);
    const q = Math.max(1, Number(formData.quantity) || 1);
    const t = Number(formData.totalPrice) || (Number(formData.unitPrice) * q) || 0;
    const calcProfit = t > 0 ? Math.max(0, t - expNum) : '';

    setFormData((prev) => ({
      ...prev,
      productionExpenses: clean,
      expectedProfit: calcProfit !== '' ? calcProfit : prev.expectedProfit
    }));
  };

  const handleProfitChange = (val) => {
    const clean = typeof val === 'string' ? val.replace(/^0+(?=\d)/, '') : val;
    const profNum = clean === '' ? 0 : Math.max(0, Number(clean) || 0);
    const q = Math.max(1, Number(formData.quantity) || 1);
    const t = Number(formData.totalPrice) || (Number(formData.unitPrice) * q) || 0;
    const calcExp = t > 0 ? Math.max(0, t - profNum) : '';

    setFormData((prev) => ({
      ...prev,
      expectedProfit: clean,
      productionExpenses: calcExp !== '' ? calcExp : prev.productionExpenses
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const finalItemName = formData.itemName?.trim() || formData.category || 'Bespoke Custom Furniture';
      const deliveryDate = formData.targetDeliveryDate || formData.dueDate || '';
      const qNum = Math.max(1, Number(formData.quantity) || 1);
      let uNum = Math.max(0, Number(formData.unitPrice) || 0);
      let tNum = Math.max(0, Number(formData.totalPrice) || 0);

      // Robust calculation so actual product price is NEVER 0
      if (uNum > 0 && tNum === 0) {
        tNum = qNum * uNum;
      } else if (tNum > 0 && uNum === 0) {
        uNum = Math.round(tNum / qNum);
      } else if (uNum > 0 && tNum > 0 && tNum !== qNum * uNum) {
        tNum = qNum * uNum;
      }

      const dNum = Math.max(0, Number(formData.depositPaid) || 0);
      const expNum = Math.max(0, Number(formData.productionExpenses) || 0);
      let profNum = Number(formData.expectedProfit);
      if (isNaN(profNum) || profNum === 0) {
        profNum = tNum > 0 && expNum > 0 ? Math.max(0, tNum - expNum) : (Number(formData.expectedProfit) || 0);
      }
      const profitMarginPct = tNum > 0 ? ((profNum / tNum) * 100).toFixed(1) : 0;

      const payload = {
        ...formData,
        quantity: qNum,
        unitPrice: uNum,
        totalPrice: tNum,
        depositPaid: dNum,
        productionExpenses: expNum,
        expectedProfit: profNum,
        profitMargin: Number(profitMarginPct) || 0,
        autoLogExpense: Boolean(formData.autoLogExpense),
        expenseNotes: formData.expenseNotes || '',
        expenseCategory: formData.expenseCategory || 'Timber & Raw Materials',
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

      const invStatus =
        dNum >= tNum && tNum > 0
          ? 'paid'
          : dNum > 0
          ? 'partial'
          : 'unpaid';

      const itemDesc = `${finalItemName}${formData.color ? ` - Color: ${formData.color}` : ''}${
        formData.dimensions ? ` (${formData.dimensions})` : ''
      }`;

      const invoiceItem = {
        description: itemDesc,
        quantity: qNum,
        unitPrice: uNum > 0 ? uNum : (tNum > 0 ? Math.round(tNum / qNum) : 0),
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
          subtotal: tNum,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: tNum,
          amountPaid: dNum,
          paymentMethod: 'Bank Transfer / Cash',
          status: invStatus,
          notes: `Official Commercial Invoice for Order #${formData.orderNumber}. Category: ${
            formData.category || 'Custom Furniture'
          }. Delivery: ${clientAddress || 'Mwanza Workshop Handover'}`
        };

        if (existingInvoice) {
          await editItem('invoices', existingInvoice.id, invoicePayload, { silent: true });
        } else {
          const createdInv = await addItem('invoices', invoicePayload, { silent: true });
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
          subtotal: tNum,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: tNum,
          amountPaid: dNum,
          paymentMethod: 'Bank Transfer / Cash',
          status: invStatus,
          notes: `Auto-generated official invoice for Customer Order #${formData.orderNumber}. Category: ${
            formData.category || 'Custom Furniture'
          }. Delivery: ${clientAddress || 'Mwanza Workshop Handover'}`
        };

        const createdInv = await addItem('invoices', invoicePayload, { silent: true });
        savedInvoiceId = createdInv?.id;

        if (savedRecord?.id && createdInv?.id) {
          await editItem('orders', savedRecord.id, {
            invoiceId: createdInv.id,
            invoiceNumber: invoiceNum
          }, { silent: true });
        }

        try {
          confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
        } catch (err) {}

        showToast(
          `Order #${formData.orderNumber} recorded & Official Invoice #${invoiceNum} automatically prepared!`,
          'success'
        );
      }

      // Automatically synchronize workshop production expenses
      const targetOrderId = savedRecord?.id || existing.id;
      let finalLinkedExpId = existing.linkedExpenseId || null;

      if (formData.autoLogExpense && expNum > 0) {
        const existingExpense = expenses?.find(
          (exp) =>
            (existing.linkedExpenseId && exp.id === existing.linkedExpenseId) ||
            (targetOrderId && exp.orderId === targetOrderId) ||
            (formData.orderNumber && exp.orderNumber === formData.orderNumber && exp.title?.includes('Production Cost'))
        );

        const expensePayload = {
          title: `Production Cost: ${formData.orderNumber} (${finalItemName})`,
          category: formData.expenseCategory || 'Timber & Raw Materials',
          amount: expNum,
          date: formData.orderDate || todayStr,
          paidTo: 'Workshop Production',
          paymentMethod: 'Cash',
          receiptRef: formData.orderNumber,
          orderId: targetOrderId || '',
          orderNumber: formData.orderNumber,
          notes: formData.expenseNotes
            ? `${formData.expenseNotes} (Auto-recorded from Order #${formData.orderNumber})`
            : `Production material and labor costs for Order #${formData.orderNumber} (${finalItemName})`
        };

        if (existingExpense) {
          await editItem('expenses', existingExpense.id, expensePayload, { silent: true });
          finalLinkedExpId = existingExpense.id;
        } else {
          const createdExp = await addItem('expenses', expensePayload, { silent: true });
          finalLinkedExpId = createdExp?.id;
        }

        if (targetOrderId && finalLinkedExpId) {
          await editItem('orders', targetOrderId, { linkedExpenseId: finalLinkedExpId }, { silent: true });
        }
      } else if ((!formData.autoLogExpense || expNum === 0) && (existing.linkedExpenseId || existing.id)) {
        const existingExpense = expenses?.find(
          (exp) =>
            (existing.linkedExpenseId && exp.id === existing.linkedExpenseId) ||
            (existing.id && exp.orderId === existing.id)
        );
        if (existingExpense) {
          await removeItem('expenses', existingExpense.id);
        }
      }

      // Automatically open Order & Deposit Payment Receipt with instant link to official invoice
      setModalConfig({
        type: 'order_receipt',
        data: {
          ...payload,
          quantity: qNum,
          unitPrice: uNum,
          totalPrice: tNum,
          depositPaid: dNum,
          id: savedRecord?.id || existing.id,
          invoiceId: savedInvoiceId,
          invoiceNumber: invoiceNum
        }
      });
    } catch (err) {
      console.error('Error saving order:', err);
      showToast('Error saving order: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const currentQty = Math.max(1, Number(formData.quantity) || 1);
  const currentTotal = Number(formData.totalPrice) || (Number(formData.unitPrice) * currentQty) || 0;
  const currentExpenses = Number(formData.productionExpenses) || 0;
  const currentProfitInput = formData.expectedProfit !== '' && formData.expectedProfit !== undefined ? Number(formData.expectedProfit) : null;
  const calculatedProfit = currentProfitInput !== null && !isNaN(currentProfitInput) ? currentProfitInput : (currentTotal > 0 ? (currentTotal - currentExpenses) : 0);
  const marginNum = currentTotal > 0 ? Math.round((calculatedProfit / currentTotal) * 100) : 0;
  const currentDeposit = Number(formData.depositPaid) || 0;

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
            placeholder="e.g. +255 769 456 792"
            value={formData.clientPhone}
            onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
          />
        </div>

        {/* 5. Photo Design / Design Reference (Attach Multiple Images) */}
        <ImageUploader
          value={formData.images || (formData.imageUrl ? [formData.imageUrl] : [])}
          onChange={(imgs) => {
            const arr = Array.isArray(imgs) ? imgs : (imgs ? [imgs] : []);
            setFormData((prev) => ({
              ...prev,
              images: arr,
              imageUrl: arr[0] || ''
            }));
          }}
          label="Design Reference Photos (Attach Multiple Images)"
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
            min="0"
            className="form-input"
            style={{ fontWeight: 700, borderColor: 'var(--gold-primary)', color: 'var(--gold-light)' }}
            placeholder="0"
            value={formData.totalPrice ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handleTotalPriceChange(e.target.value)}
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

        {/* 12. INTERNAL PRODUCTION EXPENSES & PROFIT SECTION (Owner / Internal Ledger) */}
        {(!isAssistant || isOwner) && (
          <div
            className="form-full"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 24, 33, 0.95), rgba(12, 15, 21, 0.98))',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '12px',
              padding: '16px 18px',
              marginTop: '4px',
              marginBottom: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>💰</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                    Production Expenses & Profit Calculation
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Enter costs to make this furniture (materials, carpenter labor) to know net profit early & save time
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  padding: '3px 9px',
                  borderRadius: '20px'
                }}
              >
                🔒 Internal Ledger (Never printed on client receipts)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
              {/* Production Expenses Input */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ color: '#fca5a5', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Production Expenses (TSh)</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>Timber, wages, sponge...</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  style={{ borderColor: 'rgba(239, 68, 68, 0.45)', fontWeight: 700, color: '#f87171' }}
                  placeholder="0"
                  value={formData.productionExpenses ?? ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleExpensesChange(e.target.value)}
                />
              </div>

              {/* Expected Net Profit Input */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ color: '#6ee7b7', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Expected Net Profit (TSh)</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>Auto-calculated or enter</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  style={{ borderColor: 'rgba(16, 185, 129, 0.45)', fontWeight: 700, color: '#34d399' }}
                  placeholder="0"
                  value={formData.expectedProfit ?? ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleProfitChange(e.target.value)}
                />
              </div>

              {/* Expense Category */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ color: 'var(--text-secondary)' }}>Expense Category</label>
                <select
                  className="form-select"
                  value={formData.expenseCategory || 'Timber & Raw Materials'}
                  onChange={(e) => setFormData({ ...formData, expenseCategory: e.target.value })}
                >
                  <option value="Timber & Raw Materials">Timber & Raw Materials</option>
                  <option value="Fabrics & Upholstery">Fabrics & Foam Upholstery</option>
                  <option value="Artisan & Carpenter Wages">Artisan & Carpenter Labor</option>
                  <option value="Transport & Delivery">Transport & Delivery</option>
                </select>
              </div>
            </div>

            {/* Optional Notes / Breakdown */}
            <div className="form-group" style={{ marginTop: '12px', marginBottom: '12px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.80rem' }}>
                Cost Breakdown / Notes (Optional)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Mvule timber 400,000, Carpenter wage 150,000, Foam & Fabric 120,000"
                value={formData.expenseNotes || ''}
                onChange={(e) => setFormData({ ...formData, expenseNotes: e.target.value })}
              />
            </div>

            {/* Real-time Profitability Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                padding: '12px 14px',
                background: 'rgba(0, 0, 0, 0.45)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selling Price</div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--gold-light)' }}>
                  {formatMoney(currentTotal)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: '#fca5a5', textTransform: 'uppercase' }}>Production Cost</div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#f87171' }}>
                  {formatMoney(currentExpenses)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: '#6ee7b7', textTransform: 'uppercase' }}>Net Profit</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: calculatedProfit >= 0 ? '#34d399' : '#f87171' }}>
                  {calculatedProfit >= 0 ? `+${formatMoney(calculatedProfit)}` : `-${formatMoney(Math.abs(calculatedProfit))}`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Margin</div>
                <div
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: marginNum >= 30 ? '#10b981' : marginNum > 0 ? '#f59e0b' : '#ef4444'
                  }}
                >
                  {currentTotal > 0 ? `${marginNum}%` : '0%'}
                </div>
              </div>
            </div>

            {/* Cashflow Guidance based on Advance Paid */}
            {currentExpenses > 0 && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: currentDeposit >= currentExpenses ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  border: `1px solid ${currentDeposit >= currentExpenses ? 'rgba(16, 185, 129, 0.28)' : 'rgba(245, 158, 11, 0.28)'}`,
                  color: currentDeposit >= currentExpenses ? '#6ee7b7' : '#fcd34d'
                }}
              >
                <span>{currentDeposit >= currentExpenses ? '✅' : '💡'}</span>
                <span>
                  {currentDeposit >= currentExpenses
                    ? `Customer advance (${formatMoney(currentDeposit)}) fully covers the ${formatMoney(currentExpenses)} production expenses. Safe cashflow!`
                    : currentDeposit > 0
                    ? `Customer advance covers ${formatMoney(currentDeposit)} of ${formatMoney(currentExpenses)} production expenses. Remaining ${formatMoney(currentExpenses - currentDeposit)} required from workshop cash.`
                    : `No advance received yet — ${formatMoney(currentExpenses)} required from workshop capital to build this furniture.`}
                </span>
              </div>
            )}

            {/* Auto-sync to Workshop Expenses ledger */}
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="autoLogExpenseCheckbox"
                checked={Boolean(formData.autoLogExpense)}
                onChange={(e) => setFormData({ ...formData, autoLogExpense: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--gold-primary)', cursor: 'pointer' }}
              />
              <label
                htmlFor="autoLogExpenseCheckbox"
                style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}
              >
                ⚡ <strong>Automatically record in Workshop Expenses ledger</strong> (reduces recording time & keeps Main Dashboard Profit & Loss accurate)
              </label>
            </div>
          </div>
        )}

        {/* 13. Order Date */}
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
          className="form-full modal-form-actions"
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setModalConfig({ type: null })}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving Order...' : (isEditing ? 'Update Order' : 'Create Order & Print Receipt')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
