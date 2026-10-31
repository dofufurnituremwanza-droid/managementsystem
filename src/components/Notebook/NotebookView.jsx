import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../Common/EmptyState';
import {
  BookOpen,
  Search,
  Plus,
  Pin,
  Clock,
  Calendar,
  CheckSquare,
  Edit2,
  Trash2,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export const NotebookView = () => {
  const { notes, setModalConfig, removeItem, editItem } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);

  // Filter notes
  const filtered = notes.filter((n) => {
    const matchSearch =
      (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.checklist || []).some((item) =>
        (item.text || '').toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchCategory = categoryFilter === 'all' || n.category === categoryFilter;
    const matchPinned = !pinnedOnly || n.isPinned;
    return matchSearch && matchCategory && matchPinned;
  });

  // Sort pinned first, then newest
  const sortedNotes = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });

  const pinnedNotes = sortedNotes.filter((n) => n.isPinned);
  const otherNotes = sortedNotes.filter((n) => !n.isPinned);

  const handleTogglePin = async (note) => {
    await editItem('notes', note.id, { isPinned: !note.isPinned });
  };

  const handleToggleChecklistItem = async (note, itemId) => {
    const updatedChecklist = (note.checklist || []).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    await editItem('notes', note.id, { checklist: updatedChecklist });
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete note "${title}"?`)) {
      removeItem('notes', id);
    }
  };

  // Metrics
  const remindersCount = notes.filter((n) => n.reminderDate).length;
  const highPriorityCount = notes.filter((n) => n.priority === 'high').length;

  const renderNoteCard = (note) => {
    const checklist = note.checklist || [];
    const doneTasks = checklist.filter((c) => c.done).length;

    const priorityColor =
      note.priority === 'high'
        ? '#ef4444'
        : note.priority === 'medium'
        ? '#f59e0b'
        : 'var(--border-subtle)';

    return (
      <div
        key={note.id}
        className="card"
        style={{
          borderTop: `3px solid ${note.priority === 'high' ? '#ef4444' : note.isPinned ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '20px',
          boxShadow: note.isPinned ? '0 8px 30px rgba(197, 160, 89, 0.12)' : 'none',
          borderColor: note.isPinned ? 'rgba(197, 160, 89, 0.4)' : undefined
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span
            className="badge"
            style={{
              fontSize: '0.7rem',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--gold-light)'
            }}
          >
            {note.category || 'Memo'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {note.priority === 'high' && (
              <span
                className="badge badge-unpaid"
                style={{ fontSize: '0.65rem', padding: '2px 6px' }}
              >
                Urgent
              </span>
            )}
            <button
              onClick={() => handleTogglePin(note)}
              style={{
                background: 'transparent',
                border: 'none',
                color: note.isPinned ? 'var(--gold-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
              title={note.isPinned ? 'Unpin Note' : 'Pin Note to Top'}
            >
              <Pin size={15} style={{ transform: note.isPinned ? 'rotate(45deg)' : 'none' }} />
            </button>
          </div>
        </div>

        {/* Note Title */}
        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.15rem',
            color: '#fff',
            marginBottom: '8px',
            lineHeight: 1.3
          }}
        >
          {note.title}
        </h3>

        {/* Reminder date badge if present */}
        {note.reminderDate && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
              padding: '3px 8px',
              borderRadius: '6px',
              marginBottom: '12px',
              alignSelf: 'flex-start'
            }}
          >
            <Clock size={12} />
            <span>
              Reminder: {note.reminderDate} {note.reminderTime ? `@ ${note.reminderTime}` : ''}
            </span>
          </div>
        )}

        {/* Note Content Text */}
        {note.content && (
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
              marginBottom: '14px',
              flex: 1
            }}
          >
            {note.content}
          </p>
        )}

        {/* Interactive Checklist if present */}
        {checklist.length > 0 && (
          <div
            style={{
              marginTop: 'auto',
              marginBottom: '14px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginBottom: '6px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              <span>Checklist</span>
              <span>
                {doneTasks}/{checklist.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {checklist.map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    color: item.done ? 'var(--text-muted)' : '#fff'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggleChecklistItem(note, item.id)}
                  />
                  <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Footer info & Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            marginTop: 'auto'
          }}
        >
          <span>
            {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Today'}
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="btn-secondary btn-sm"
              title="Edit Note"
              style={{ padding: '4px 8px' }}
              onClick={() => setModalConfig({ type: 'edit_note', data: note })}
            >
              <Edit2 size={13} />
            </button>
            <button
              className="btn-danger btn-sm"
              title="Delete Note"
              style={{ padding: '4px 8px' }}
              onClick={() => handleDelete(note.id, note.title)}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Top Metrics Banner */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Notes in Notebook</div>
            <div className="stat-value">{notes.length}</div>
            <div className="stat-note">Digital thoughts & memos</div>
          </div>
          <div className="stat-icon-wrap">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Scheduled Reminders</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>
              {remindersCount}
            </div>
            <div className="stat-note">Calls, follow-ups & deadlines</div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Urgent / High Priority</div>
            <div className="stat-value" style={{ color: highPriorityCount > 0 ? '#ef4444' : '#10b981' }}>
              {highPriorityCount}
            </div>
            <div className="stat-note">Items needing prompt attention</div>
          </div>
          <div
            className="stat-icon-wrap"
            style={{
              background: highPriorityCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: highPriorityCount > 0 ? '#ef4444' : '#10b981'
            }}
          >
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search notebook by title, task, measurements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Urgent Reminder">⏰ Urgent Reminders</option>
            <option value="Client Follow-up">📞 Client Follow-ups</option>
            <option value="Workshop & Carpentry">🪑 Workshop & Carpentry</option>
            <option value="Supplier & Timber Pricing">🪵 Supplier & Timber Pricing</option>
            <option value="Site Measurements Memo">📐 Site Measurements</option>
            <option value="Design Ideas & Inspiration">✨ Design Ideas</option>
          </select>

          <button
            type="button"
            className={`btn btn-sm ${pinnedOnly ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPinnedOnly(!pinnedOnly)}
          >
            <Pin size={14} style={{ transform: pinnedOnly ? 'rotate(45deg)' : 'none' }} />
            <span>{pinnedOnly ? 'Pinned Only' : 'Filter Pinned'}</span>
          </button>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setModalConfig({ type: 'new_note' })}
        >
          <Plus size={16} />
          <span>Write in Notebook</span>
        </button>
      </div>

      {/* Zero State */}
      {notes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="DOFU's Personal Notebook is Empty"
          description="Never forget a measurement, timber sawmill price, client call-back, or workshop idea. Write it down here and pin your most urgent reminders!"
          actionLabel="Write First Note"
          onAction={() => setModalConfig({ type: 'new_note' })}
        />
      ) : sortedNotes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No notes matched your search query.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Pinned Section */}
          {pinnedNotes.length > 0 && !pinnedOnly && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '14px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--gold-light)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                <Pin size={14} style={{ transform: 'rotate(45deg)' }} />
                <span>Pinned & Important Notes</span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px'
                }}
              >
                {pinnedNotes.map((note) => renderNoteCard(note))}
              </div>
            </div>
          )}

          {/* All / Other Notes Section */}
          {(!pinnedOnly || pinnedNotes.length === 0) && otherNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <div
                  style={{
                    marginBottom: '14px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}
                >
                  All Notebook Entries
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px'
                }}
              >
                {otherNotes.map((note) => renderNoteCard(note))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
