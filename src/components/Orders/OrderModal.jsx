import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { ImageUploader } from '../Common/ImageUploader';

export const OrderModal = () => {
  const { modalConfig, setModalConfig, clients, addItem, editItem } = useApp();
  const isEditing = Boolean(modalConfig.data?.id);
  const existing = modalConfig.data || {};

  const generateOrderNum = () => `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  const [formData, setFormData] = useState({
    orderNumber: generateOrderNum(),
    clientId: '',
    clientName: '',
    clientPhone: '',
    itemName: '',
    imageUrl: '',
    category: 'Dining',
    woodType: 'Mahogany',
    dimensions: '',
    fabric: '',
    finishType: 'Matte Polyurethane',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    depositPaid: 0,
    status: 'draft', // draft, carpentry, upholstery, quality_check, ready, delivered, cancelled
    assignedTo: '',
    dueDate: '',
    notes: ''
  });

  useEffect(() => {
    if (modalConfig.data) {
      setFormData({
        orderNumber: existing.orderNumber || generateOrderNum(),
        clientId: existing.clientId || '',
        clientName: existing.clientName || '',
        clientPhone: existing.clientPhone || '',
        itemName: existing.itemName || '',
        imageUrl: existing.imageUrl || '',
        category: existing.category || 'Dining',
        woodType: existing.woodType || 'Mahogany',
        dimensions: existing.dimensions || '',
        fabric: existing.fabric || '',
        finishType: existing.finishType || 'Matte Polyurethane',
        quantity: existing.quantity || 1,
        unitPrice: existing.unitPrice || 0,
        totalPrice: existing.totalPrice || 0,
        depositPaid: existing.depositPaid || 0,
        status: existing.status || 'draft',
        assignedTo: existing.assignedTo || '',
        dueDate: existing.dueDate || '',
        notes: existing.notes || ''
      });
    } else {
      setFormData({
        orderNumber: generateOrderNum(),
        clientId: '',
        clientName: '',
        clientPhone: '',
        itemName: '',
        imageUrl: '',
        category: 'Dining',
        woodType: 'Mahogany',
        dimensions: '',
        fabric: '',
        finishType: 'Matte Polyurethane',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        depositPaid: 0,
        status: 'draft',
        assignedTo: '',
        dueDate: '',
        notes: ''
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
    const q = Number(qty) || 0;
    const u = Number(unit) || 0;
    setFormData((prev) => ({
      ...prev,
      quantity: q,
      unitPrice: u,
      totalPrice: q * u
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemName.trim() || !formData.clientName.trim()) return;

    if (isEditing) {
      await editItem('orders', existing.id, formData);
    } else {
      await addItem('orders', formData);
    }
    setModalConfig({ type: null });
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={isEditing ? `Edit Furniture Order (${formData.orderNumber})` : 'New Custom Furniture Order'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label>Order Reference #</label>
          <input
            type="text"
            required
            className="form-input"
            value={formData.orderNumber}
            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Link Existing Client</label>
          <select
            className="form-select"
            value={formData.clientId}
            onChange={(e) => handleClientSelect(e.target.value)}
          >
            <option value="">-- Choose registered client or type below --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Client Name *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Brenda Mwangi"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Client Phone Number</label>
          <input
            type="tel"
            className="form-input"
            placeholder="e.g. +255 754 112 233"
            value={formData.clientPhone}
            onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
          />
        </div>

        <div className="form-group form-full">
          <label>Furniture Piece Name *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. 8-Seater Solid Mvule Live-Edge Dining Table"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
          />
        </div>

        <ImageUploader
          value={formData.imageUrl}
          onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
          label="Product Photo / Design Reference Image"
        />

        <div className="form-group">
          <label>Category</label>
          <select
            className="form-select"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="Dining">Dining Table & Chairs</option>
            <option value="Living Room / Sofas">Living Room & Sofas</option>
            <option value="Bedroom / Beds">Bedroom & Bedframes</option>
            <option value="Office / Desks">Executive Desks & Shelving</option>
            <option value="Consoles & TV Units">TV Consoles & Credenzas</option>
            <option value="Outdoor Furniture">Outdoor & Patio Teak</option>
            <option value="Custom Joinery">Bespoke Architectural Joinery</option>
          </select>
        </div>

        <div className="form-group">
          <label>Wood / Timber Species</label>
          <select
            className="form-select"
            value={formData.woodType}
            onChange={(e) => setFormData({ ...formData, woodType: e.target.value })}
          >
            <option value="Mahogany">Solid Mahogany (Kikwete/African)</option>
            <option value="Mvule (Iroko)">Mvule / African Teak (Iroko)</option>
            <option value="Teak">Plantation Teak</option>
            <option value="White Oak">Imported White Oak</option>
            <option value="Walnut">American Black Walnut</option>
            <option value="Pau Rosa / Rosewood">African Rosewood</option>
            <option value="MDF Veneer">High-Density MDF with Natural Veneer</option>
            <option value="Metal & Wood">Brass/Steel Framework + Wood</option>
          </select>
        </div>

        <div className="form-group">
          <label>Dimensions (Length × Width × Height)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 240cm × 100cm × 76cm"
            value={formData.dimensions}
            onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Fabric / Leather & Color Code</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Deep Forest Green Velvet / Tan Top-Grain Leather"
            value={formData.fabric}
            onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Stain & Finishing Type</label>
          <select
            className="form-select"
            value={formData.finishType}
            onChange={(e) => setFormData({ ...formData, finishType: e.target.value })}
          >
            <option value="Natural Matte Polyurethane">Natural Matte Polyurethane</option>
            <option value="Satin Clear Varnish">Satin Clear Varnish</option>
            <option value="Dark Walnut Stain">Dark Walnut Stain</option>
            <option value="Espresso Dark Finish">Espresso Dark Finish</option>
            <option value="Bleached / Natural Blonde">Bleached / Natural Blonde</option>
            <option value="Organic Oil & Beeswax">Organic Hardwax Oil & Beeswax</option>
          </select>
        </div>

        <div className="form-group">
          <label>Production Status</label>
          <select
            className="form-select"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="draft">1. Order Placed / Draft</option>
            <option value="carpentry">2. Carpentry & Timber Cutting</option>
            <option value="upholstery">3. Upholstery & Cushioning / Finishing</option>
            <option value="quality_check">4. Quality Inspection (QC)</option>
            <option value="ready">5. Ready for Delivery / Showroom</option>
            <option value="delivered">6. Delivered & Installed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            min="1"
            className="form-input"
            value={formData.quantity}
            onChange={(e) => handlePriceChange(e.target.value, formData.unitPrice)}
          />
        </div>

        <div className="form-group">
          <label>Unit Price</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={formData.unitPrice}
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
            value={formData.totalPrice}
          />
        </div>

        <div className="form-group">
          <label>Deposit Paid So Far</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={formData.depositPaid}
            onChange={(e) => setFormData({ ...formData, depositPaid: Number(e.target.value) || 0 })}
          />
        </div>

        <div className="form-group">
          <label>Assigned Lead Artisan / Carpenter</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Master Carpenter James"
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Target Delivery Date</label>
          <input
            type="date"
            className="form-input"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>

        <div className="form-group form-full">
          <label>Workshop Carving Notes & Special Instructions</label>
          <textarea
            className="form-textarea"
            placeholder="e.g. Tapered legs, brass foot ferrules, chamfered edge profile..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
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
            {isEditing ? 'Update Order' : 'Create Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
