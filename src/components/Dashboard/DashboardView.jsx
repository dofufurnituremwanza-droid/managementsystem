import React, { useState } from 'react';
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
  Receipt,
  UserCheck,
  Calendar,
  User,
  Eye,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';

export const DashboardView = () => {
  const {
    clients,
    orders,
    projects,
    invoices,
    sales,
    expenses,
    notes,
    staff,
    setActiveTab,
    setModalConfig,
    formatMoney,
    isOwner,
    isAssistant,
    currentUser
  } = useApp();

  const todayStr = new Date().toLocaleDateString('en-CA');
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toLocaleDateString('en-CA');

  // Filter for Daily Audit Log: 'all' (default), todayStr, yesterdayStr, or custom date
  const [selectedAuditDate, setSelectedAuditDate] = useState('all');

  // Workshop Pipeline filter: 'all', 'in-production', 'settled'
  const [pipelineFilter, setPipelineFilter] = useState('all');

  // Right card toggle for owner: 'invoices' (default) or 'projects'
  const [ownerRightTab, setOwnerRightTab] = useState('invoices');

  // 1. Total order statistics
  const totalOrdersCount = (orders || []).length;
  const totalOrderValue = (orders || []).reduce((sum, o) => {
    const qty = Number(o.quantity) || 1;
    const unit = Number(o.unitPrice) || 0;
    const calcTotal = Number(o.totalPrice) || Number(o.price) || (qty * unit) || 0;
    return sum + calcTotal;
  }, 0);

  // 2. Clients count
  const totalClientsCount = (clients || []).length;

  // 3. Paid in full orders
  const paidInFullOrders = (orders || []).filter((o) => {
    const qty = Number(o.quantity) || 1;
    const unit = Number(o.unitPrice) || 0;
    const total = Number(o.totalPrice) || Number(o.price) || (qty * unit) || 0;
    const deposit = Number(o.depositPaid) || 0;
    return (total > 0 && deposit >= total) || o.status === 'delivered' || o.isPaidInFull;
  });
  const paidInFullCount = paidInFullOrders.length;

  // Partial paid orders
  const partialPaidOrders = (orders || []).filter((o) => {
    const qty = Number(o.quantity) || 1;
    const unit = Number(o.unitPrice) || 0;
    const total = Number(o.totalPrice) || Number(o.price) || (qty * unit) || 0;
    const deposit = Number(o.depositPaid) || 0;
    return deposit > 0 && deposit < total && o.status !== 'delivered' && !o.isPaidInFull;
  });
  const partialPaidCount = partialPaidOrders.length;

  // Unpaid orders
  const unpaidOrders = (orders || []).filter((o) => {
    const deposit = Number(o.depositPaid) || 0;
    return deposit === 0 && o.status !== 'delivered' && !o.isPaidInFull;
  });
  const unpaidCount = unpaidOrders.length;

  // 4. Revenue Collected
  const revenueFromOrders = (orders || []).reduce((sum, o) => {
    const qty = Number(o.quantity) || 1;
    const unit = Number(o.unitPrice) || 0;
    const total = Number(o.totalPrice) || Number(o.price) || (qty * unit) || 0;
    const deposit = Number(o.depositPaid) || 0;
    if (o.status === 'delivered' || o.isPaidInFull) {
      return sum + (total > 0 ? total : deposit);
    }
    return sum + deposit;
  }, 0);

  // Direct Showroom Sales revenue
  const revenueFromSales = (sales || []).reduce(
    (sum, s) => sum + (Number(s.totalAmount) || Number(s.amount) || Number(s.totalPrice) || 0),
    0
  );

  // Standalone Invoices revenue
  const standaloneInvoicesRevenue = (invoices || [])
    .filter((inv) => !inv.orderId && !inv.orderNumber)
    .reduce((sum, inv) => sum + (Number(inv.amountPaid) || 0), 0);

  const totalRevenueCollected = revenueFromOrders + revenueFromSales + standaloneInvoicesRevenue;

  // 5. Expenses Spent
  const totalExpensesSpent = (expenses || []).reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  // 6. Outstanding Balances to Collect on Delivery
  const outstandingFromOrders = (orders || []).reduce((sum, o) => {
    if (o.status === 'delivered' || o.isPaidInFull || o.status === 'cancelled') return sum;
    const qty = Number(o.quantity) || 1;
    const unit = Number(o.unitPrice) || 0;
    const total = Number(o.totalPrice) || Number(o.price) || (qty * unit) || 0;
    const deposit = Number(o.depositPaid) || 0;
    return sum + Math.max(0, total - deposit);
  }, 0);

  const outstandingFromInvoices = (invoices || [])
    .filter((inv) => !inv.orderId && !inv.orderNumber && inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => {
      const invTotal = Number(inv.totalAmount) || 0;
      const paid = Number(inv.amountPaid) || 0;
      return sum + Math.max(0, invTotal - paid);
    }, 0);

  const totalOutstandingBalance = outstandingFromOrders + outstandingFromInvoices;

  // 7. Profit and Loss
  const netProfitLoss = totalRevenueCollected - totalExpensesSpent;
  const profitMargin =
    totalRevenueCollected > 0
      ? ((netProfitLoss / totalRevenueCollected) * 100).toFixed(1)
      : '0.0';
  const netWorkshopBalance = netProfitLoss;

  // Operational states
  const activeOrders = (orders || []).filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );

  const activeProjects = (projects || []).filter(
    (p) => p.stage !== 'completed' && p.stage !== 'cancelled'
  );

  const isBrandNewSystem =
    totalOrdersCount === 0 &&
    (clients || []).length === 0 &&
    (invoices || []).length === 0;

  // Filter helper for recorded entries
  const matchesDate = (item) => {
    if (selectedAuditDate === 'all') return true;
    const d =
      item.recordedDate ||
      (item.createdAt ? String(item.createdAt).split('T')[0] : '') ||
      item.orderDate ||
      item.issueDate ||
      item.date ||
      '';
    return d === selectedAuditDate;
  };

  const filteredOrders = (orders || []).filter(matchesDate);
  const filteredClients = (clients || []).filter(matchesDate);
  const filteredInvoices = (invoices || []).filter(matchesDate);
  const filteredSales = (sales || []).filter(matchesDate);
  const filteredExpenses = (expenses || []).filter(matchesDate);

  // Group staff activity
  const staffActivityMap = {};
  const recordStaffAction = (name, role, type, amount = 0) => {
    const cleanName = name || 'DOFU Management';
    const cleanRole = role || 'owner';
    if (!staffActivityMap[cleanName]) {
      staffActivityMap[cleanName] = {
        name: cleanName,
        role: cleanRole,
        orders: 0,
        clients: 0,
        invoices: 0,
        sales: 0,
        revenue: 0
      };
    }
    if (type === 'order') staffActivityMap[cleanName].orders += 1;
    if (type === 'client') staffActivityMap[cleanName].clients += 1;
    if (type === 'invoice') staffActivityMap[cleanName].invoices += 1;
    if (type === 'sale') staffActivityMap[cleanName].sales += 1;
    staffActivityMap[cleanName].revenue += amount;
  };

  filteredOrders.forEach((o) => {
    recordStaffAction(o.recordedBy, o.recordedByRole, 'order', Number(o.depositPaid || 0));
  });
  filteredClients.forEach((c) => {
    recordStaffAction(c.recordedBy, c.recordedByRole, 'client');
  });
  filteredInvoices.forEach((i) => {
    recordStaffAction(i.recordedBy, i.recordedByRole, 'invoice', Number(i.amountPaid || 0));
  });
  filteredSales.forEach((s) => {
    recordStaffAction(s.recordedBy, s.recordedByRole, 'sale', Number(s.totalAmount || s.amount || 0));
  });

  const staffActivityList = Object.values(staffActivityMap);

  // Combine all entries into unified chronological timeline
  const allRecordedEntries = [
    ...filteredOrders.map((o) => {
      const total = Number(o.totalPrice) || Number(o.price) || 0;
      const deposit = Number(o.depositPaid) || 0;
      const balance = Math.max(0, total - deposit);
      return {
        type: 'order',
        id: o.id,
        title: `${o.orderNumber || 'ORD'} — ${o.itemName || o.category || 'Custom Furniture'}`,
        subtitle: `Client: ${o.clientName || 'Customer'} • Agreed: ${formatMoney(total)} | Advance: ${formatMoney(deposit)} | Balance: ${formatMoney(balance)}`,
        status: o.status || 'pending',
        recordedBy: o.recordedBy || 'DOFU Management',
        recordedByRole: o.recordedByRole || 'owner',
        time:
          o.recordedTime ||
          (o.createdAt
            ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—'),
        date: o.recordedDate || (o.createdAt ? String(o.createdAt).split('T')[0] : '') || o.orderDate || '',
        rawTime: o.recordedAt || o.createdAt || '',
        data: o
      };
    }),
    ...filteredInvoices.map((inv) => ({
      type: 'invoice',
      id: inv.id,
      title: `${inv.type === 'quotation' ? 'Proforma Quote' : 'Commercial Invoice'} #${inv.invoiceNumber || 'INV'}`,
      subtitle: `Billed to: ${inv.clientName || 'Customer'} • Amount: ${formatMoney(inv.totalAmount)} • Paid: ${formatMoney(inv.amountPaid)}`,
      status: inv.status || 'draft',
      recordedBy: inv.recordedBy || 'DOFU Management',
      recordedByRole: inv.recordedByRole || 'owner',
      time:
        inv.recordedTime ||
        (inv.createdAt
          ? new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '—'),
      date: inv.recordedDate || (inv.createdAt ? String(inv.createdAt).split('T')[0] : '') || inv.issueDate || '',
      rawTime: inv.recordedAt || inv.createdAt || '',
      data: inv
    })),
    ...filteredClients.map((c) => ({
      type: 'client',
      id: c.id,
      title: `New Customer: ${c.name}`,
      subtitle: `Phone: ${c.phone || '—'} • Address: ${c.address || 'Mwanza'}`,
      status: 'active',
      recordedBy: c.recordedBy || 'DOFU Management',
      recordedByRole: c.recordedByRole || 'owner',
      time:
        c.recordedTime ||
        (c.createdAt
          ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '—'),
      date: c.recordedDate || (c.createdAt ? String(c.createdAt).split('T')[0] : '') || '',
      rawTime: c.recordedAt || c.createdAt || '',
      data: c
    })),
    ...filteredSales.map((s) => ({
      type: 'sale',
      id: s.id,
      title: `Showroom Sale #${s.receiptNumber || s.saleNumber || 'SALE'}`,
      subtitle: `Item: ${s.itemName || 'Showroom Piece'} • Total: ${formatMoney(s.totalAmount || s.amount)}`,
      status: 'completed',
      recordedBy: s.recordedBy || 'DOFU Management',
      recordedByRole: s.recordedByRole || 'owner',
      time:
        s.recordedTime ||
        (s.createdAt
          ? new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '—'),
      date: s.recordedDate || (s.createdAt ? String(s.createdAt).split('T')[0] : '') || '',
      rawTime: s.recordedAt || s.createdAt || '',
      data: s
    })),
    ...filteredExpenses.map((e) => ({
      type: 'expense',
      id: e.id,
      title: `Workshop Expense: ${e.title || e.category || 'Workshop Supplies'}`,
      subtitle: `Category: ${e.category || 'General'} • Cost: ${formatMoney(e.amount)}`,
      status: 'paid',
      recordedBy: e.recordedBy || 'DOFU Management',
      recordedByRole: e.recordedByRole || 'owner',
      time:
        e.recordedTime ||
        (e.createdAt
          ? new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '—'),
      date: e.recordedDate || (e.createdAt ? String(e.createdAt).split('T')[0] : '') || e.date || '',
      rawTime: e.recordedAt || e.createdAt || '',
      data: e
    }))
  ].sort((a, b) => (b.rawTime || '').localeCompare(a.rawTime || ''));

  // Filtered orders for the workshop list
  const displayedOrders = (orders || []).filter((o) => {
    if (pipelineFilter === 'in-production') {
      return o.status !== 'delivered' && o.status !== 'cancelled';
    }
    if (pipelineFilter === 'settled') {
      const total = Number(o.totalPrice) || Number(o.price) || 0;
      const deposit = Number(o.depositPaid) || 0;
      return (total > 0 && deposit >= total) || o.status === 'delivered' || o.isPaidInFull;
    }
    return true; // 'all'
  });

  return (
    <div>
      {/* Top Comprehensive Stat Cards: Financial & Operational Overview */}
      {isOwner ? (
        <div className="stats-grid">
          {/* 1. ORDERS RECORDED */}
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('orders')} title="View all customer furniture orders">
            <div className="stat-info">
              <div className="stat-label">Orders Recorded</div>
              <div className="stat-value">{totalOrdersCount}</div>
              <div className="stat-note">
                <Armchair size={13} color="var(--gold-primary)" />
                <span>Agreed: {formatMoney(totalOrderValue)}</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(197, 160, 89, 0.12)', color: 'var(--gold-primary)' }}>
              <Armchair size={22} />
            </div>
          </div>

          {/* 2. CLIENTS */}
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('clients')} title="View customer CRM directory">
            <div className="stat-info">
              <div className="stat-label">Clients</div>
              <div className="stat-value" style={{ color: '#60a5fa' }}>{totalClientsCount}</div>
              <div className="stat-note">
                <Users size={13} color="#60a5fa" />
                <span>Active CRM Client Directory</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(96, 165, 250, 0.12)', color: '#60a5fa' }}>
              <Users size={22} />
            </div>
          </div>

          {/* 3. REVENUE COLLECTED */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Revenue Collected</div>
              <div className="stat-value" style={{ color: '#10b981' }}>
                {formatMoney(totalRevenueCollected)}
              </div>
              <div className="stat-note">
                <TrendingUp size={13} color="#10b981" />
                <span>Deposits, settlements & sales</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DollarSign size={22} />
            </div>
          </div>

          {/* 4. EXPENSES */}
          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('expenses')} title="View workshop expenses">
            <div className="stat-info">
              <div className="stat-label">Expenses</div>
              <div className="stat-value" style={{ color: '#ef4444' }}>
                {formatMoney(totalExpensesSpent)}
              </div>
              <div className="stat-note">
                <Receipt size={13} color="#ef4444" />
                <span>Timber, wages & workshop costs</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Receipt size={22} />
            </div>
          </div>

          {/* 5. OUTSTANDING BALANCES */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Outstanding Balances</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>
                {formatMoney(totalOutstandingBalance)}
              </div>
              <div className="stat-note">
                <Clock size={13} color="#f59e0b" />
                <span>Pending final delivery</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={22} />
            </div>
          </div>

          {/* 6. PROFIT AND LOSS */}
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Profit and Loss</div>
              <div
                className="stat-value"
                style={{ color: netProfitLoss >= 0 ? '#10b981' : '#ef4444' }}
              >
                {netProfitLoss >= 0 ? '+' : ''}{formatMoney(netProfitLoss)}
              </div>
              <div className="stat-note">
                <TrendingUp size={13} color={netProfitLoss >= 0 ? '#10b981' : '#ef4444'} />
                <span style={{ fontWeight: 700, color: netProfitLoss >= 0 ? '#10b981' : '#ef4444' }}>
                  {netProfitLoss >= 0 ? `Net Profit (${profitMargin}%)` : `Operating Loss (${profitMargin}%)`}
                </span>
              </div>
            </div>
            <div
              className="stat-icon-wrap"
              style={{
                background:
                  netProfitLoss >= 0
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                color: netProfitLoss >= 0 ? '#10b981' : '#ef4444'
              }}
            >
              <TrendingUp size={22} />
            </div>
          </div>
        </div>
      ) : (
        /* Assistant Operational Stats */
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Orders Recorded</div>
              <div className="stat-value">{totalOrdersCount}</div>
              <div className="stat-note">
                <span>Value: {formatMoney(totalOrderValue)}</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(197, 160, 89, 0.12)', color: 'var(--gold-primary)' }}>
              <Armchair size={22} />
            </div>
          </div>

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

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">In Workshop</div>
              <div className="stat-value" style={{ color: '#60a5fa' }}>{activeOrders.length}</div>
              <div className="stat-note">
                <span>Currently in production</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' }}>
              <Users size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Registered Customers</div>
              <div className="stat-value" style={{ color: 'var(--gold-light)' }}>{(clients || []).length}</div>
              <div className="stat-note">
                <span>Saved client directory</span>
              </div>
            </div>
            <div className="stat-icon-wrap" style={{ background: 'rgba(197, 160, 89, 0.12)', color: 'var(--gold-primary)' }}>
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
            <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-main)', fontSize: '1.25rem', margin: '4px 0 2px' }}>
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

      {/* ONBOARDING GUIDE: Only shown if the system is 100% brand new with zero data */}
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
                color: 'var(--text-main)',
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

      {/* RECORDED ACTIVITY & STAFF AUDIT LOG: Shows EVERYTHING recorded in the system */}
      <div className="daily-audit-card">
        <div className="daily-audit-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: 'rgba(197, 160, 89, 0.18)',
                  color: 'var(--gold-primary)'
                }}
              >
                <UserCheck size={18} />
              </span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>
                Recorded System Activity & Staff Audit Log
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '4px 0 0' }}>
              Live audit of every order, invoice, customer, and transaction recorded in DOFU system.
            </p>
          </div>

          {/* Quick Filters: All Records, Today, Yesterday, or Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="daily-pill-filter">
              <button
                type="button"
                className={`daily-pill-btn ${selectedAuditDate === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedAuditDate('all')}
                title="Show all recorded activities"
              >
                All Records ({allRecordedEntries.length})
              </button>
              <button
                type="button"
                className={`daily-pill-btn ${selectedAuditDate === todayStr ? 'active' : ''}`}
                onClick={() => setSelectedAuditDate(todayStr)}
                title="Filter records entered today"
              >
                Today
              </button>
              <button
                type="button"
                className={`daily-pill-btn ${selectedAuditDate === yesterdayStr ? 'active' : ''}`}
                onClick={() => setSelectedAuditDate(yesterdayStr)}
                title="Filter records entered yesterday"
              >
                Yesterday
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="var(--gold-primary)" />
              <input
                type="date"
                className="form-input"
                style={{ padding: '4px 10px', fontSize: '0.82rem', width: 'auto' }}
                value={selectedAuditDate === 'all' ? '' : selectedAuditDate}
                onChange={(e) => setSelectedAuditDate(e.target.value || 'all')}
                title="Filter entries on specific calendar date"
              />
            </div>
          </div>
        </div>

        {/* Daily Summary Highlights for Selected Filter */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '18px'
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}
          >
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Orders Recorded
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-primary)', marginTop: '2px' }}>
              {filteredOrders.length}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--gold-light)' }}>
              Advance: {formatMoney(filteredOrders.reduce((s, o) => s + (Number(o.depositPaid) || 0), 0))}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}
          >
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Invoices & Billing
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
              {filteredInvoices.length}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Value: {formatMoney(filteredInvoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0))}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}
          >
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Customers Registered
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa', marginTop: '2px' }}>
              {filteredClients.length}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {filteredClients.length === 0 ? 'No new clients in filter' : `${filteredClients.length} customer(s)`}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}
          >
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Staff Recorders
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
              {staffActivityList.length}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {staffActivityList.length === 0
                ? 'No staff recorded yet'
                : staffActivityList.map((s) => s.name).join(', ')}
            </div>
          </div>
        </div>

        {/* Breakdown by Staff Member */}
        {staffActivityList.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--gold-light)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Recorded by Staff Members:
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {staffActivityList.map((s) => (
                <div
                  key={s.name}
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div
                    className={`staff-badge ${
                      s.role === 'assistant' ? 'staff-badge-assistant' : 'staff-badge-owner'
                    }`}
                  >
                    <User size={13} />
                    <span>{s.name}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    <span style={{ color: 'var(--gold-light)', fontWeight: 700 }}>{s.orders}</span> order(s) •{' '}
                    <span style={{ color: '#10b981', fontWeight: 700 }}>{s.invoices}</span> invoice(s) •{' '}
                    <span style={{ color: '#60a5fa', fontWeight: 700 }}>{s.clients}</span> client(s)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Timeline of All Entries Recorded */}
        {allRecordedEntries.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '28px 16px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.86rem'
            }}
          >
            No entries found for the selected filter. Click <strong>All Records</strong> to see everything recorded in the system.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allRecordedEntries.map((entry) => (
              <div
                key={`${entry.type}-${entry.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px', flex: 1 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background:
                        entry.type === 'order'
                          ? 'rgba(197, 160, 89, 0.15)'
                          : entry.type === 'invoice'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : entry.type === 'sale'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : entry.type === 'expense'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(59, 130, 246, 0.15)',
                      color:
                        entry.type === 'order'
                          ? 'var(--gold-primary)'
                          : entry.type === 'invoice'
                          ? '#10b981'
                          : entry.type === 'sale'
                          ? '#f59e0b'
                          : entry.type === 'expense'
                          ? '#ef4444'
                          : '#60a5fa'
                    }}
                  >
                    {entry.type === 'order' && <Armchair size={16} />}
                    {entry.type === 'invoice' && <FileText size={16} />}
                    {entry.type === 'client' && <Users size={16} />}
                    {entry.type === 'sale' && <ShoppingBag size={16} />}
                    {entry.type === 'expense' && <Receipt size={16} />}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {entry.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {entry.subtitle}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      className={`staff-badge ${
                        entry.recordedByRole === 'assistant'
                          ? 'staff-badge-assistant'
                          : 'staff-badge-owner'
                      }`}
                    >
                      <User size={12} />
                      <span>{entry.recordedBy}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {entry.date ? `${entry.date} • ` : ''}🕒 {entry.time}
                    </div>
                  </div>

                  {entry.type === 'order' && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-outline-gold btn-sm"
                        onClick={() => setModalConfig({ type: 'order_receipt', data: entry.data })}
                        title="View & Print Official Order & Payment Receipt"
                      >
                        <Receipt size={12} />
                        <span>Receipt</span>
                      </button>
                    </div>
                  )}

                  {entry.type === 'invoice' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setModalConfig({ type: 'print_invoice', data: entry.data })}
                      title="View & Print Official Commercial Invoice"
                    >
                      <FileText size={12} />
                      <span>Invoice</span>
                    </button>
                  )}

                  {entry.type === 'client' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveTab('clients')}
                      title="View in Customer Directory"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                  )}

                  {entry.type === 'sale' && (
                    <button
                      className="btn btn-outline-gold btn-sm"
                      onClick={() => setModalConfig({ type: 'sale_receipt', data: entry.data })}
                      title="View Showroom Sale Receipt"
                    >
                      <Receipt size={12} />
                      <span>Receipt</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DOFU's Reminders & Urgent Notes Widget - OWNER ONLY */}
      {isOwner && notes && notes.length > 0 && (
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
                <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', margin: 0, fontFamily: 'var(--font-serif)' }}>
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
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.88rem', display: 'block', marginBottom: '4px' }}>
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

      {/* Main Split Grid: Left Workshop Production Pipeline | Right Quotes, Invoices & Projects */}
      <div className="dashboard-split-grid">
        {/* Workshop Orders Pipeline */}
        <div className="card">
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
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
                Workshop Orders Pipeline
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                All custom furniture pieces across carpentry & finishing
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('orders')}>
                <span>View All ({orders.length})</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Pipeline filter pills */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              className={`daily-pill-btn ${pipelineFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPipelineFilter('all')}
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            >
              All Orders ({orders.length})
            </button>
            <button
              type="button"
              className={`daily-pill-btn ${pipelineFilter === 'in-production' ? 'active' : ''}`}
              onClick={() => setPipelineFilter('in-production')}
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            >
              In Workshop ({activeOrders.length})
            </button>
            <button
              type="button"
              className={`daily-pill-btn ${pipelineFilter === 'settled' ? 'active' : ''}`}
              onClick={() => setPipelineFilter('settled')}
              style={{ fontSize: '0.75rem', padding: '3px 10px' }}
            >
              Settled & Delivered ({paidInFullCount})
            </button>
          </div>

          {displayedOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <Armchair size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.86rem' }}>No orders found for this filter.</p>
              <button
                className="btn btn-outline-gold btn-sm"
                style={{ marginTop: '12px' }}
                onClick={() => setModalConfig({ type: 'new_order' })}
              >
                <Plus size={14} /> Add Customer Order
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayedOrders.slice(0, 6).map((order) => {
                const total = Number(order.totalPrice) || Number(order.price) || 0;
                const deposit = Number(order.depositPaid) || 0;
                const balance = Math.max(0, total - deposit);
                return (
                  <div
                    key={order.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        #{order.orderNumber || 'ORD'} — {order.itemName || order.category || 'Custom Piece'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        Client: <strong style={{ color: 'var(--text-main)' }}>{order.clientName}</strong> | Value: {formatMoney(total)}
                        {balance > 0 && <span style={{ color: '#f59e0b', marginLeft: '6px' }}>(Due: {formatMoney(balance)})</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge badge-${order.status || 'pending'}`}>{order.status || 'pending'}</span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Due: {order.targetDeliveryDate || order.dueDate || 'Upon completion'}
                        </div>
                      </div>
                      <button
                        className="btn btn-outline-gold btn-sm"
                        onClick={() => setModalConfig({ type: 'order_receipt', data: order })}
                        title="View Order & Payment Receipt"
                      >
                        <Receipt size={12} />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Quotes, Invoices & Sales Billing */}
        <div className="card">
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
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>
                Quotes, Invoices & Sales Billing
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Customer quotations, auto-prepared invoices & sales records
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isOwner && projects && projects.length > 0 && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className={`daily-pill-btn ${ownerRightTab === 'invoices' ? 'active' : ''}`}
                    onClick={() => setOwnerRightTab('invoices')}
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  >
                    Invoices ({invoices.length})
                  </button>
                  <button
                    type="button"
                    className={`daily-pill-btn ${ownerRightTab === 'projects' ? 'active' : ''}`}
                    onClick={() => setOwnerRightTab('projects')}
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  >
                    Projects ({projects.length})
                  </button>
                </div>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('billing')}>
                <span>View All ({invoices.length})</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {ownerRightTab === 'invoices' || !isOwner ? (
            invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                <FileText size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: '0.86rem' }}>No invoices or quotes recorded yet.</p>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '12px' }}
                  onClick={() => setModalConfig({ type: 'new_invoice' })}
                >
                  <Plus size={14} /> Create First Invoice / Quote
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {invoices.slice(0, 6).map((inv) => (
                  <div
                    key={inv.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.88rem', display: 'block' }}>
                        #{inv.invoiceNumber || 'INV'} • {inv.type === 'quotation' ? 'Proforma Quote' : 'Commercial Invoice'}
                      </strong>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        Client: <strong style={{ color: 'var(--text-main)' }}>{inv.clientName}</strong> • {formatMoney(inv.totalAmount)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge badge-${inv.status || 'draft'}`}>{inv.status || 'draft'}</span>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {inv.issueDate || 'Recent'}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setModalConfig({ type: 'print_invoice', data: inv })}
                        title="View, Print or Share PDF Invoice"
                      >
                        <FileText size={12} />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Owner Projects Tab View */
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
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>{project.title}</strong>
                      <span className="badge badge-draft">{project.stage}</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Client: {project.clientName} | {project.rooms || 'Rooms'}
                    </div>
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
