import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

const badgeColors = {
  pending: '#e67e22',
  confirmed: '#27ae60',
  processing: '#2980b9',
  shipped: '#16a085',
  delivered: '#2e7d32',
  cancelled: '#dc3545',
};

function getBadgeColor(status) {
  if (!status) return '#6c757d';
  return badgeColors[status.toLowerCase()] || '#6c757d';
}

function parseColors(itemColors) {
  if (!itemColors) return [];
  return String(itemColors)
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

function resolveColor(name) {
  const key = String(name || '').toLowerCase().trim();
  const map = {
    black: '#111827',
    white: '#f8fafc',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#eab308',
    orange: '#f97316',
    purple: '#a855f7',
    pink: '#ec4899',
    brown: '#92400e',
    gray: '#6b7280',
    grey: '#6b7280',
    beige: '#d6c6a8',
    gold: '#d4af37',
    silver: '#c0c0c0',
    navy: '#1e3a5f',
    cream: '#fffdd0',
    maroon: '#800000',
    teal: '#14b8a6',
    cyan: '#06b6d4',
  };
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(key)) return key;
  return map[key] || null;
}

function ColorCell({ itemColors }) {
  const colors = parseColors(itemColors);
  if (!colors.length) return <span>-</span>;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
      }}
    >
      {colors.map((name, i) => {
        const bg = resolveColor(name);
        const isLight =
          bg &&
          ['#f8fafc', '#fffdd0', '#ffffff', '#fff', '#c0c0c0', '#d6c6a8'].includes(
            bg.toLowerCase()
          );

        return (
          <span
            key={`${name}-${i}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px 3px 6px',
              borderRadius: 999,
              background: bg || '#f1f5f9',
              color: bg ? (isLight ? '#1e293b' : '#fff') : '#334155',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: bg
                ? `1px solid ${isLight ? '#cbd5e1' : 'transparent'}`
                : '1px solid #e2e8f0',
            }}
            title={name}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: bg || '#94a3b8',
                border: '1px solid rgba(0,0,0,0.15)',
                flexShrink: 0,
              }}
            />
            {name}
          </span>
        );
      })}
    </div>
  );
}

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await orderService.getAll();
      const data = Array.isArray(res) ? res : res?.data || [];
      setOrders(data);
      setFiltered(data);
    } catch (error) {
      console.error(error);
      alert('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    const result = orders.filter(
      (o) =>
        o.C_Name?.toLowerCase().includes(q) ||
        o.E_Name?.toLowerCase().includes(q) ||
        o.item_names?.toLowerCase().includes(q) ||
        o.item_colors?.toLowerCase().includes(q) ||
        o.latest_state?.toLowerCase().includes(q)
    );
    setFiltered(result);
  }, [search, orders]);

  const handleDelete = async (id) => {
    if (
      window.confirm(
        'Are you sure you want to delete this order? All its items and state history will also be deleted.'
      )
    ) {
      try {
        await orderService.remove(id);
        fetchOrders();
      } catch (error) {
        alert('Error deleting order');
      }
    }
  };

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />
      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button type="button" onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Order List</h1>
          </div>
          <div className="right">
            <Link to="/order/add" className="btn-add">
              <i className="bi bi-plus-lg"></i> Add Order
            </Link>
          </div>
        </header>

        <div className="content">
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                maxWidth: '420px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#ffffff',
              }}
            >
              <span
                style={{
                  padding: '0 12px',
                  color: '#718096',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                placeholder="Search customer, employee, items, color, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px 10px 0',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                }}
              />
            </div>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th>Employee</th>
                    <th>Items</th>
                    <th>Color</th>
                    <th># Items</th>
                    <th>Order Date</th>
                    <th>Appointment</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="text-center">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o, index) => (
                      <tr key={o.O_id}>
                        <td>{index + 1}</td>
                        <td>{o.C_Name || '-'}</td>
                        <td>{o.E_Name || '-'}</td>
                        <td>{o.item_names || '-'}</td>
                        <td>
                          <ColorCell itemColors={o.item_colors} />
                        </td>
                        <td>{o.item_count ?? '-'}</td>
                        <td>
                          {o.O_date
                            ? new Date(o.O_date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td>
                          {o.O_AppointmentDate
                            ? new Date(o.O_AppointmentDate).toLocaleDateString()
                            : '-'}
                        </td>
                        <td>
                          <strong>${Number(o.O_Total || 0).toFixed(2)}</strong>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '999px',
                              fontSize: '0.8rem',
                              color: '#fff',
                              background: getBadgeColor(o.latest_state),
                            }}
                          >
                            {o.latest_state || 'No State'}
                          </span>
                        </td>
                        <td className="actions">
                          <Link
                            to={`/order/edit/${o.O_id}`}
                            className="btn-edit"
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(o.O_id)}
                            className="btn-delete"
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                          <Link
                            to={`/order-state/add/${o.O_id}`}
                            className="btn-edit"
                            title="Add State"
                          >
                            <i className="bi bi-plus-circle"></i>
                          </Link>
                          <Link
                            to={`/order-state/table/${o.O_id}`}
                            className="btn-edit"
                            title="View States"
                          >
                            <i className="bi bi-clock-history"></i>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderList;