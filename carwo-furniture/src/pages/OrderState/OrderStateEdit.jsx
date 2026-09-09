import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import orderStateService from '../../services/orderStateService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

const STATE_OPTIONS = ['Pending', 'Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

function OrderStateEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);

  const [form, setForm] = useState({
    state_name: '',
    state_date: '',
  });

  useEffect(() => {
    const loadState = async () => {
      try {
        const res = await orderStateService.getById(id);
        const data = res.data;
        setForm({
          state_name: data.state_name || '',
          state_date: data.state_date ? data.state_date.slice(0, 10) : '',
        });
        setOrderId(data.Order_id);
      } catch (err) {
        console.error(err);
        alert('State not found');
        navigate('/order');
      } finally {
        setLoading(false);
      }
    };
    loadState();
  }, [id, navigate]);

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
      await orderStateService.update(id, {
        state_name: form.state_name,
        state_date: form.state_date,
      });
      alert('State updated successfully!');
      navigate(orderId ? `/order-state/table/${orderId}` : '/order');
    } catch (err) {
      console.error(err);
      alert('Error updating state');
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
            <h1>Update Order State</h1>
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
                  {saving ? 'Updating...' : 'Update State'}
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

export default OrderStateEdit;