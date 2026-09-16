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
  return badgeColors[String(status).toLowerCase()] || '#6c757d';
}

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
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
    if (!q) {
      setFiltered(orders);
      return;
    }
    setFiltered(
      orders.filter(
        (o) =>
          o.C_Name?.toLowerCase().includes(q) ||
          o.E_Name?.toLowerCase().includes(q) ||
          o.item_names?.toLowerCase().includes(q) ||
          o.item_types?.toLowerCase().includes(q) ||
          o.item_colors?.toLowerCase().includes(q) ||
          o.latest_state?.toLowerCase().includes(q) ||
          String(o.O_id).includes(q)
      )
    );
  }, [search, orders]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order? Product & fabric waar will be restored.')) {
      return;
    }
    try {
      await orderService.remove(id);
      fetchOrders();
    } catch (e) {
      alert(e.response?.data?.message || 'Error deleting order');
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
            <h1>Orders</h1>
          </div>
          <div className="right">
            <Link to="/order/add" className="btn-add">
              <i className="bi bi-plus-lg"></i> Add Order
            </Link>
          </div>
        </header>

        <div className="content">
          <div style={{ marginBottom: 16, maxWidth: 360 }}>
            <input
              type="text"
              placeholder="Search customer, items, type, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            />
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
                    <th>Type</th>
                    <th>Color</th>
                    <th>Qty</th>
                    <th>Waar</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="text-center">
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
                        <td>{o.item_types || '-'}</td>
                        <td>{o.item_colors || '-'}</td>
                        <td>{o.total_qty ?? o.item_count ?? '-'}</td>
                        <td>
                          <strong>
                            {Number(o.total_waar || 0).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            ${Number(o.O_Total || 0).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontSize: '0.8rem',
                              color: '#fff',
                              background: getBadgeColor(o.latest_state),
                            }}
                          >
                            {o.latest_state || 'N/A'}
                          </span>
                        </td>
                        <td>
                          {o.O_date
                            ? String(o.O_date).slice(0, 10)
                            : '-'}
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
                            className="btn-delete"
                            onClick={() => handleDelete(o.O_id)}
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