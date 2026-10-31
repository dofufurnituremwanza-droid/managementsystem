import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmptyState } from '../Common/EmptyState';
import {
  Boxes,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  Edit2,
  Trash2,
  PackageCheck
} from 'lucide-react';

export const InventoryList = () => {
  const { inventory, setModalConfig, removeItem, editItem, formatMoney } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = inventory.filter((item) => {
    const matchSearch =
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleAdjustQuantity = async (id, currentQty, delta) => {
    const newQty = Math.max(0, (Number(currentQty) || 0) + delta);
    await editItem('inventory', id, { quantity: newQty });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from stock?`)) {
      removeItem('inventory', id);
    }
  };

  // Metrics
  const lowStockCount = inventory.filter(
    (i) => (Number(i.quantity) || 0) <= (Number(i.minAlertLevel) || 5)
  ).length;

  const totalStockValue = inventory.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.costPrice) || 0),
    0
  );

  return (
    <div>
      {/* Top Inventory Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Material Items</div>
            <div className="stat-value">{inventory.length}</div>
            <div className="stat-note">Cataloged stock SKUs</div>
          </div>
          <div className="stat-icon-wrap">
            <Boxes size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Total Stock Valuation</div>
            <div className="stat-value">{formatMoney(totalStockValue)}</div>
            <div className="stat-note">At raw material cost</div>
          </div>
          <div className="stat-icon-wrap" style={{ background: 'rgba(197, 160, 89, 0.15)', color: '#c5a059' }}>
            <PackageCheck size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-label">Low Stock Warnings</div>
            <div
              className="stat-value"
              style={{ color: lowStockCount > 0 ? '#ef4444' : '#10b981' }}
            >
              {lowStockCount} Items
            </div>
            <div className="stat-note">
              {lowStockCount > 0 ? 'Requires immediate restock' : 'All stock levels healthy'}
            </div>
          </div>
          <div
            className="stat-icon-wrap"
            style={{
              background: lowStockCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: lowStockCount > 0 ? '#ef4444' : '#10b981'
            }}
          >
            <AlertTriangle size={22} />
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
              placeholder="Search by material name, SKU, supplier..."
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
            <option value="all">All Material Categories</option>
            <option value="Timber & Hardwood">Timber & Hardwood</option>
            <option value="Fabrics & Leather">Fabrics & Leather</option>
            <option value="Hardware & Fittings">Hardware & Joinery</option>
            <option value="Finishes & Paints">Finishes & Paints</option>
            <option value="Finished Furniture">Finished Furniture</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setModalConfig({ type: 'new_inventory' })}
        >
          <Plus size={16} />
          <span>Add Stock Item</span>
        </button>
      </div>

      {inventory.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No Inventory Recorded"
          description="Say goodbye to manual timber counts on scrap paper. Track hardwood boards, luxury upholstery rolls, hinges, and finished showroom pieces."
          actionLabel="Add First Material / Item"
          onAction={() => setModalConfig({ type: 'new_inventory' })}
        />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No items matched your search filter.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="luxury-table">
            <thead>
              <tr>
                <th>Item & SKU</th>
                <th>Category</th>
                <th>Current Stock Quantity</th>
                <th>Cost / Unit</th>
                <th>Selling / Unit</th>
                <th>Supplier & Storage</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const qty = Number(item.quantity) || 0;
                const min = Number(item.minAlertLevel) || 5;
                const isLow = qty <= min;

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.74rem',
                          color: 'var(--gold-light)'
                        }}
                      >
                        {item.sku || 'NO-SKU'}
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-draft">{item.category}</span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          className="btn-secondary btn-sm"
                          style={{ padding: '2px 8px' }}
                          title="Reduce stock by 1"
                          onClick={() => handleAdjustQuantity(item.id, qty, -1)}
                        >
                          <Minus size={12} />
                        </button>

                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: isLow ? '#ef4444' : '#fff',
                            minWidth: '40px',
                            textAlign: 'center'
                          }}
                        >
                          {qty} {item.unit}
                        </span>

                        <button
                          className="btn-secondary btn-sm"
                          style={{ padding: '2px 8px' }}
                          title="Increase stock by 1"
                          onClick={() => handleAdjustQuantity(item.id, qty, 1)}
                        >
                          <Plus size={12} />
                        </button>

                        {isLow && (
                          <span
                            className="badge badge-unpaid"
                            style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                          >
                            Low Stock (&le;{min})
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.86rem' }}>
                        {formatMoney(item.costPrice)}
                      </div>
                    </td>

                    <td>
                      <div style={{ color: 'var(--gold-light)', fontWeight: 600, fontSize: '0.86rem' }}>
                        {Number(item.sellingPrice) > 0 ? formatMoney(item.sellingPrice) : 'N/A'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.82rem', color: '#fff' }}>
                        {item.supplier || 'Standard Supplier'}
                      </div>
                      {item.location && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          📍 {item.location}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn-secondary btn-sm"
                          title="Edit Stock Item"
                          onClick={() => setModalConfig({ type: 'edit_inventory', data: item })}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn-danger btn-sm"
                          title="Delete Stock Item"
                          onClick={() => handleDelete(item.id, item.name)}
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
