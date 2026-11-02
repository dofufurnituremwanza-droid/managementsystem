import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Armchair,
  Compass,
  FileText,
  Users,
  DollarSign,
  Clock,
  ArrowRight,
  TrendingUp,
  Plus,
  CheckCircle2,
  Pin,
  Receipt
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
    isOwner,
    isAssistant,
    currentUser
  } = useApp();

  // 1. Number of orders recorded
  const totalOrdersCount = orders.length;

  // 2. Paid in full
  const paidInFullOrders = orders.filter((o) => {
    const total = Number(o.totalPrice) || 0;
    const deposit = Number(o.depositPaid) || 0;
    return (total > 0 && deposit >= total) || o.status === 'delivered';
  });
  const paidInFullCount = paidInFullOrders.length;

  // 3. Partial paid
  const partialPaidOrders = orders.filter((o) => {
    const total = Number(o.totalPrice) || 0;
    const deposit = Number(o.depositPaid) || 0;
    return deposit > 0 && deposit < total && o.status !== 'delivered';
  });
  const partialPaidCount = partialPaidOrders.length;

  // 4. Revenue generated from the orders
  const revenueFromOrders = orders.reduce(
    (sum, o) => sum + (Number(o.depositPaid) || 0),
    0
  );

  // 5. Expenses spent
  const totalExpensesSpent = expenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  // Operational pipeline states
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
      {/* Top 5 Metrics: Orders Recorded, Paid in Full, Partial Paid, Revenue Generated, Expenses Spent */}
      {isOwner ? (
        <div className="stats-grid">
          {/* 1. Orders Recorded */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Orders Recorded</div>
              <div className="stat-value">{totalOrdersCount}</div>
              <div className="stat-note">
                <Armchair size={13} color="var(--gold-primary)" />
                <span>Total customer orders</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(197, 160, 89, 0.12)', color: 'var(--gold-primary)' }}>
              <Armchair size={22} />
            </div>
          </div>

          {/* 2. Paid in Full */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Paid in Full</div>
              <div className="stat-value" style={{ color: '#10b981' }}>
                {paidInFullCount}
              </div>
              <div className="stat-note">
                <CheckCircle2 size={13} color="#10b981" />
                <span>100% balance settled</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>

          {/* 3. Partial Paid */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Partial Paid</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>
                {partialPaidCount}
              </div>
              <div className="stat-note">
                <Clock size={13} color="#f59e0b" />
                <span>Advance deposit received</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={22} />
            </div>
          </div>

          {/* 4. Revenue Generated from Orders */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Revenue Generated</div>
              <div className="stat-value" style={{ color: '#10b981' }}>
                {formatMoney(revenueFromOrders)}
              </div>
              <div className="stat-note">
                <TrendingUp size={13} color="#10b981" />
                <span>Realized from orders</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DollarSign size={22} />
            </div>
          </div>

          {/* 5. Expenses Spent */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Expenses Spent</div>
              <div className="stat-value" style={{ color: '#ef4444' }}>
                {formatMoney(totalExpensesSpent)}
              </div>
              <div className="stat-note">
                <Receipt size={13} color="#ef4444" />
                <span>Workshop materials & costs</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Receipt size={22} />
            </div>
          </div>
        </div>
      ) : (
        /* Assistant Operational Stats */
        <div className="stats-grid">
          {/* Orders Recorded */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Orders Recorded</div>
              <div className="stat-value">{totalOrdersCount}</div>
              <div className="stat-note">
                <span>Total orders logged</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(197, 160, 89, 0.12)', color: 'var(--gold-primary)' }}>
              <Armchair size={22} />
            </div>
          </div>

          {/* Paid in Full */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Paid in Full</div>
              <div className="stat-value" style={{ color: '#10b981' }}>{paidInFullCount}</div>
              <div className="stat-note">
                <span>100% balance settled</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>

          {/* Partial Paid */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Partial Paid</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>{partialPaidCount}</div>
              <div className="stat-note">
                <span>Advance deposit received</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={22} />
            </div>
          </div>

          {/* Active in Production */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">In Production</div>
              <div className="stat-value" style={{ color: '#60a5fa' }}>{activeOrders.length}</div>
              <div className="stat-note">
                <span>Currently in workshop</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
              <Users size={22} />
            </div>
          </div>
        </div>
      )}

      {/* Assistant Quick Operational Bar */}
      {isAssistant && (
        <div
          className="card card-gold-accent"
          style={{
            marginBottom: '26px',
            padding: '20px 24px',
            background: 'linear-gradient(135deg, rgba(22, 26, 34, 0.95) 0%, rgba(20, 28, 42, 0.9) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              SALES & ORDERS ASSISTANT DESK
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', color: '#fff', fontSize: '1.25rem', margin: '4px 0 2px' }}>
              Welcome back, {currentUser?.name || currentUser?.username}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
              Quickly create orders, issue client invoices & print official workshop receipts.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setModalConfig({ type: 'new_order' })}>
              <Armchair size={15} />
              <span>Take Order</span>
            </button>
            <button className="btn btn-outline-gold" onClick={() => setModalConfig({ type: 'new_invoice' })}>
              <FileText size={15} />
              <span>New Invoice / Sale</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setModalConfig({ type: 'new_client' })}>
              <Users size={15} />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      )}

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

      {/* DOFU's Reminders & Urgent Notes Widget - OWNER ONLY */}
      {isOwner && notes.length > 0 && (
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

        {/* Right Column: Interior Projects for Owner, Billing / Sales Overview for Assistant */}
        {isOwner ? (
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
        ) : (
          /* Assistant View: Recent Invoices & Sales Receipts */
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
                  Quotes, Invoices & Sales
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Customer quotations & official sales billing
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('billing')}>
                <span>View All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                <FileText size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: '0.86rem' }}>No invoices or receipts created yet.</p>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '12px' }}
                  onClick={() => setModalConfig({ type: 'new_invoice' })}
                >
                  <Plus size={14} /> Create First Invoice / Sale
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {invoices.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
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
                      <strong style={{ color: '#fff', fontSize: '0.88rem', display: 'block' }}>
                        {inv.invoiceNumber}
                      </strong>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {inv.clientName} • {formatMoney(inv.totalAmount)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {inv.issueDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
