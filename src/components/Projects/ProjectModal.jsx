import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { ImageUploader } from '../Common/ImageUploader';

export const ProjectModal = () => {
  const { modalConfig, setModalConfig, clients, addItem, editItem } = useApp();
  const isEditing = Boolean(modalConfig.data?.id);
  const existing = modalConfig.data || {};

  const generateProjectCode = () => `PRJ-${Math.floor(100 + Math.random() * 900)}`;

  const [formData, setFormData] = useState({
    projectCode: generateProjectCode(),
    title: '',
    imageUrl: '',
    clientId: '',
    clientName: '',
    clientPhone: '',
    siteLocation: '',
    rooms: 'Living Room, Dining Area',
    designStyle: 'Modern Luxury / Warm Minimalist',
    contractValue: '',
    depositPaid: '',
    stage: 'consultation', // consultation, moodboard, 3d_approval, procurement, site_fitout, completed, cancelled
    startDate: '',
    targetHandoverDate: '',
    scopeDescription: '',
    checklist: [
      { text: 'Site measurements & photolog', done: false },
      { text: 'Color palette & moodboard sign-off', done: false },
      { text: '3D renders & furniture drawings approved', done: false },
      { text: 'Custom furniture carpentry in workshop', done: false },
      { text: 'On-site installation & lighting setup', done: false },
      { text: 'Final client walkthrough & handover', done: false }
    ]
  });

  useEffect(() => {
    if (modalConfig.data) {
      setFormData({
        projectCode: existing.projectCode || generateProjectCode(),
        title: existing.title || '',
        imageUrl: existing.imageUrl || '',
        clientId: existing.clientId || '',
        clientName: existing.clientName || '',
        clientPhone: existing.clientPhone || '',
        siteLocation: existing.siteLocation || '',
        rooms: existing.rooms || 'Living Room',
        designStyle: existing.designStyle || 'Modern Luxury',
        contractValue: existing.contractValue || '',
        depositPaid: existing.depositPaid || '',
        stage: existing.stage || 'consultation',
        startDate: existing.startDate || '',
        targetHandoverDate: existing.targetHandoverDate || '',
        scopeDescription: existing.scopeDescription || '',
        checklist: existing.checklist || [
          { text: 'Site measurements & photolog', done: false },
          { text: 'Color palette & moodboard sign-off', done: false },
          { text: '3D renders & furniture drawings approved', done: false },
          { text: 'Custom furniture carpentry in workshop', done: false },
          { text: 'On-site installation & lighting setup', done: false },
          { text: 'Final client walkthrough & handover', done: false }
        ]
      });
    } else {
      setFormData({
        projectCode: generateProjectCode(),
        title: '',
        imageUrl: '',
        clientId: '',
        clientName: '',
        clientPhone: '',
        siteLocation: '',
        rooms: 'Living Room, Dining Area',
        designStyle: 'Modern Luxury / Warm Minimalist',
        contractValue: '',
        depositPaid: '',
        stage: 'consultation',
        startDate: new Date().toISOString().split('T')[0],
        targetHandoverDate: '',
        scopeDescription: '',
        checklist: [
          { text: 'Site measurements & photolog', done: false },
          { text: 'Color palette & moodboard sign-off', done: false },
          { text: '3D renders & furniture drawings approved', done: false },
          { text: 'Custom furniture carpentry in workshop', done: false },
          { text: 'On-site installation & lighting setup', done: false },
          { text: 'Final client walkthrough & handover', done: false }
        ]
      });
    }
  }, [modalConfig]);

  if (modalConfig.type !== 'new_project' && modalConfig.type !== 'edit_project') {
    return null;
  }

  const handleClientSelect = (clientId) => {
    const selected = clients.find((c) => c.id === clientId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        clientId: selected.id,
        clientName: selected.name,
        clientPhone: selected.phone,
        siteLocation: selected.address || prev.siteLocation
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

  const handleToggleChecklist = (index) => {
    const updated = [...formData.checklist];
    updated[index].done = !updated[index].done;
    setFormData({ ...formData, checklist: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.clientName.trim()) return;

    const cVal = Math.max(0, Number(formData.contractValue) || 0);
    const dPaid = Math.max(0, Number(formData.depositPaid) || 0);
    const payload = {
      ...formData,
      contractValue: cVal,
      depositPaid: dPaid
    };

    if (isEditing) {
      await editItem('projects', existing.id, payload);
    } else {
      await addItem('projects', payload);
    }
    setModalConfig({ type: null });
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={isEditing ? `Edit Interior Project (${formData.projectCode})` : 'New Interior Design Project'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label>Project Code</label>
          <input
            type="text"
            required
            className="form-input"
            value={formData.projectCode}
            onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Link Existing Client</label>
          <select
            className="form-select"
            value={formData.clientId}
            onChange={(e) => handleClientSelect(e.target.value)}
          >
            <option value="">-- Select Client or type below --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group form-full">
          <label>Project Title / Description *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Masaki Luxury Penthouse Full Interior & Custom Joinery"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <ImageUploader
          value={formData.imageUrl}
          onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
          label="3D Concept Render / Moodboard Photo (Optional)"
        />

        <div className="form-group">
          <label>Client Contact Person *</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Dr. Amani Mushi"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Client Phone</label>
          <input
            type="tel"
            className="form-input"
            placeholder="e.g. +255 784 990 011"
            value={formData.clientPhone}
            onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
          />
        </div>

        <div className="form-group form-full">
          <label>Site Location / Physical Site Address</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Oysterbay Villa 12, Ocean View Drive, Dar es Salaam"
            value={formData.siteLocation}
            onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Spaces & Rooms Involved</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Living Room, Dining Room, Master Bedroom, Balcony"
            value={formData.rooms}
            onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Interior Design Style Theme</label>
          <select
            className="form-select"
            value={formData.designStyle}
            onChange={(e) => setFormData({ ...formData, designStyle: e.target.value })}
          >
            <option value="Modern Luxury / Warm Minimalist">Modern Luxury & Warm Minimalist</option>
            <option value="Contemporary African Luxury">Contemporary African Luxury (Rich Woods & Textures)</option>
            <option value="Classic European Elegance">Classic European & Moldings</option>
            <option value="Japandi / Wabi-Sabi">Japandi (Japanese & Scandinavian)</option>
            <option value="Industrial Chic / Loft">Industrial Chic & Fluted Glass</option>
            <option value="Boho Coastal Villa">Boho Coastal & Natural Rattan</option>
          </select>
        </div>

        <div className="form-group">
          <label>Contract Value / Budget</label>
          <input
            type="number"
            min="0"
            className="form-input"
            placeholder="0"
            value={formData.contractValue ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const clean = e.target.value === '' ? '' : e.target.value.replace(/^0+(?=\d)/, '');
              setFormData({ ...formData, contractValue: clean });
            }}
          />
        </div>

        <div className="form-group">
          <label>Deposit Paid</label>
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

        <div className="form-group">
          <label>Current Project Stage</label>
          <select
            className="form-select"
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
          >
            <option value="consultation">1. Initial Site Consultation & Briefing</option>
            <option value="moodboard">2. Moodboard & Spatial Concept</option>
            <option value="3d_approval">3. 3D Renders & Material Approval</option>
            <option value="procurement">4. Procurement & Workshop Carpentry</option>
            <option value="site_fitout">5. Site Installation & Fit-out</option>
            <option value="completed">6. Handover Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="form-group">
          <label>Target Handover Date</label>
          <input
            type="date"
            className="form-input"
            value={formData.targetHandoverDate}
            onChange={(e) => setFormData({ ...formData, targetHandoverDate: e.target.value })}
          />
        </div>

        <div className="form-group form-full">
          <label>Scope of Work & Client Specific Requirements</label>
          <textarea
            className="form-textarea"
            placeholder="e.g. Custom fluted acoustic wall paneling, recessed warm LED lighting, engineered hardwood floor fitting, bespoke sectional sofa..."
            value={formData.scopeDescription}
            onChange={(e) => setFormData({ ...formData, scopeDescription: e.target.value })}
          />
        </div>

        {/* Milestone Checklist */}
        <div className="form-group form-full">
          <label>Project Execution Milestones</label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '14px'
            }}
          >
            {formData.checklist.map((item, idx) => (
              <label
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  color: item.done ? '#10b981' : 'var(--text-main)'
                }}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => handleToggleChecklist(idx)}
                />
                <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.text}
                </span>
              </label>
            ))}
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
            {isEditing ? 'Save Changes' : 'Create Interior Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
