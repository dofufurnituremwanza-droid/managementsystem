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
  PackageCheck,
  X,
  ShoppingCart,
  Receipt,
  Printer,
  DollarSign,
  TrendingUp,
  Tag
} from 'lucide-react';

export const InventoryList = () => {
  const { inventory, sales, setModalConfig, removeItem, editItem, formatMoney } = useApp();
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'sales'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [previewImage, setPreviewImage] = useState(null);

  // Filtered Stock Items
  const filteredStock = inventory.filter((item) => {
    const matchSearch =
      (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplier || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // Filtered Sales History
  const filteredSales = (sales || []).filter((sale) => {
    const term = searchTerm.toLowerCase();
    return (
      (sale.receiptNumber || '').toLowerCase().includes(term) ||
      (sale.itemName || '').toLowerCase().includes(term) ||
      (sale.clientName || '').toLowerCase().includes(term) ||
      (sale.clientPhone || '').toLowerCase().includes(term) ||
      (sale.paymentMethod || '').toLowerCase().includes(term)
    );
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

  const handleDeleteSale = (id, recNum) => {
    if (window.confirm(`Are you sure you want to delete sale record "${recNum}"?`)) {
      removeItem('sales', id);
    }
  };

  // Stock Metrics
  const lowStockCount = inventory.filter(
    (i) => (Number(i.quantity) || 0) <= (Number(i.minAlertLevel) || 5)
  ).length;

  const totalStockValue = inventory.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.costPrice) || 0),
    0
  );

  const totalRetailPotential = inventory.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.sellingPrice) || 0),
    0
  );

  // Sales Metrics
  const totalSalesRevenue = (sales || []).reduce(
    (sum, s) => sum + (Number(s.amountPaid) || 0),
    0
  );

  const totalSalesCount = (sales || []).length;

  return (
    <div>
      {/* View Switcher Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '12px'
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('stock');
            setSearchTerm('');
          }}
          className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Boxes size={16} />
          <span>Showroom & Stock Catalog ({inventory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('sales');
            setSearchTerm('');
          }}
          className={`btn ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
        >
          <Receipt size={16} />
          <span>Sales History & Receipts ({totalSalesCount})</span>
        </button>
      </div>

      {activeTab === 'stock' ? (
        <>
          {/* Top Inventory Metrics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Stock Catalog</div>
                <div className="stat-value">{inventory.length} Items</div>
                <div className="stat-note">Finished furniture & materials</div>
              </div>
              <div className="stat-icon-wrap">
                <Boxes size={22} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Showroom Retail Value</div>
                <div className="stat-value" style={{ color: 'var(--gold-light)' }}>
                  {formatMoney(totalRetailPotential)}
                </div>
                <div className="stat-note">At customer selling prices</div>
              </div>
              <div className="stat-icon-wrap" style={{ background: 'rgba(197, 160, 89, 0.15)', color: '#c5a059' }}>
                <Tag size={22} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Low Stock Alerts</div>
                <div
                  className="stat-value"
                  style={{ color: lowStockCount > 0 ? '#ef4444' : '#10b981' }}
                >
                  {lowStockCount} Items
                </div>
                <div className="stat-note">
                  {lowStockCount > 0 ? 'Requires restocking' : 'All stock levels healthy'}
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

          {/* Stock Toolbar */}
          <div className="toolbar">
            <div style={{ display: 'flex', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search stock by name, SKU, price, supplier..."
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
                <option value="Finished Furniture">Finished Furniture (Showroom)</option>
                <option value="Living Room & Sofas">Living Room & Sofas</option>
                <option value="Dining Tables & Chairs">Dining Tables & Chairs</option>
                <option value="Beds & Bedroom Furniture">Beds & Bedroom Furniture</option>
                <option value="Executive Desks & Storage">Executive Desks</option>
                <option value="Timber & Hardwood">Timber & Hardwood</option>
                <option value="Fabrics & Leather">Fabrics & Leather</option>
                <option value="Hardware & Fittings">Hardware & Joinery</option>
                <option value="Finishes & Paints">Finishes & Paints</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-outline-gold"
                onClick={() => setModalConfig({ type: 'make_sale', data: null })}
                title="Sell product directly to customer"
              >
                <ShoppingCart size={16} />
                <span>Make Sale</span>
              </button>

              <button
                className="btn btn-primary"
                onClick={() => setModalConfig({ type: 'new_inventory' })}
              >
                <Plus size={16} />
                <span>Add Stock Item</span>
              </button>
            </div>
          </div>

          {inventory.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No Stock Items Recorded"
              description="Catalog finished showroom furniture, timber boards, and fabrics. Attach product photos and selling prices to sell directly to clients."
              actionLabel="Add First Stock Item"
              onAction={() => setModalConfig({ type: 'new_inventory' })}
            />
          ) : filteredStock.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No items match your search filter.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="luxury-table">
                <thead>
                  <tr>
                    <th>Product & Photo</th>
                    <th>Category</th>
                    <th>Stock In Hand</th>
                    <th>Retail Selling Price</th>
                    <th>Cost Price & Profit</th>
                    <th>Showroom Location</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStock.map((item) => {
                    const qty = Number(item.quantity) || 0;
                    const min = Number(item.minAlertLevel) || 5;
                    const isLow = qty <= min;
                    const selling = Number(item.sellingPrice) || 0;
                    const cost = Number(item.costPrice) || 0;
                    const profit = selling - cost;

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {item.imageUrl ? (
                              <div
                                onClick={() => setPreviewImage({ url: item.imageUrl, title: item.name })}
                                style={{
                                  width: '52px',
                                  height: '52px',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                  border: '1px solid var(--border-gold-card)',
                                  cursor: 'pointer',
                                  background: '#090b0e'
                                }}
                                title="Click to zoom product image"
                              >
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: '52px',
                                  height: '52px',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px dashed rgba(255, 255, 255, 0.12)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  color: 'var(--text-muted)'
                                }}
                              >
                                <Boxes size={20} />
                              </div>
                            )}

                            <div>
                              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.94rem' }}>
                                {item.name}
                              </div>
                              <div
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.74rem',
                                  color: 'var(--gold-light)'
                                }}
                              >
                                {item.sku || 'SKU-DOFU'}
                              </div>
                            </div>
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
                              {qty} {item.unit || 'pcs'}
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
                                {qty === 0 ? 'Out of Stock' : `Low (≤${min})`}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div style={{ color: 'var(--gold-light)', fontWeight: 700, fontSize: '0.94rem' }}>
                            {selling > 0 ? formatMoney(selling) : 'Not Set'}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            Cost: {cost > 0 ? formatMoney(cost) : 'N/A'}
                          </div>
                          {selling > 0 && cost > 0 && (
                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: profit >= 0 ? '#10b981' : '#ef4444',
                                fontWeight: 600
                              }}
                            >
                              Profit: +{formatMoney(profit)}
                            </div>
                          )}
                        </td>

                        <td>
                          <div style={{ fontSize: '0.82rem', color: '#fff' }}>
                            {item.location || 'Showroom Display'}
                          </div>
                          {item.supplier && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              🏭 {item.supplier}
                            </div>
                          )}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                              title="Sell this item directly to customer"
                              disabled={qty <= 0}
                              onClick={() => setModalConfig({ type: 'make_sale', data: item })}
                            >
                              <ShoppingCart size={13} />
                              <span>Sell</span>
                            </button>

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
        </>
      ) : (
        /* Sales History Tab */
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Direct Showroom Sales</div>
                <div className="stat-value">{totalSalesCount} Completed</div>
                <div className="stat-note">Cash & mobile money receipts</div>
              </div>
              <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <Receipt size={22} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Sales Revenue</div>
                <div className="stat-value" style={{ color: '#10b981' }}>
                  {formatMoney(totalSalesRevenue)}
                </div>
                <div className="stat-note">Collected into showroom till</div>
              </div>
              <div className="stat-icon-wrap" style={{ background: 'rgba(197, 160, 89, 0.15)', color: '#c5a059' }}>
                <DollarSign size={22} />
              </div>
            </div>
          </div>

          {/* Sales History Toolbar */}
          <div className="toolbar">
            <div className="search-box" style={{ flex: 1 }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search sales by Receipt #, Client name, phone, or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setModalConfig({ type: 'make_sale', data: null })}
            >
              <ShoppingCart size={16} />
              <span>Make New Sale</span>
            </button>
          </div>

          {filteredSales.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Sales Recorded Yet"
              description="Make your first showroom sale from stock. Sold quantities are automatically deducted from inventory, and a branded receipt is generated instantly."
              actionLabel="Make First Sale"
              onAction={() => setModalConfig({ type: 'make_sale', data: null })}
            />
          ) : (
            <div className="table-container">
              <table className="luxury-table">
                <thead>
                  <tr>
                    <th>Receipt # & Date</th>
                    <th>Product Sold</th>
                    <th>Client Details</th>
                    <th>Qty Sold</th>
                    <th>Total & Paid</th>
                    <th>Payment Method</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => {
                    const dateStr = sale.saleDate
                      ? new Date(sale.saleDate).toLocaleDateString()
                      : 'Today';

                    return (
                      <tr key={sale.id}>
                        <td>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.84rem',
                              color: 'var(--gold-light)',
                              fontWeight: 700
                            }}
                          >
                            {sale.receiptNumber}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {dateStr}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {sale.imageUrl && (
                              <img
                                src={sale.imageUrl}
                                alt="Product"
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '6px',
                                  objectFit: 'cover',
                                  border: '1px solid var(--border-gold-card)',
                                  flexShrink: 0,
                                  cursor: 'pointer'
                                }}
                                onClick={() => setPreviewImage({ url: sale.imageUrl, title: sale.itemName })}
                                title="Click to zoom image"
                              />
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: '#fff' }}>{sale.itemName}</div>
                              {sale.sku && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  SKU: {sale.sku}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>
                            {sale.clientName || 'Walk-in Client'}
                          </div>
                          {sale.clientPhone && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                              {sale.clientPhone}
                            </div>
                          )}
                        </td>

                        <td>
                          <span style={{ fontWeight: 700, fontSize: '0.94rem', color: '#fff' }}>
                            {sale.quantity} units
                          </span>
                        </td>

                        <td>
                          <div style={{ fontWeight: 700, color: '#10b981' }}>
                            {formatMoney(sale.amountPaid || sale.totalAmount)}
                          </div>
                          {Number(sale.balance) > 0 && (
                            <div style={{ fontSize: '0.72rem', color: '#f59e0b' }}>
                              Bal: {formatMoney(sale.balance)}
                            </div>
                          )}
                        </td>

                        <td>
                          <span className="badge badge-paid">{sale.paymentMethod || 'Cash'}</span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              className="btn-outline-gold btn-sm"
                              title="Print Sales Receipt"
                              onClick={() => setModalConfig({ type: 'sale_receipt', data: sale })}
                            >
                              <Printer size={13} />
                              <span>Receipt</span>
                            </button>

                            <button
                              className="btn-danger btn-sm"
                              title="Delete Sale Record"
                              onClick={() => handleDeleteSale(sale.id, sale.receiptNumber)}
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
        </>
      )}

      {/* Image Lightbox Modal */}
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
                {previewImage.title || 'Product Image'}
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
