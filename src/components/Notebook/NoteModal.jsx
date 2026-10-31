import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import { Pin, Calendar, Clock, Plus, Trash2, CheckSquare } from 'lucide-react';

export const NoteModal = () => {
  const { modalConfig, setModalConfig, addItem, editItem } = useApp();
  const isEditing = Boolean(modalConfig.data?.id);
  const existing = modalConfig.data || {};

  const [formData, setFormData] = useState({
    title: '',
    category: 'Urgent Reminder',
    priority: 'high', // high, medium, normal
    isPinned: false,
    reminderDate: '',
    reminderTime: '',
    content: '',
    checklist: []
  });

  const [newChecklistText, setNewChecklistText] = useState('');

  useEffect(() => {
    if (modalConfig.data) {
      setFormData({
        title: existing.title || '',
        category: existing.category || 'Urgent Reminder',
        priority: existing.priority || 'high',
        isPinned: Boolean(existing.isPinned),
        reminderDate: existing.reminderDate || '',
        reminderTime: existing.reminderTime || '',
        content: existing.content || '',
        checklist: existing.checklist || []
      });
    } else {
      setFormData({
        title: '',
        category: 'Urgent Reminder',
        priority: 'high',
        isPinned: false,
        reminderDate: new Date().toISOString().split('T')[0],
        reminderTime: '14:00',
        content: '',
        checklist: []
      });
    }
    setNewChecklistText('');
  }, [modalConfig]);

  if (modalConfig.type !== 'new_note' && modalConfig.type !== 'edit_note') {
    return null;
  }

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setFormData((prev) => ({
      ...prev,
      checklist: [...prev.checklist, { id: Date.now(), text: newChecklistText.trim(), done: false }]
    }));
    setNewChecklistText('');
  };

  const handleToggleChecklist = (id) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      )
    }));
  };

  const handleRemoveChecklistItem = (id) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== id)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() && !formData.content.trim()) return;

    const payload = {
      ...formData,
      title: formData.title.trim() || 'Untitled Note'
    };

    if (isEditing) {
      await editItem('notes', existing.id, payload);
    } else {
      await addItem('notes', payload);
    }
    setModalConfig({ type: null });
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setModalConfig({ type: null })}
      title={isEditing ? 'Edit DOFU Note / Reminder' : 'Write in DOFU Personal Notebook'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="form-grid">
        {/* Title */}
        <div className="form-group form-full">
          <label>Note Title / Reminder Headline *</label>
          <input
            type="text"
            required
            autoFocus
            className="form-input"
            placeholder="e.g. Call Timber Mill about Seasoned Mvule boards before 3pm"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{ fontSize: '1rem', fontWeight: 600 }}
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label>Note Category</label>
          <select
            className="form-select"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option value="Urgent Reminder">⏰ Urgent Reminder</option>
            <option value="Client Follow-up">📞 Client Follow-up</option>
            <option value="Workshop & Carpentry">🪑 Workshop & Carpentry</option>
            <option value="Supplier & Timber Pricing">🪵 Supplier & Timber Pricing</option>
            <option value="Site Measurements Memo">📐 Site Measurements Memo</option>
            <option value="Design Ideas & Sketches">✨ Design Ideas & Inspiration</option>
            <option value="General DOFU Memo">📝 General DOFU Memo</option>
          </select>
        </div>

        {/* Priority & Pinning */}
        <div className="form-group">
          <label>Priority Level</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="form-select"
              style={{ flex: 1 }}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="high">🔴 High / Urgent</option>
              <option value="medium">🟡 Medium / Important</option>
              <option value="normal">⚪ Normal</option>
            </select>

            <button
              type="button"
              className={`btn btn-sm ${formData.isPinned ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
              title="Pin to top of notebook"
            >
              <Pin size={15} style={{ transform: formData.isPinned ? 'rotate(45deg)' : 'none' }} />
              <span>{formData.isPinned ? 'Pinned' : 'Pin'}</span>
            </button>
          </div>
        </div>

        {/* Due / Reminder Date */}
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} color="var(--gold-primary)" />
            <span>Reminder Date (Optional)</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={formData.reminderDate}
            onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
          />
        </div>

        {/* Reminder Time */}
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} color="var(--gold-primary)" />
            <span>Reminder Time</span>
          </label>
          <input
            type="time"
            className="form-input"
            value={formData.reminderTime}
            onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
          />
        </div>

        {/* Detailed Note Content */}
        <div className="form-group form-full">
          <label>Detailed Notes & Thoughts</label>
          <textarea
            className="form-textarea"
            placeholder="Write down any measurements, prices, phone numbers, artisan instructions, or thoughts you don't want to forget..."
            style={{ minHeight: '120px', lineHeight: 1.6 }}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
        </div>

        {/* Optional To-Do Checklist */}
        <div className="form-group form-full">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckSquare size={14} color="var(--gold-primary)" />
            <span>To-Do Checklist Items (Optional)</span>
          </label>

          {/* Add item input */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Confirm 50% deposit with client, order 2 boxes of brass handles..."
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChecklistItem();
                }
              }}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={handleAddChecklistItem}
            >
              <Plus size={14} /> Add Task
            </button>
          </div>

          {/* Checklist list */}
          {formData.checklist.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 14px'
              }}
            >
              {formData.checklist.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 0'
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '0.86rem',
                      color: item.done ? 'var(--text-muted)' : '#fff'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleChecklist(item.id)}
                    />
                    <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>
                      {item.text}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div
          className="form-full"
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setModalConfig({ type: null })}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {isEditing ? 'Save Note' : 'Save to DOFU Notebook'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
