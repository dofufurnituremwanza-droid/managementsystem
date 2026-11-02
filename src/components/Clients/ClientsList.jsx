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
  FileText
} from 'lucide-react';

export const ClientsList = () => {
  const { clients, orders, invoices, setModalConfig, removeItem } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = clients.filter((c) => {
    return (
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
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
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.94rem' }}>
                        {client.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', color: '#60a5fa' }}>
                        <Phone size={13} color="var(--gold-primary)" />
                        <span>{client.phone}</span>
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
