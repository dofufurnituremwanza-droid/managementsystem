import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../Common/EmptyState';
import {
  Compass,
  Search,
  Plus,
  MapPin,
  Calendar,
  CheckCircle2,
  FileText,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  X
} from 'lucide-react';

const STAGE_LABELS = {
  consultation: { label: '1. Site Briefing', color: 'badge-draft' },
  moodboard: { label: '2. Moodboard', color: 'badge-carpentry' },
  '3d_approval': { label: '3. 3D & Specs Approved', color: 'badge-upholstery' },
  procurement: { label: '4. Workshop Production', color: 'badge-ready' },
  site_fitout: { label: '5. Site Installation', color: 'badge-partial' },
  completed: { label: '6. Handover Complete', color: 'badge-delivered' },
  cancelled: { label: 'Cancelled', color: 'badge-cancelled' }
};

export const ProjectsList = () => {
  const { projects, setModalConfig, removeItem, editItem, formatMoney } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [previewImage, setPreviewImage] = useState(null);

  const filtered = projects.filter((p) => {
    const matchSearch =
      (p.projectCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.rooms || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.siteLocation || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchStage = stageFilter === 'all' || p.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete interior project "${title}"?`)) {
      removeItem('projects', id);
    }
  };

  const handleStageChange = async (id, stage) => {
    await editItem('projects', id, { stage });
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Project code, Title, Client, Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="all">All Interior Stages</option>
            <option value="consultation">Site Consultation</option>
            <option value="moodboard">Moodboard Phase</option>
            <option value="3d_approval">3D Approval</option>
            <option value="procurement">Workshop & Procurement</option>
            <option value="site_fitout">Site Fit-out / Installation</option>
            <option value="completed">Completed Handover</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setModalConfig({ type: 'new_project' })}
        >
          <Plus size={16} />
          <span>New Interior Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No Interior Design Projects"
          description="Keep moodboard milestones, client room specifications, site locations, and execution budgets tracked digitally instead of scattered notes."
          actionLabel="Start New Project"
          onAction={() => setModalConfig({ type: 'new_project' })}
        />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No projects matched your criteria.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((project) => {
            const checklist = project.checklist || [];
            const doneCount = checklist.filter((c) => c.done).length;
            const progressPct =
              checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;
            const balance =
              (Number(project.contractValue) || 0) - (Number(project.depositPaid) || 0);

            const stageInfo = STAGE_LABELS[project.stage] || {
              label: project.stage,
              color: 'badge-draft'
            };

            return (
              <div key={project.id} className="card card-gold-accent" style={{ position: 'relative' }}>
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      color: 'var(--gold-light)',
                      background: 'rgba(197, 160, 89, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {project.projectCode}
                  </span>

                  <select
                    className={`badge ${stageInfo.color}`}
                    style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
                    value={project.stage}
                    onChange={(e) => handleStageChange(project.id, e.target.value)}
                  >
                    <option value="consultation">1. Briefing</option>
                    <option value="moodboard">2. Moodboard</option>
                    <option value="3d_approval">3. 3D Approved</option>
                    <option value="procurement">4. Procurement</option>
                    <option value="site_fitout">5. Installation</option>
                    <option value="completed">6. Handover</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* 3D Concept Render / Moodboard Image */}
                {project.imageUrl && (
                  <div
                    onClick={() => setPreviewImage({ url: project.imageUrl, title: project.title })}
                    style={{
                      height: '140px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      border: '1px solid var(--border-gold-card)',
                      background: '#090b0e'
                    }}
                    title="Click to zoom 3D concept photo"
                  >
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Project Title */}
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.15rem',
                    color: '#fff',
                    marginBottom: '6px',
                    lineHeight: 1.3
                  }}
                >
                  {project.title}
                </h3>

                {/* Client & Location */}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{project.clientName}</span>
                    {project.clientPhone && (
                      <span style={{ color: 'var(--text-muted)' }}>({project.clientPhone})</span>
                    )}
                  </div>
                  {project.siteLocation && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: 'var(--text-muted)',
                        fontSize: '0.76rem'
                      }}
                    >
                      <MapPin size={12} color="var(--wood-warm)" />
                      <span>{project.siteLocation}</span>
                    </div>
                  )}
                </div>

                {/* Rooms and Style tag */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {project.rooms && (
                    <span
                      className="badge"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#d1d5db' }}
                    >
                      🚪 {project.rooms}
                    </span>
                  )}
                  {project.designStyle && (
                    <span
                      className="badge"
                      style={{ background: 'rgba(197, 160, 89, 0.08)', color: 'var(--gold-light)' }}
                    >
                      ✨ {project.designStyle}
                    </span>
                  )}
                </div>

                {/* Milestone Progress Bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '6px'
                    }}
                  >
                    <span>Execution Milestones</span>
                    <span style={{ fontWeight: 600, color: progressPct === 100 ? '#10b981' : '#fff' }}>
                      {doneCount}/{checklist.length} ({progressPct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPct}%`,
                        height: '100%',
                        background:
                          progressPct === 100
                            ? '#10b981'
                            : 'linear-gradient(90deg, #c5a059, #e5c07b)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Financial overview row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(15, 18, 25, 0.6)',
                    marginBottom: '16px',
                    fontSize: '0.82rem'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>
                      CONTRACT VALUE
                    </span>
                    <strong style={{ color: '#fff' }}>
                      {formatMoney(project.contractValue)}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>
                      BALANCE DUE
                    </span>
                    <strong style={{ color: balance <= 0 ? '#10b981' : '#f59e0b' }}>
                      {balance <= 0 ? 'Fully Paid' : formatMoney(balance)}
                    </strong>
                  </div>
                </div>

                {/* Actions row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)'
                  }}
                >
                  <button
                    className="btn btn-outline-gold btn-sm"
                    onClick={() =>
                      setModalConfig({
                        type: 'new_invoice',
                        data: {
                          clientId: project.clientId,
                          clientName: project.clientName,
                          clientPhone: project.clientPhone,
                          items: [
                            {
                              description: `Interior Design Execution - ${project.title} (${project.projectCode})`,
                              quantity: 1,
                              unitPrice: project.contractValue
                            }
                          ],
                          depositPaid: project.depositPaid || 0
                        }
                      })
                    }
                  >
                    <FileText size={13} />
                    <span>Create Invoice</span>
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn-secondary btn-sm"
                      title="Edit Project"
                      onClick={() => setModalConfig({ type: 'edit_project', data: project })}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      title="Delete Project"
                      onClick={() => handleDelete(project.id, project.title)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3D Concept Render Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid var(--border-gold-card)',
              background: '#090b0e',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(15, 18, 24, 0.95)'
              }}
            >
              <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.94rem' }}>
                {previewImage.title || '3D Render / Concept'}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewImage(null)}
                style={{ padding: '6px' }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '75vh',
                overflow: 'auto'
              }}
            >
              <img
                src={previewImage.url}
                alt={previewImage.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
