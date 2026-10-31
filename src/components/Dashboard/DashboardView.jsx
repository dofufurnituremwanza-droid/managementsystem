import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Armchair,
  Compass,
  FileText,
  Users,
  DollarSign,
  Boxes,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Database,
  BookOpen,
  Pin
} from 'lucide-react';

export const DashboardView = () => {
  const {
    clients,
    orders,
    projects,
    invoices,
    expenses,
    notes,
    setActiveTab,
    setModalConfig,
    formatMoney,
    firebaseState
  } = useApp();

  // Financial calculations
  const totalInvoiced = invoices
    .filter((i) => i.type !== 'quotation')
    .reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0);

  const totalCollected = invoices
    .filter((i) => i.type !== 'quotation')
    .reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0);

  const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netOperatingProfit = totalCollected - totalExpenses;

  // Operational metrics
  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );

  const activeProjects = projects.filter(
    (p) => p.stage !== 'completed' && p.stage !== 'cancelled'
  );

  const isBrandNewSystem =
    clients.length === 0 &&
    orders.length === 0 &&
    projects.length === 0 &&
    invoices.length === 0;

  return (
    <div>
      {/* Top Financial & Operational Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Collected Revenue</div>
            <div className="stat-value" style={{ color: '#10b981' }}>
              {formatMoney(totalCollected)}
            </div>
            <div className="stat-note">
              <TrendingUp size={13} color="#10b981" />
              <span>Realized client payments</span>
            </div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
            <DollarSign size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Receivables Outstanding</div>
            <div className="stat-value" style={{ color: totalOutstanding > 0 ? '#f59e0b' : '#fff' }}>
              {formatMoney(totalOutstanding)}
            </div>
            <div className="stat-note">
              <span>Client deposit & handover balances</span>
            </div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
            <FileText size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Active Workshop Orders</div>
            <div className="stat-value">{activeOrders.length}</div>
            <div className="stat-note">
              <span>Furniture pieces in production</span>
            </div>
          </div>
          <div className="stat-icon-wrap">
            <Armchair size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Active Interior Projects</div>
            <div className="stat-value">{activeProjects.length}</div>
            <div className="stat-note">
              <span>Sites currently undergoing fit-out</span>
            </div>
          </div>
          <div className="stat-icon-wrap">
            <Compass size={22} />
          </div>
        </div>
      </div>

      {/* Onboarding Guide if brand new system with zero data */}
      {isBrandNewSystem && (
        <div
          className="card card-gold-accent"
          style={{
            marginBottom: '32px',
            background: 'linear-gradient(135deg, rgba(22, 26, 34, 0.95) 0%, rgba(32, 26, 18, 0.8) 100%)',
            padding: '30px'
          }}
        >
          <div style={{ maxWidth: '780px' }}>
            <span
              style={{
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--gold-primary)',
                fontWeight: 700
              }}
            >
              WELCOME TO DOFU DIGITAL MANAGEMENT SYSTEM
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.6rem',
                color: '#fff',
                margin: '8px 0 12px'
              }}
            >
              Replace Paper Notebooks & Misplaced Receipts Forever
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '22px' }}>
              Your system starts completely clean with zero sample data so you can begin entering real client details,
              recording wood specifications, scheduling carpentry deadlines, and generating luxury quotations immediately.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                marginBottom: '20px'
              }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--gold-light)', fontSize: '0.9rem' }}>
                  1. Register Clients
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
                  Save phone numbers, site addresses & taste preferences.
                </p>
                <button
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => setModalConfig({ type: 'new_client' })}
                >
                  <Plus size={13} /> Add Client
                </button>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--gold-light)', fontSize: '0.9rem' }}>
                  2. Furniture Order
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
                  Specify timber, dimensions, fabric & print workshop job cards.
                </p>
                <button
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => setModalConfig({ type: 'new_order' })}
                >
                  <Plus size={13} /> New Order
                </button>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--gold-light)', fontSize: '0.9rem' }}>
                  3. Interior Project
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
                  Track 3D approvals, site fit-out & room-by-room checklists.
                </p>
                <button
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => setModalConfig({ type: 'new_project' })}
                >
                  <Plus size={13} /> New Project
                </button>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--gold-light)', fontSize: '0.9rem' }}>
                  4. Quotes & Invoices
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
                  Generate professional branded PDFs with bank Lipa details.
                </p>
                <button
                  className="btn btn-outline-gold btn-sm"
                  onClick={() => setModalConfig({ type: 'new_invoice' })}
                >
                  <Plus size={13} /> New Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOFU's Reminders & Urgent Notes Widget */}
      {notes.length > 0 && (
        <div
          className="card card-gold-accent"
          style={{
            marginBottom: '26px',
            padding: '18px 24px',
            background: 'linear-gradient(90deg, rgba(22, 26, 34, 0.95) 0%, rgba(32, 26, 18, 0.9) 100%)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Pin size={18} color="var(--gold-primary)" style={{ transform: 'rotate(45deg)' }} />
              <div>
                <h4 style={{ color: '#fff', fontSize: '1.05rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
                  DOFU's Reminders & Pinned Notes
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Active personal memos, measurements & follow-ups
                </p>
              </div>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab('notebook')}
            >
              <span>Open Notebook</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px'
            }}
          >
            {notes
              .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
              .slice(0, 3)
              .map((note) => (
                <div
                  key={note.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    borderLeft: `3px solid ${note.priority === 'high' ? '#ef4444' : 'var(--gold-primary)'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gold-light)', fontWeight: 600 }}>
                      {note.category}
                    </span>
                    {note.reminderDate && (
                      <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>
                        ⏰ {note.reminderDate}
                      </span>
                    )}
                  </div>
                  <strong style={{ color: '#fff', fontSize: '0.88rem', display: 'block', marginBottom: '4px' }}>
                    {note.title}
                  </strong>
                  {note.content && (
                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {note.content}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Main Split: Left Workshop Orders | Right Projects & Billing */}
      <div className="dashboard-split-grid">
        {/* Workshop Production Card */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px'
            }}
          >
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#fff' }}>
                Workshop Production Pipeline
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Active furniture orders across carpentry & upholstery
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('orders')}>
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {activeOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <Armchair size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.86rem' }}>No active furniture pieces currently in the workshop.</p>
              <button
                className="btn btn-outline-gold btn-sm"
                style={{ marginTop: '12px' }}
                onClick={() => setModalConfig({ type: 'new_order' })}
              >
                <Plus size={14} /> Add First Furniture Order
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>
                      {order.itemName}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Client: {order.clientName} | 🪵 {order.woodType || 'Hardwood'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${order.status}`}>{order.status}</span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Due: {order.dueDate || 'No date'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interior Design Projects Card */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px'
            }}
          >
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#fff' }}>
                Interior Design Projects
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Active residential & commercial styling sites
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('projects')}>
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {activeProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <Compass size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.86rem' }}>No interior design contracts currently active.</p>
              <button
                className="btn btn-outline-gold btn-sm"
                style={{ marginTop: '12px' }}
                onClick={() => setModalConfig({ type: 'new_project' })}
              >
                <Plus size={14} /> Start First Interior Project
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeProjects.slice(0, 5).map((project) => {
                const checklist = project.checklist || [];
                const doneCount = checklist.filter((c) => c.done).length;
                const progressPct =
                  checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

                return (
                  <div
                    key={project.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#fff', fontSize: '0.88rem' }}>{project.title}</strong>
                      <span className="badge badge-draft">{project.stage}</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Client: {project.clientName} | {project.rooms || 'Rooms'}
                    </div>
                    {/* Mini progress */}
                    <div
                      style={{
                        height: '4px',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: '100%',
                          background: 'var(--gold-primary)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
