import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import confetti from 'canvas-confetti';
import {
  ShoppingCart,
  DollarSign,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  CreditCard,
  Receipt
} from 'lucide-react';

export const MakeSaleModal = () => {
  const { modalConfig, setModalConfig, inventory, clients, editItem, addItem, formatMoney } = useApp();

  const isOpen = modalConfig.type === 'make_sale';
  const preselectedItem = modalConfig.data;

  // Available stock items
  const availableInventory = inventory.filter((i) => (Number(i.quantity) || 0) > 0);

  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('paid'); // paid, partial, unpaid
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync state when modal opens or item changes
  useEffect(() => {
    if (isOpen) {
      const activeItem = preselectedItem || availableInventory[0] || null;
      if (activeItem) {
        setSelectedItemId(activeItem.id);
        setUnitPrice(Number(activeItem.sellingPrice) || 0);
        setQuantity(1);
        const total = (Number(activeItem.sellingPrice) || 0) * 1;
        setAmountPaid(total);
      } else {
        setSelectedItemId('');
        setUnitPrice(0);
        setQuantity(1);
        setAmountPaid(0);
      }
      setClientId('');
      setClientName('');
      setClientPhone('');
      setPaymentMethod('Cash');
      setPaymentStatus('paid');
      setNotes('');
    }
  }, [isOpen, preselectedItem]);

  if (!isOpen) return null;

  const currentItem = inventory.find((i) => i.id === selectedItemId);
  const maxAvailable = Number(currentItem?.quantity) || 0;
  const totalAmount = quantity * unitPrice;
  const balance = Math.max(0, totalAmount - amountPaid);

  const handleItemSelect = (id) => {
    setSelectedItemId(id);
    const item = inventory.find((i) => i.id === id);
    if (item) {
      const price = Number(item.sellingPrice) || 0;
      setUnitPrice(price);
      setQuantity(1);
      setAmountPaid(price);
    }
  };

  const handleClientSelect = (id) => {
    setClientId(id);
    const selected = clients.find((c) => c.id === id);
    if (selected) {
      setClientName(selected.name);
      setClientPhone(selected.phone || '');
    }
  };

  const handleQuantityChange = (val) => {
    const q = Math.max(1, Number(val) || 1);
    setQuantity(q);
    const total = q * unitPrice;
    if (paymentStatus === 'paid') {
      setAmountPaid(total);
    }
  };

  const handlePriceChange = (val) => {
    const p = Math.max(0, Number(val) || 0);
    setUnitPrice(p);
    const total = quantity * p;
    if (paymentStatus === 'paid') {
      setAmountPaid(total);
    }
  };

  const handleStatusChange = (status) => {
    setPaymentStatus(status);
    if (status === 'paid') {
      setAmountPaid(totalAmount);
    } else if (status === 'unpaid') {
      setAmountPaid(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentItem) return;

    if (quantity > maxAvailable) {
      alert(`Cannot sell ${quantity} units! Only ${maxAvailable} available in stock.`);
      return;
    }

    try {
      setSubmitting(true);
      const receiptNumber = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
      const timestamp = new Date().toISOString();

      // 1. Decrement inventory
      const newStockQty = Math.max(0, maxAvailable - quantity);
      await editItem('inventory', currentItem.id, { quantity: newStockQty });

      // 2. Build sale record
      const saleRecord = {
        receiptNumber,
        inventoryId: currentItem.id,
        itemName: currentItem.name,
        imageUrl: currentItem.imageUrl || '',
        category: currentItem.category || 'Finished Furniture',
        sku: currentItem.sku || 'N/A',
        quantity,
        unitPrice,
        costPrice: Number(currentItem.costPrice) || 0,
        totalAmount,
        amountPaid: Number(amountPaid),
        balance,
        paymentMethod,
        paymentStatus,
        clientId: clientId || null,
        clientName: clientName.trim() || 'Showroom Walk-in Client',
        clientPhone: clientPhone.trim() || '',
        notes: notes.trim(),
        saleDate: timestamp
      };

      await addItem('sales', saleRecord);

      // 3. Mirror into invoices collection for accounting & reports
      await addItem('invoices', {
        type: 'sale',
        invoiceNumber: receiptNumber,
        clientId: clientId || null,
        clientName: clientName.trim() || 'Showroom Walk-in Client',
        clientPhone: clientPhone.trim() || '',
        issueDate: timestamp.split('T')[0],
        dueDate: timestamp.split('T')[0],
        items: [
          {
            description: `${currentItem.name} (${currentItem.sku || 'Stock Item'})`,
            quantity,
            unitPrice,
            imageUrl: currentItem.imageUrl || ''
          }
        ],
        subtotal: totalAmount,
        discount: 0,
        taxRate: 0,
        taxAmount: 0,
        totalAmount,
        amountPaid: Number(amountPaid),
        paymentMethod,
        status: paymentStatus === 'paid' ? 'paid' : paymentStatus === 'partial' ? 'partial' : 'unpaid',
        notes: notes.trim() || 'Showroom Direct Sale',
        isSale: true
      });

      // 4. Confetti animation
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        console.warn('Confetti error', err);
      }

      // 5. Open printable sales receipt modal
      setModalConfig({
        type: 'sale_receipt',
        data: saleRecord
      });
    } catch (err) {
      console.error('Sale error', err);
      alert('Error recording sale: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title="Point of Sale — Sell from Showroom Stock"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="form-grid">
        {/* Item Selection Banner */}
        <div className="form-group form-full">
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Select Stock / Showroom Piece to Sell *</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--gold-light)' }}>
              {availableInventory.length} products ready in stock
            </span>
          </label>

          <select
            className="form-select"
            value={selectedItemId}
            onChange={(e) => handleItemSelect(e.target.value)}
            required
            style={{ fontWeight: 600, fontSize: '0.94rem' }}
          >
            <option value="">-- Choose product from showroom stock --</option>
            {inventory.map((item) => (
              <option key={item.id} value={item.id} disabled={(Number(item.quantity) || 0) <= 0}>
                {item.name} — {formatMoney(item.sellingPrice)} (Stock: {item.quantity} {item.unit || 'pcs'}
                {(Number(item.quantity) || 0) <= 0 ? ' - OUT OF STOCK' : ''})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Product Spotlight Card */}
        {currentItem && (
          <div
            className="form-full"
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              background: '#090b0e',
              border: '1px solid var(--border-gold-card)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '10px'
            }}
          >
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#151921',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {currentItem.imageUrl ? (
                <img
                  src={currentItem.imageUrl}
                  alt={currentItem.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <ShoppingCart size={28} color="var(--gold-light)" />
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>
                {currentItem.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gold-light)', margin: '2px 0 4px' }}>
                {currentItem.sku ? `SKU: ${currentItem.sku}` : ''} | {currentItem.category || 'Furniture'}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem' }}>
                <span style={{ color: maxAvailable > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                  ● Available in Stock: {maxAvailable} {currentItem.unit || 'units'}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Standard Retail: <strong>{formatMoney(currentItem.sellingPrice)}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Quantity and Price */}
        <div className="form-group">
          <label style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Quantity to Sell *</span>
            <span style={{ fontSize: '0.76rem', color: quantity > maxAvailable ? '#ef4444' : 'var(--text-muted)' }}>
              Stock remaining: {Math.max(0, maxAvailable - quantity)}
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus size={14} />
            </button>
            <input
              type="number"
              min="1"
              max={maxAvailable}
              required
              className="form-input"
              style={{
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
                borderColor: quantity > maxAvailable ? '#ef4444' : 'inherit'
              }}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= maxAvailable}
            >
              <Plus size={14} />
            </button>
          </div>
          {quantity > maxAvailable && (
            <div style={{ color: '#ef4444', fontSize: '0.74rem', marginTop: '4px' }}>
              Warning: Exceeds showroom stock level ({maxAvailable})!
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Unit Sale Price (TSh) *</label>
          <input
            type="number"
            min="0"
            required
            className="form-input"
            style={{ fontWeight: 700, color: 'var(--gold-light)' }}
            value={unitPrice}
            onChange={(e) => handlePriceChange(e.target.value)}
          />
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Editable if offering a special client discount
          </span>
        </div>

        {/* Total Banner */}
        <div
          className="form-full"
          style={{
            background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.15) 0%, rgba(197, 160, 89, 0.05) 100%)',
            border: '1px solid var(--border-gold-card)',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
              TOTAL SALE AMOUNT
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
              {formatMoney(totalAmount)}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({quantity} × {formatMoney(unitPrice)})
            </span>
            <div style={{ fontSize: '0.82rem', color: balance === 0 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
              {balance === 0 ? '✓ Paid in Full' : `Remaining Balance: ${formatMoney(balance)}`}
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="form-group">
          <label>Link Existing Client (Optional)</label>
          <select
            className="form-select"
            value={clientId}
            onChange={(e) => handleClientSelect(e.target.value)}
          >
            <option value="">-- Walk-in Client or Choose from CRM --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone || 'No phone'})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Client Full Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Salim Rashid (or Walk-in Showroom Client)"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Client Phone Number</label>
          <input
            type="tel"
            className="form-input"
            placeholder="e.g. +255 754 000 111"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <select
            className="form-select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="Cash">Cash (Showroom Desk)</option>
            <option value="M-Pesa / Tigo Pesa">M-Pesa / Tigo Pesa (Lipa Namba)</option>
            <option value="Airtel Money">Airtel Money</option>
            <option value="Bank Transfer">Bank Transfer (CRDB / NMB)</option>
            <option value="Credit / Debit Card">Credit / Debit Card (POS)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Payment Status</label>
          <select
            className="form-select"
            value={paymentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="paid">Fully Paid Now</option>
            <option value="partial">Deposit / Partial Payment</option>
            <option value="unpaid">Credit / Unpaid (Pay upon Delivery)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Amount Collected Now (TSh)</label>
          <input
            type="number"
            min="0"
            max={totalAmount}
            className="form-input"
            style={{ fontWeight: 700, color: '#10b981' }}
            value={amountPaid}
            onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
          />
        </div>

        <div className="form-group form-full">
          <label>Sales Notes / Delivery Instructions</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Showroom pickup today, wrapped in protective bubble wrap..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div
          className="form-full"
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setModalConfig({ type: null })}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !currentItem || quantity <= 0}
            style={{ padding: '10px 24px' }}
          >
            <CheckCircle2 size={16} />
            <span>{submitting ? 'Recording Sale...' : 'Complete Sale & Print Receipt'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
