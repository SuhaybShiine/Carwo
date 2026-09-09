import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import productService from '../../services/productService';
import authService from '../../services/authService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function ProductList() {
  const isAdmin = authService.isAdmin();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await productService.getAll();
      const data = Array.isArray(res) ? res : res?.data || [];
      setProducts(data);
      setFiltered(data);
    } catch (error) {
      console.error(error);
      alert('Error loading products');
      setProducts([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    const result = products.filter((p) => {
      const itemName = (p.P_item || '').toLowerCase();
      if (isAdmin) {
        const supplierName = (p.Sup_Name || '').toLowerCase();
        return itemName.includes(q) || supplierName.includes(q);
      }
      return itemName.includes(q);
    });
    setFiltered(result);
  }, [search, products, isAdmin]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.remove(id);
        fetchProducts();
      } catch (error) {
        alert('Error deleting product');
      }
    }
  };

  // User: 6 columns | Admin: 7 columns (Supplier)
  const colSpan = isAdmin ? 7 : 6;

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />

      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button type="button" onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Product List</h1>
          </div>
          <div className="right">
            <Link to="/product/add" className="btn-add">
              <i className="bi bi-plus-lg"></i> Add Product
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="search-box" style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                maxWidth: '450px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <span
                style={{
                  padding: '10px 16px',
                  background: '#f7fafc',
                  borderRight: '1px solid #e2e8f0',
                  color: '#4a5568',
                }}
              >
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                placeholder={
                  isAdmin
                    ? 'Search by product or supplier...'
                    : 'Search by product...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  background: 'transparent',
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
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total Value</th>
                    {isAdmin && <th>Supplier</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={colSpan} className="text-center">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p, index) => (
                      <tr key={p.P_id}>
                        <td>{index + 1}</td>
                        <td>{p.P_item}</td>
                        <td>{p.P_quantity}</td>
                        <td>${parseFloat(p.P_price || 0).toFixed(2)}</td>
                        <td>
                          $
                          {p.P_total != null || p.P_Total != null
                            ? parseFloat(p.P_total ?? p.P_Total).toFixed(2)
                            : '0.00'}
                        </td>
                        {/* SUPPLIER — Admin only */}
                        {isAdmin && <td>{p.Sup_Name || '—'}</td>}
                        <td className="actions">
                          <Link
                            to={`/product/edit/${p.P_id}`}
                            className="btn-edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.P_id)}
                            className="btn-delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
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

export default ProductList;