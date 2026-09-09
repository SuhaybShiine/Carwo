import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import productService from '../../services/productService';
import supplierService from '../../services/supplierService';
import authService from '../../services/authService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function ProductAdd() {
  const navigate = useNavigate();
  const isAdmin = authService.isAdmin();
  const [collapsed, setCollapsed] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const [form, setForm] = useState({
    P_item: '',
    P_quantity: '',
    P_price: '',
    Sup_id: '',
  });

  const totalValue = () => {
    const qty = parseFloat(form.P_quantity) || 0;
    const price = parseFloat(form.P_price) || 0;
    return (qty * price).toFixed(2);
  };

  useEffect(() => {
    if (!isAdmin) return;
    const loadSuppliers = async () => {
      try {
        const res = await supplierService.getAll();
        const data = Array.isArray(res) ? res : res?.data || [];
        setSuppliers(data);
      } catch (error) {
        console.error('Error loading suppliers:', error);
      }
    };
    loadSuppliers();
  }, [isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.P_item.trim()) {
      newErrors.P_item = 'Product name is required';
    } else if (/^[0-9\s]+$/.test(form.P_item)) {
      newErrors.P_item = 'Product name cannot be numbers only';
    }
    if (form.P_quantity === '' || form.P_quantity === null) {
      newErrors.P_quantity = 'Quantity is required';
    } else if (!Number.isInteger(Number(form.P_quantity))) {
      newErrors.P_quantity = 'Quantity must be a whole number';
    } else if (parseInt(form.P_quantity, 10) < 0) {
      newErrors.P_quantity = 'Quantity cannot be negative';
    }
    if (form.P_price === '' || form.P_price === null) {
      newErrors.P_price = 'Price is required';
    } else if (parseFloat(form.P_price) <= 0) {
      newErrors.P_price = 'Price must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await productService.create({
        P_item: form.P_item,
        P_quantity: Number(form.P_quantity),
        P_price: Number(form.P_price),
        Sup_id: isAdmin && form.Sup_id ? form.Sup_id : null,
      });
      alert('Product added successfully!');
      navigate('/product');
    } catch (error) {
      const message =
        error.response?.data?.message || 'Error adding product. Please try again.';
      if (message.toLowerCase().includes('name')) {
        setErrors({ ...errors, P_item: message });
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
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
            <h1>Add Product</h1>
          </div>
          <div className="right">
            <Link to="/product" className="btn-back">
              <i className="bi bi-arrow-left"></i> Back to List
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="P_item"
                    value={form.P_item}
                    onChange={handleChange}
                    placeholder="e.g. Sofa Set"
                  />
                  {errors.P_item && <span className="error">{errors.P_item}</span>}
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="P_quantity"
                    value={form.P_quantity}
                    onChange={handleChange}
                    min="0"
                    step="1"
                  />
                  {errors.P_quantity && (
                    <span className="error">{errors.P_quantity}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Price ($)</label>
                  <input
                    type="number"
                    name="P_price"
                    value={form.P_price}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                  />
                  {errors.P_price && <span className="error">{errors.P_price}</span>}
                </div>

                {isAdmin && (
                  <div className="form-group">
                    <label>Supplier</label>
                    <select
                      name="Sup_id"
                      value={form.Sup_id}
                      onChange={handleChange}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.Sup_id} value={s.Sup_id}>
                          {s.Sup_Name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Total Value (Auto-calculated)</label>
                  <input
                    type="text"
                    value={`$${totalValue()}`}
                    disabled
                    style={{
                      background: '#f7fafc',
                      cursor: 'not-allowed',
                      fontWeight: 'bold',
                    }}
                  />
                  <small style={{ color: '#718096' }}>
                    * Total = Quantity × Price
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Product'}
                </button>
                <Link to="/product" className="btn-cancel">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductAdd;