import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';

export const InventoryModal = () => {
  const { modalConfig, setModalConfig, addItem, editItem } = useApp();
  const isEditing = Boolean(modalConfig.data?.id);
  const existing = modalConfig.data || {};

  const [formData, setFormData] = useState({
    name: '',
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
          <label>Item / Material Name *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Kiln-Dried Mvule Planks (2x10x12ft) or Emerald Velvet Fabric Roll"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Stock Category</label>
          <select
            className="form-select"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="Timber & Hardwood">Timber & Hardwood</option>
            <option value="Fabrics & Leather">Fabrics & Leather Upholstery</option>
            <option value="Hardware & Fittings">Hardware & Joinery Fittings</option>
            <option value="Finishes & Paints">Finishes, Stains & Sealers</option>
            <option value="Finished Furniture">Finished Furniture (Showroom Stock)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Item SKU / Barcode</label>
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
            <option value="Planks / Boards">Planks / Boards</option>
            <option value="Meters / Yards">Meters / Yards</option>
            <option value="Rolls">Rolls</option>
            <option value="Liters / Tins">Liters / Tins</option>
            <option value="Sets / Pairs">Sets / Pairs</option>
            <option value="Kilograms">Kilograms</option>
          </select>
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
          <label>Cost / Purchase Price per Unit</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) || 0 })}
          />
        </div>

        <div className="form-group">
          <label>Selling / Retail Price (if applicable)</label>
          <input
            type="number"
            min="0"
            className="form-input"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) || 0 })}
          />
        </div>

        <div className="form-group">
          <label>Supplier / Timber Mill</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Kilombero Timber Mills / Dar Fabric Importers"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          />
        </div>

        <div className="form-group form-full">
          <label>Workshop Storage Location & Notes</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Rack B, Section 3 - Timber Bay"
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
