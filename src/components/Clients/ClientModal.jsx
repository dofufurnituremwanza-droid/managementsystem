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
    address: ''
  });

  useEffect(() => {
    if (modalConfig.data) {
      setFormData({
        name: existing.name || '',
        phone: existing.phone || '',
        address: existing.address || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        address: ''
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
      title={isEditing ? 'Edit Customer Record' : 'Add New Customer'}
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group form-full">
          <label>Full Names *</label>
          <input
            type="text"
            required
            autoFocus
            className="form-input"
            placeholder="e.g. Salim Rashid Mwita"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="form-group form-full">
          <label>Phone Number *</label>
          <input
            type="tel"
            required
            className="form-input"
            placeholder="e.g. +255 769 456 792"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="form-group form-full">
          <label>Delivery Address *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Bugarika Sokoni, Bugando, Mwanza"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
            {isEditing ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
