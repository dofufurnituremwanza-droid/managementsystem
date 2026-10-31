import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';

export const ClientModal = () => {
  const { modalConfig, setModalConfig, addItem, editItem } = useApp();
  const isEditing = Boolean(modalConfig.data?.id);
  const existing = modalConfig.data || {};

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    clientType: 'Residential', // Residential, Commercial, Real Estate, Architect
    companyName: '',
    notes: ''
  });

  useEffect(() => {
    if (modalConfig.data) {
      setFormData({
        name: existing.name || '',
        phone: existing.phone || '',
        email: existing.email || '',
        address: existing.address || '',
        clientType: existing.clientType || 'Residential',
        companyName: existing.companyName || '',
        notes: existing.notes || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        clientType: 'Residential',
        companyName: '',
        notes: ''
      });
    }
  }, [modalConfig]);

  if (modalConfig.type !== 'new_client' && modalConfig.type !== 'edit_client') {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    if (isEditing) {
      await editItem('clients', existing.id, formData);
    } else {
      await addItem('clients', {
        ...formData,
        totalOrders: 0,
        totalSpent: 0
      });
    }
    setModalConfig({ type: null });
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={isEditing ? 'Edit Client Record' : 'Register New Client'}
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group form-full">
          <label>Client Full Name *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Salim Rashid or Sarah Jenkins"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <input
            type="tel"
            required
            className="form-input"
            placeholder="e.g. +255 712 345 678"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            className="form-input"
            placeholder="e.g. client@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Client Classification</label>
          <select
            className="form-select"
            value={formData.clientType}
            onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}
          >
            <option value="Residential">Residential Home Owner</option>
            <option value="Commercial">Commercial / Office</option>
            <option value="Hotel/Hospitality">Hotel / Resort / Airbnb</option>
            <option value="Architect">Architect / Contractor Partner</option>
          </select>
        </div>

        <div className="form-group">
          <label>Organization / Estate / Villa Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Masaki Waterfront Villa or Apex Offices"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
        </div>

        <div className="form-group form-full">
          <label>Site / Delivery Address</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Plot 14, Haile Selassie Rd, Masaki, Dar es Salaam"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="form-group form-full">
          <label>Notes, Preferences & Wood/Style Tastes</label>
          <textarea
            className="form-textarea"
            placeholder="e.g. Prefers dark walnut stain, likes minimalist Scandinavian lines, allergic to synthetic fabrics..."
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
            {isEditing ? 'Save Changes' : 'Register Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
