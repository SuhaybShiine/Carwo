import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Sidebar({ collapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = authService.isAdmin();
  const user = authService.getUser();

  // Pages kale — active (ikhtiyaari, highlight)
  const isPageActive = (path) => {
    if (path === '/') return false; // Home waa gooni
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="logo">
        <i className="bi bi-house-heart-fill"></i>
        {!collapsed && (
          <span>
            Carwo<span className="gold">Furniture</span>
          </span>
        )}
      </div>

      <nav className="menu">
        {/* HOME — active ALWAYS (ma dhaqaaqo, ma qarsoomo) */}
        <Link to="/" className="home-link active">
          <i className="bi bi-speedometer2"></i>
          {!collapsed && <span>Home</span>}
        </Link>

        {isAdmin && (
          <Link
            to="/employee"
            className={isPageActive('/employee') ? 'page-active' : ''}
          >
            <i className="bi bi-people-fill"></i>
            {!collapsed && <span>Employee</span>}
          </Link>
        )}

        <Link
          to="/customer"
          className={isPageActive('/customer') ? 'page-active' : ''}
        >
          <i className="bi bi-person-badge"></i>
          {!collapsed && <span>Customer</span>}
        </Link>

        {isAdmin && (
          <Link
            to="/supplier"
            className={isPageActive('/supplier') ? 'page-active' : ''}
          >
            <i className="bi bi-truck"></i>
            {!collapsed && <span>Supplier</span>}
          </Link>
        )}

        <Link
          to="/product"
          className={isPageActive('/product') ? 'page-active' : ''}
        >
          <i className="bi bi-box-seam"></i>
          {!collapsed && <span>Product</span>}
        </Link>

        <Link
          to="/order"
          className={isPageActive('/order') ? 'page-active' : ''}
        >
          <i className="bi bi-cart-check"></i>
          {!collapsed && <span>Orders</span>}
        </Link>

        <Link
          to="/fabric-inventory"
          className={isPageActive('/fabric-inventory') ? 'page-active' : ''}
        >
          <i className="bi bi-palette"></i>
          {!collapsed && <span>Fabric Inventory</span>}
        </Link>

        <Link
          to="/payment"
          className={isPageActive('/payment') ? 'page-active' : ''}
        >
          <i className="bi bi-credit-card"></i>
          {!collapsed && <span>Payments</span>}
        </Link>

        {isAdmin && (
          <Link
            to="/expense"
            className={isPageActive('/expense') ? 'page-active' : ''}
          >
            <i className="bi bi-cash-stack"></i>
            {!collapsed && <span>Expenses</span>}
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/system-report"
            className={isPageActive('/system-report') ? 'page-active' : ''}
          >
            <i className="bi bi-graph-up-arrow"></i>
            {!collapsed && <span>System Report</span>}
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/users"
            className={isPageActive('/users') ? 'page-active' : ''}
          >
            <i className="bi bi-person-gear"></i>
            {!collapsed && <span>Users</span>}
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/change-password"
            className={isPageActive('/change-password') ? 'page-active' : ''}
          >
            <i className="bi bi-shield-lock"></i>
            {!collapsed && <span>Change Password</span>}
          </Link>
        )}

        <a
          href="#logout"
          className="menu-logout"
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
          }}
        >
          <i className="bi bi-box-arrow-right"></i>
          {!collapsed && <span>Logout</span>}
        </a>
      </nav>

      {!collapsed && user && (
        <div className="sidebar-user">
          <div className="sidebar-user-name">
            {user.Full_Name || user.Username}
          </div>
          <div className="sidebar-user-role">{user.Role}</div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;