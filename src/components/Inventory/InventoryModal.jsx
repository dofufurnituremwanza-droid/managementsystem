import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { ImageUploader } from '../Common/ImageUploader';

export const InventoryModal = () => {
  const { modalConfig, setModalConfig, addItem, editItem } = useApp();
  const isEditing = Boolean(modalConfig.data?.id);
  const existing = modalConfig.data || {};

  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
    category: 'Timber & Hardwood',
    quantity: 0,
    unit: 'Pieces',
    minAlertLevel: 5,
    costPrice: 0,
    sellingPrice: 0,
    supplier: '',
    location: 'Main Workshop Timber Yard',
    notes: ''
  });

  useEffect(() => {
    if (modalConfig.data) {
      setFormData({
        name: existing.name || '',
        imageUrl: existing.imageUrl || '',
        sku: existing.sku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
        category: existing.category || 'Timber & Hardwood',
        quantity: existing.quantity !== undefined ? existing.quantity : 0,
        unit: existing.unit || 'Pieces',
        minAlertLevel: existing.minAlertLevel !== undefined ? existing.minAlertLevel : 5,
        costPrice: existing.costPrice || 0,
        sellingPrice: existing.sellingPrice || 0,
        supplier: existing.supplier || '',
        location: existing.location || 'Main Workshop Timber Yard',
        notes: existing.notes || ''
      });
    } else {
      setFormData({
        name: '',
        imageUrl: '',
        sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
        category: 'Timber & Hardwood',
        quantity: 0,
        unit: 'Pieces',
        minAlertLevel: 5,
        costPrice: 0,
        sellingPrice: 0,
        supplier: '',
        location: 'Main Workshop Timber Yard',
        notes: ''
      });
    }
  }, [modalConfig]);

  if (modalConfig.type !== 'new_inventory' && modalConfig.type !== 'edit_inventory') {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (isEditing) {
      await editItem('inventory', existing.id, formData);
    } else {
      await addItem('inventory', formData);
    }
    setModalConfig({ type: null });
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={isEditing ? 'Edit Stock / Material Item' : 'Add Material or Furniture to Stock'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group form-full">
          <label>Item / Furniture Piece Name *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Solid Mvule 8-Seater Dining Table or Chesterfield Velvet Sofa"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <ImageUploader
          value={formData.imageUrl}
          onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
          label="Product / Furniture Showroom Photo *"
        />

        <div className="form-group">
          <label>Stock Category</label>
          <select
            className="form-select"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="Finished Furniture">Finished Furniture (Showroom Piece)</option>
            <option value="Living Room & Sofas">Living Room & Sofas</option>
            <option value="Dining Tables & Chairs">Dining Tables & Chairs</option>
            <option value="Beds & Bedroom Furniture">Beds & Bedroom Furniture</option>
            <option value="Executive Desks & Storage">Executive Desks & Storage</option>
            <option value="Timber & Hardwood">Timber & Hardwood Planks</option>
            <option value="Fabrics & Leather">Fabrics & Leather Upholstery</option>
            <option value="Hardware & Fittings">Hardware & Joinery Fittings</option>
            <option value="Finishes & Paints">Finishes, Stains & Sealers</option>
          </select>
        </div>

        <div className="form-group">
          <label>Item SKU / Stock Code</label>
          <input
            type="text"
            className="form-input"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Current Stock Quantity</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) || 0 })}
          />
        </div>

        <div className="form-group">
          <label>Unit of Measure</label>
          <select
            className="form-select"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            <option value="Pieces">Pieces / Units</option>
            <option value="Sets">Sets</option>
            <option value="Planks / Boards">Planks / Boards</option>
            <option value="Meters / Yards">Meters / Yards</option>
            <option value="Rolls">Rolls</option>
            <option value="Liters / Tins">Liters / Tins</option>
            <option value="Sets / Pairs">Sets / Pairs</option>
            <option value="Kilograms">Kilograms</option>
          </select>
        </div>

        {/* Pricing & Profit Section */}
        <div className="form-group form-full" style={{
          background: 'rgba(197, 160, 89, 0.04)',
          border: '1px solid rgba(197, 160, 89, 0.25)',
          borderRadius: '12px',
          padding: '16px',
          marginTop: '6px',
          marginBottom: '6px'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--gold-light)', fontSize: '0.88rem', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Item Pricing & Profit Margins</span>
            {Number(formData.sellingPrice) > 0 && (
              <span style={{ fontSize: '0.8rem', color: Number(formData.sellingPrice) >= Number(formData.costPrice) ? '#10b981' : '#ef4444' }}>
                {Number(formData.sellingPrice) >= Number(formData.costPrice)
                  ? `Est. Profit: +${(Number(formData.sellingPrice) - Number(formData.costPrice)).toLocaleString()} TSh / unit`
                  : 'Selling below cost'}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ color: '#fff', fontWeight: 600 }}>Selling / Retail Price (TSh) *</label>
              <input
                type="number"
                min="0"
                required
                className="form-input"
                style={{ borderColor: 'var(--gold-primary)', background: 'rgba(197, 160, 89, 0.08)', fontWeight: 700 }}
                placeholder="Amount customer pays (e.g. 1500000)"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) || 0 })}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Price charged when making a sale</span>
            </div>

            <div>
              <label>Cost / Production Price (TSh)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="Timber & labor cost (e.g. 900000)"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) || 0 })}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Raw materials & workshop production cost</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Low Stock Warning Threshold</label>
          <input
            type="number"
            min="0"
            className="form-input"
            placeholder="Alert when stock falls below"
            value={formData.minAlertLevel}
            onChange={(e) => setFormData({ ...formData, minAlertLevel: Number(e.target.value) || 0 })}
          />
        </div>

        <div className="form-group">
          <label>Supplier / Workshop Source</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. In-House Workshop / Mwanza Timber Depot"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          />
        </div>

        <div className="form-group form-full">
          <label>Showroom / Workshop Storage Location & Notes</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Showroom Floor Section A - Dining Display"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
            {isEditing ? 'Save Item' : 'Add to Inventory'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
