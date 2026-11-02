import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../Common/EmptyState';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Armchair,
  FileText,
  User,
  Calendar,
  MessageCircle
} from 'lucide-react';
import { normalizePhoneForWhatsApp, openWhatsAppDirect } from '../../utils/whatsappShare';

export const ClientsList = () => {
  const { clients, orders, invoices, staff, setModalConfig, removeItem } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [staffFilter, setStaffFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');

  const todayStr = new Date().toLocaleDateString('en-CA');
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA');

  // Collect unique registrars from clients & configured staff
  const staffOptions = Array.from(
    new Set([
      'DOFU Management',
      ...(staff || []).map((s) => s.name || s.username).filter(Boolean),
      ...clients.map((c) => c.recordedBy).filter(Boolean)
    ])
  );

  const filtered = clients.filter((c) => {
    const matchSearch =
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.recordedBy || '').toLowerCase().includes(searchTerm.toLowerCase());

    const clientRecorder = c.recordedBy || 'DOFU Management';
    const matchStaff = staffFilter === 'all' || clientRecorder.toLowerCase() === staffFilter.toLowerCase();

    const clientDateOnly = c.recordedDate || (c.createdAt ? c.createdAt.split('T')[0] : '');
    let matchDate = true;
    if (dateFilter === 'today') {
      matchDate = clientDateOnly === todayStr;
    } else if (dateFilter === 'yesterday') {
      matchDate = clientDateOnly === yesterdayStr;
    } else if (dateFilter === 'custom' && customDate) {
      matchDate = clientDateOnly === customDate;
    }

    return matchSearch && matchStaff && matchDate;
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete client record "${name}"?`)) {
      removeItem('clients', id);
    }
  };

  return (
    <div>
      {/* Top action toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by customer name, phone, delivery address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            title="Filter by who registered the customer"
          >
            <option value="all">👤 All Staff / Registrars</option>
            {staffOptions.map((st) => (
              <option key={st} value={st}>
                👤 {st}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            title="Filter customers by registration date"
          >
            <option value="all">📅 All Dates</option>
            <option value="today">📅 Entered Today</option>
            <option value="yesterday">📅 Entered Yesterday</option>
            <option value="custom">📅 Specific Date...</option>
          </select>

          {dateFilter === 'custom' && (
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '6px 10px' }}
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
            />
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setModalConfig({ type: 'new_client' })}
        >
          <Plus size={16} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Zero State */}
      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Customers in Database"
          description="Keep all customer full names, phone numbers, and delivery addresses safely organized in your system."
          actionLabel="Add First Customer"
          onAction={() => setModalConfig({ type: 'new_client' })}
        />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No customers matched your search query.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="luxury-table">
            <thead>
              <tr>
                <th>Customer Full Name</th>
                <th>Phone Number</th>
                <th>Delivery Address</th>
                <th>Registered By & Date</th>
                <th>Orders / Invoices</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const clientOrders = orders.filter((o) => o.clientId === client.id);
                const clientInvoices = invoices.filter((i) => i.clientId === client.id);

                return (
                  <tr key={client.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.94rem' }}>
                        {client.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', color: '#60a5fa', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} color="var(--gold-primary)" />
                          <span>{client.phone}</span>
                        </div>
                        {client.phone && (
                          <button
                            type="button"
                            className="btn-whatsapp btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.7rem', height: '22px' }}
                            title={`Chat with ${client.name} on WhatsApp or WhatsApp Business`}
                            onClick={() => {
                              openWhatsAppDirect(
                                client.phone,
                                `Hello ${client.name || 'Valued Customer'},\n\nGreetings from DOFU FURNITURE MWANZA!`
                              );
                            }}
                          >
                            <MessageCircle size={11} />
                            <span>WhatsApp</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.84rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <MapPin size={13} color="var(--wood-warm)" />
                        <span>{client.address || 'No address specified'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div
                          className={`staff-badge ${
                            client.recordedByRole === 'assistant' ? 'staff-badge-assistant' : 'staff-badge-owner'
                          }`}
                          title={`Registered by: ${client.recordedBy || 'DOFU Management'} (${client.recordedByRole || 'owner'})`}
                        >
                          <User size={12} />
                          <span>{client.recordedBy || 'DOFU Management'}</span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.73rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Calendar size={11} color="var(--gold-primary)" />
                          <span>
                            {(client.recordedDate || (client.createdAt ? client.createdAt.split('T')[0] : '')) === todayStr
                              ? 'Today'
                              : (client.recordedDate || (client.createdAt ? client.createdAt.split('T')[0] : 'Earlier'))}
                            {client.recordedTime ? ` • ${client.recordedTime}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span
                          className="badge"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                        >
                          {clientOrders.length} Orders
                        </span>
                        <span
                          className="badge"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                        >
                          {clientInvoices.length} Invoices
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn-secondary btn-sm"
                          title="Create Order for Client"
                          onClick={() =>
                            setModalConfig({
                              type: 'new_order',
                              data: { clientId: client.id, clientName: client.name }
                            })
                          }
                        >
                          <Armchair size={13} />
                        </button>
                        <button
                          className="btn-secondary btn-sm"
                          title="Create Quote/Invoice for Client"
                          onClick={() =>
                            setModalConfig({
                              type: 'new_invoice',
                              data: { clientId: client.id, clientName: client.name, clientPhone: client.phone }
                            })
                          }
                        >
                          <FileText size={13} />
                        </button>
                        <button
                          className="btn-secondary btn-sm"
                          title="Edit Client"
                          onClick={() => setModalConfig({ type: 'edit_client', data: client })}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn-danger btn-sm"
                          title="Delete Client"
                          onClick={() => handleDelete(client.id, client.name)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
