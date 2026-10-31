import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SquarePen,
  Search,
  Pin,
  Trash2,
  CheckSquare,
  Clock,
  Check,
  ChevronRight,
  BookOpen
} from 'lucide-react';

export const NotebookView = () => {
  const { notes, addItem, editItem, removeItem } = useApp();
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local active note state for fluid 60fps typing without lag
  const [activeTitle, setActiveTitle] = useState('');
  const [activeContent, setActiveContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimerRef = useRef(null);

  // Filter notes by search
  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      (n.title || '').toLowerCase().includes(q) ||
      (n.content || '').toLowerCase().includes(q)
    );
  });

  // Sort notes: pinned first, then by last updated
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Auto-select first note if none selected or if active note was deleted
  useEffect(() => {
    if (sortedNotes.length > 0) {
      if (!selectedNoteId || !notes.some((n) => n.id === selectedNoteId)) {
        setSelectedNoteId(sortedNotes[0].id);
      }
    } else {
      setSelectedNoteId(null);
    }
  }, [notes, selectedNoteId]);

  // Synchronize active editor fields when selected note changes
  useEffect(() => {
    if (selectedNoteId) {
      const current = notes.find((n) => n.id === selectedNoteId);
      if (current) {
        setActiveTitle(current.title || '');
        setActiveContent(current.content || '');
      }
    } else {
      setActiveTitle('');
      setActiveContent('');
    }
  }, [selectedNoteId]);

  // Handle typing with debounced cloud auto-save
  const handleContentChange = (newTitle, newContent) => {
    setActiveTitle(newTitle);
    setActiveContent(newContent);
    setIsSaving(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!selectedNoteId) return;
      await editItem('notes', selectedNoteId, {
        title: newTitle,
        content: newContent,
        updatedAt: new Date().toISOString()
      });
      setIsSaving(false);
    }, 400);
  };

  // Create a new blank note immediately like iPhone Notes
  const handleCreateNewNote = async () => {
    const newNote = await addItem('notes', {
      title: '',
      content: '',
      isPinned: false,
      checklist: []
    });
    setSelectedNoteId(newNote.id);
  };

  // Delete current note
  const handleDeleteNote = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Delete this note?')) {
      await removeItem('notes', id);
      if (selectedNoteId === id) {
        const remaining = notes.filter((n) => n.id !== id);
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  // Toggle Pin status
  const handleTogglePin = async (e) => {
    e.stopPropagation();
    const current = notes.find((n) => n.id === selectedNoteId);
    if (!current) return;
    await editItem('notes', selectedNoteId, {
      isPinned: !current.isPinned
    });
  };

  // Insert checklist marker at cursor / new line
  const handleInsertChecklist = () => {
    const checklistMarker = '\n☐ ';
    const updated = activeContent ? `${activeContent}${checklistMarker}` : '☐ ';
    handleContentChange(activeTitle, updated);
  };

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  // Format date for list view (iPhone notes style)
  const formatListDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Full header date format (e.g. October 31, 2026 at 10:55 AM)
  const formatHeaderDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return (
      date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }) +
      ' at ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 130px)',
        minHeight: '580px',
        background: '#12151b',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
      }}
    >
      {/* ========================================================
          LEFT PANE: IPHONE-STYLE NOTES LIST
         ======================================================== */}
      <div
        style={{
          width: '320px',
          minWidth: '280px',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#161922',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Toolbar */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#fff',
                fontFamily: 'var(--font-sans)',
                margin: 0
              }}
            >
              Notes
            </h2>
            <span style={{ fontSize: '0.74rem', color: '#8e96a4' }}>
              {notes.length} {notes.length === 1 ? 'Note' : 'Notes'}
            </span>
          </div>

          <button
            onClick={handleCreateNewNote}
            className="btn btn-primary btn-sm"
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Create New Note (iPhone Style)"
          >
            <SquarePen size={15} />
            <span>New Note</span>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }}
            />
            <input
              type="text"
              placeholder="Search Notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '7px 10px 7px 32px',
                color: '#fff',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Notes Scrollable List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {notes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6b7280' }}>
              <BookOpen size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
              <p style={{ fontSize: '0.84rem', margin: 0 }}>No Notes</p>
              <p style={{ fontSize: '0.74rem', margin: '4px 0 0' }}>Click "New Note" to begin writing.</p>
            </div>
          ) : sortedNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 14px', color: '#6b7280', fontSize: '0.82rem' }}>
              No notes match your search.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {sortedNotes.map((note) => {
                const isSelected = note.id === selectedNoteId;
                const snippet = (note.content || '').replace(/\n/g, ' ').slice(0, 60);

                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(197, 160, 89, 0.18)'
                        : 'transparent',
                      border: isSelected
                        ? '1px solid rgba(197, 160, 89, 0.35)'
                        : '1px solid transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: isSelected ? 'var(--gold-light)' : '#fff',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '200px'
                        }}
                      >
                        {note.title.trim() || 'New Note'}
                      </span>

                      {note.isPinned && (
                        <Pin size={12} color="var(--gold-primary)" style={{ transform: 'rotate(45deg)', flexShrink: 0 }} />
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                      <span style={{ color: isSelected ? '#fff' : '#94a3b8', fontWeight: 600, flexShrink: 0 }}>
                        {formatListDate(note.updatedAt || note.createdAt)}
                      </span>
                      <span
                        style={{
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {snippet || 'No additional text'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          RIGHT PANE: APPLE NOTES PAPER EDITOR
         ======================================================== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#0f1217',
          position: 'relative'
        }}
      >
        {selectedNote ? (
          <>
            {/* Top Action Toolbar */}
            <div
              style={{
                height: '52px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                background: 'rgba(18, 22, 30, 0.6)'
              }}
            >
              {/* Auto-save status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check size={13} color="#10b981" />
                    <span>Saved to Cloud</span>
                  </>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleInsertChecklist}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                  title="Insert Checklist bullet"
                >
                  <CheckSquare size={14} color="var(--gold-primary)" />
                  <span>Checklist</span>
                </button>

                <button
                  onClick={handleTogglePin}
                  className={`btn btn-sm ${selectedNote.isPinned ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 10px' }}
                  title={selectedNote.isPinned ? 'Unpin Note' : 'Pin Note'}
                >
                  <Pin size={14} style={{ transform: selectedNote.isPinned ? 'rotate(45deg)' : 'none' }} />
                  <span>{selectedNote.isPinned ? 'Pinned' : 'Pin'}</span>
                </button>

                <button
                  onClick={(e) => handleDeleteNote(selectedNote.id, e)}
                  className="btn btn-danger btn-sm"
                  style={{ padding: '6px 10px' }}
                  title="Delete Note"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Note Writing Surface */}
            <div
              style={{
                flex: 1,
                padding: '28px 36px',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
              }}
            >
              {/* Date stamp */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '0.74rem',
                  color: '#64748b',
                  marginBottom: '16px',
                  fontWeight: 500
                }}
              >
                {formatHeaderDate(selectedNote.updatedAt || selectedNote.createdAt)}
              </div>

              {/* Note Title Input */}
              <input
                type="text"
                placeholder="Title"
                value={activeTitle}
                onChange={(e) => handleContentChange(e.target.value, activeContent)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#fff',
                  fontFamily: 'var(--font-sans)',
                  marginBottom: '14px',
                  lineHeight: 1.2
                }}
              />

              {/* Note Body Textarea */}
              <textarea
                placeholder="Start typing your note, reminders, client measurements, or ideas..."
                value={activeContent}
                onChange={(e) => handleContentChange(activeTitle, e.target.value)}
                style={{
                  width: '100%',
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#d1d5db',
                  fontSize: '0.98rem',
                  lineHeight: 1.7,
                  fontFamily: 'inherit',
                  resize: 'none',
                  minHeight: '300px'
                }}
              />
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
              padding: '24px'
            }}
          >
            <BookOpen size={48} style={{ opacity: 0.25, marginBottom: '14px' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
              No Note Selected
            </p>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginBottom: '20px' }}>
              Choose a note from the left list or create a fresh one.
            </p>
            <button onClick={handleCreateNewNote} className="btn btn-primary">
              <SquarePen size={16} />
              <span>Create New Note</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
