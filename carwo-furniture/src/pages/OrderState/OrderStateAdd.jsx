import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import orderStateService from '../../services/orderStateService';
import orderService from '../../services/orderService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

const STATE_OPTIONS = ['Pending', 'Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

function OrderStateAdd() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    state_name: '',
    state_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await orderService.getById(orderId);
        setOrder(res.data);
      } catch (err) {
        console.error(err);
        alert('Order not found');
        navigate('/order');
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.state_name) {
      setError('Please select a state');
      return;
    }

    setSaving(true);
    try {
      await orderStateService.add({
        Order_id: orderId,
        state_name: form.state_name,
        state_date: form.state_date,
      });
      alert('State added successfully!');
      navigate('/order');
    } catch (err) {
      console.error(err);
      alert('Error adding state');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="layout">
        <Sidebar collapsed={collapsed} />
        <div className={`main ${collapsed ? 'collapsed' : ''}`}>
          <div className="content">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />

      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Add Order State</h1>
          </div>
          <div className="right">
            <Link to="/order" className="btn-back">
              <i className="bi bi-arrow-left"></i> Back to List
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="form-card" style={{ maxWidth: '500px' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Order ID</label>
                <input type="text" value={order?.O_id || ''} disabled style={{ background: '#f7fafc' }} />
              </div>

              <div className="form-group">
                <label>Customer</label>
                <input type="text" value={order?.C_Name || ''} disabled style={{ background: '#f7fafc' }} />
              </div>

              <div className="form-group">
                <label>State *</label>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                >
                  {STATE_OPTIONS.map((state) => (
                    <label key={state} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="state_name"
                        value={state}
                        checked={form.state_name === state}
                        onChange={handleChange}
                      />
                      {state}
                    </label>
                  ))}
                </div>
                {error && <span className="error">{error}</span>}
              </div>

              <div className="form-group">
                <label>State Date *</label>
                <input
                  type="date"
                  name="state_date"
                  value={form.state_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Submit State'}
                </button>
                <Link to="/order" className="btn-cancel">Cancel</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderStateAdd;