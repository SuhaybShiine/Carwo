import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Dashboard.css';
import Sidebar from '../components/Sidebar';
import authService from '../services/authService';

import employeeService from '../services/employeeService';
import customerService from '../services/customerService';
import supplierService from '../services/supplierService';
import productService from '../services/productService';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';

function Dashboard() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = authService.getUser();
  const isAdmin = authService.isAdmin();

  const [stats, setStats] = useState({
    employees: 0,
    customers: 0,
    suppliers: 0,
    products: 0,
    orders: 0,
    payments: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          isAdmin ? employeeService.getAll() : Promise.resolve([]),
          customerService.getAll(),
          isAdmin ? supplierService.getAll() : Promise.resolve([]),
          productService.getAll(),
          orderService.getAll(),
          paymentService.getAll(),
        ]);

        const pick = (res) => {
          if (res.status !== 'fulfilled') return [];
          const d = res.value;
          if (Array.isArray(d)) return d;
          if (Array.isArray(d?.data)) return d.data;
          return [];
        };

        const employees = pick(results[0]);
        const customers = pick(results[1]);
        const suppliers = pick(results[2]);
        const products = pick(results[3]);
        const orders = pick(results[4]);
        const payments = pick(results[5]);

        setStats({
          employees: employees.length,
          customers: customers.length,
          suppliers: suppliers.length,
          products: products.length,
          orders: orders.length,
          payments: payments.length,
        });

        const byDesc = (arr, key) =>
          [...arr].sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0));

        setRecentOrders(byDesc(orders, 'O_id').slice(0, 5));
        setRecentPayments(byDesc(payments, 'payment_id').slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin]);

  const getItem = (o) => {
    if (o.items_with_qty && String(o.items_with_qty).trim()) return o.items_with_qty;
    if (o.item_names && String(o.item_names).trim()) return o.item_names;
    if (o.O_item && String(o.O_item).trim()) return o.O_item;
    if (o.P_item) return o.P_item;
    return '-';
  };

  const getQty = (o) => {
    if (o.total_qty !== undefined && o.total_qty !== null && Number(o.total_qty) > 0) {
      return Number(o.total_qty);
    }
    if (o.O_quantity !== undefined && o.O_quantity !== null && o.O_quantity !== '') {
      return o.O_quantity;
    }
    if (o.items_with_qty) {
      const matches = String(o.items_with_qty).match(/x\s*(\d+)/gi);
      if (matches && matches.length) {
        return matches.reduce(
          (s, m) => s + (Number(String(m).replace(/x\s*/i, '')) || 0),
          0
        );
      }
    }
    if (o.item_count !== undefined && o.item_count !== null) {
      return Number(o.item_count);
    }
    return '-';
  };

  const money = (n) =>
    `$${Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const statusClass = (status) => {
    const s = String(status || 'Pending').toLowerCase();
    if (s.includes('confirm')) return 'st-ok';
    if (s.includes('cancel')) return 'st-bad';
    return 'st-wait';
  };

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />

      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Carwo Furniture Home Decorations System</h1>
          </div>

          <div className="right">
            <div className="header-icons">
              <button className="icon-btn" title="Notifications">
                <i className="bi bi-bell"></i>
              </button>
              <button className="icon-btn" title="Profile">
                <i className="bi bi-person-circle"></i>
              </button>
              {/* LOGOUT — shaqeynaya */}
              <button
                className="icon-btn logout"
                title="Logout"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
            <div className="user">
              <strong>{user?.Full_Name || user?.Username || 'User'}</strong>
              <span>{user?.Role === 'admin' ? 'Administrator' : 'User'}</span>
            </div>
          </div>
        </header>

        <div className="dash-body">
          <div className="stat-grid">
            {/* Admin only cards */}
            {isAdmin && (
              <Link to="/employee" className="stat-card sc-employee">
                <div className="stat-text">
                  <span className="stat-label">EMPLOYEE</span>
                  <span className="stat-value">
                    {loading ? '…' : stats.employees}
                  </span>
                </div>
                <i className="bi bi-people-fill stat-icon"></i>
              </Link>
            )}

            <Link to="/customer" className="stat-card sc-customer">
              <div className="stat-text">
                <span className="stat-label">CUSTOMER</span>
                <span className="stat-value">
                  {loading ? '…' : stats.customers}
                </span>
              </div>
              <i className="bi bi-person-badge stat-icon"></i>
            </Link>

            {isAdmin && (
              <Link to="/supplier" className="stat-card sc-supplier">
                <div className="stat-text">
                  <span className="stat-label">SUPPLIER</span>
                  <span className="stat-value">
                    {loading ? '…' : stats.suppliers}
                  </span>
                </div>
                <i className="bi bi-truck stat-icon"></i>
              </Link>
            )}

            <Link to="/product" className="stat-card sc-product">
              <div className="stat-text">
                <span className="stat-label">PRODUCT</span>
                <span className="stat-value">
                  {loading ? '…' : stats.products}
                </span>
              </div>
              <i className="bi bi-box-seam stat-icon"></i>
            </Link>

            <Link to="/order" className="stat-card sc-order">
              <div className="stat-text">
                <span className="stat-label">ORDER</span>
                <span className="stat-value">
                  {loading ? '…' : stats.orders}
                </span>
              </div>
              <i className="bi bi-cart-check stat-icon"></i>
            </Link>

            <Link to="/payment" className="stat-card sc-payment">
              <div className="stat-text">
                <span className="stat-label">PAYMENT</span>
                <span className="stat-value">
                  {loading ? '…' : stats.payments}
                </span>
              </div>
              <i className="bi bi-credit-card stat-icon"></i>
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="panel">
            <div className="panel-head">
              <span>
                <i className="bi bi-cart3"></i> Recent Orders
              </span>
            </div>
            <div className="panel-body">
              {loading ? (
                <p className="empty">Loading...</p>
              ) : recentOrders.length === 0 ? (
                <p className="empty">No orders yet</p>
              ) : (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>CUSTOMER</th>
                      <th>ITEM</th>
                      <th>QTY</th>
                      <th>AMOUNT</th>
                      <th>STATUS</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.O_id}>
                        <td>{o.O_id}</td>
                        <td>{o.C_Name || o.customer_name || '-'}</td>
                        <td>{getItem(o)}</td>
                        <td>{getQty(o)}</td>
                        <td>
                          <strong>{money(o.O_Total)}</strong>
                        </td>
                        <td>
                          <span
                            className={`st-badge ${statusClass(
                              o.latest_state || o.Status_Name
                            )}`}
                          >
                            {o.latest_state || o.Status_Name || 'Pending'}
                          </span>
                        </td>
                        <td>
                          {o.O_AppointmentDate
                            ? String(o.O_AppointmentDate).slice(0, 10)
                            : o.O_date
                              ? String(o.O_date).slice(0, 10)
                              : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="panel">
            <div className="panel-head">
              <span>
                <i className="bi bi-credit-card-2-front"></i> Recent Payments
              </span>
            </div>
            <div className="panel-body">
              {loading ? (
                <p className="empty">Loading...</p>
              ) : recentPayments.length === 0 ? (
                <p className="empty">No payments yet</p>
              ) : (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>CUSTOMER</th>
                      <th>AMOUNT</th>
                      <th>METHOD</th>
                      <th>BALANCE</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.map((p) => (
                      <tr key={p.payment_id}>
                        <td>{p.payment_id}</td>
                        <td>{p.C_Name || '-'}</td>
                        <td>{money(p.amount)}</td>
                        <td>{p.payment_method || '-'}</td>
                        <td>
                          {Number(p.payment_balance) <= 0
                            ? money(0)
                            : money(p.payment_balance)}
                        </td>
                        <td>
                          {p.payment_date
                            ? String(p.payment_date).slice(0, 10)
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;