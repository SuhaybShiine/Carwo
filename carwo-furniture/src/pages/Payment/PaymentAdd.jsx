import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

const EXCHANGE_RATE = 11500;

function PaymentAdd() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [form, setForm] = useState({
    order_id: '',
    amount: '',
    payment_method: '',
    payment_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await paymentService.getOrdersList();
        // Backend already filters PAID orders (remaining > 0)
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        alert('Wuu ku guuldareystay inuu soo akhriyo Orders-ka');
      }
    };
    fetchOrders();
  }, []);

  const validateField = (name, value, order = selectedOrder) => {
    switch (name) {
      case 'order_id':
        if (!value) return 'Fadlan dooro Order';
        if (order && Number(order.remaining) <= 0.01) {
          return 'Order-kan waa PAID. Lama qaadan karo lacag kale';
        }
        return '';
      case 'amount': {
        if (value === '' || value === null) return 'Lacagta waa qasab';
        const num = Number(value);
        if (isNaN(num)) return 'Geli number sax ah';
        if (num <= 0) return 'Lacagtu waa inay ka badan tahay 0';
        if (order && num > Number(order.remaining) + 0.01) {
          return `Kama badnaan karto remaining ($${Number(order.remaining).toFixed(2)})`;
        }
        return '';
      }
      case 'payment_method':
        if (!value) return 'Dooro habka lacag-bixinta';
        return '';
      case 'payment_date':
        if (!value) return 'Taariikhda waa qasab';
        return '';
      default:
        return '';
    }
  };

  const validateAll = () => {
    const next = {
      order_id: validateField('order_id', form.order_id),
      amount: validateField('amount', form.amount, selectedOrder),
      payment_method: validateField('payment_method', form.payment_method),
      payment_date: validateField('payment_date', form.payment_date),
    };
    setErrors(next);
    setTouched({
      order_id: true,
      amount: true,
      payment_method: true,
      payment_date: true,
    });
    return !Object.values(next).some((m) => m);
  };

  const handleOrderChange = (e) => {
    const id = e.target.value;
    const order = orders.find((o) => String(o.O_id) === String(id)) || null;
    setForm({ ...form, order_id: id });
    setSelectedOrder(order);
    setTouched({ ...touched, order_id: true });
    setErrors({
      ...errors,
      order_id: validateField('order_id', id, order),
      amount: form.amount ? validateField('amount', form.amount, order) : errors.amount,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (touched[name]) {
      setErrors({
        ...errors,
        [name]: validateField(name, value, selectedOrder),
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors({
      ...errors,
      [name]: validateField(name, value, selectedOrder),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    if (selectedOrder && Number(selectedOrder.remaining) <= 0.01) {
      alert('Order-kan waa PAID. Lama qaadan karo lacag kale.');
      return;
    }

    setLoading(true);
    try {
      await paymentService.create({
        order_id: form.order_id,
        amount: Number(form.amount),
        payment_method: form.payment_method,
        payment_date: form.payment_date,
      });
      alert('Lacagta si guul leh ayaa loo qabtay!');
      navigate('/payment');
    } catch (error) {
      alert(error.response?.data?.message || 'Khalad ayaa dhacay xiliga kaydinta');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = (name) => ({
    borderColor: touched[name] && errors[name] ? '#ef4444' : undefined,
    boxShadow:
      touched[name] && errors[name]
        ? '0 0 0 3px rgba(239, 68, 68, 0.15)'
        : undefined,
  });

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />
      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Record New Payment</h1>
          </div>
          <div className="right">
            <Link to="/payment" className="btn-back">
              Back to List
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="form-card" style={{ maxWidth: 800, margin: '0 auto' }}>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>
                    Select Order <span style={{ color: '#ef4444' }}></span>
                  </label>
                  <select
                    name="order_id"
                    value={form.order_id}
                    onChange={handleOrderChange}
                    onBlur={handleBlur}
                    className="form-control"
                    style={fieldStyle('order_id')}
                  >
                    <option value="">-- Search and Select Order --</option>
                    {orders.length === 0 ? (
                      <option value="" disabled>
                        No unpaid orders available
                      </option>
                    ) : (
                      orders.map((o) => (
                        <option key={o.O_id} value={o.O_id}>
                          Order #{o.O_id} - {o.C_Name} ({o.O_item}) — Remain: $
                          {Number(o.remaining || 0).toFixed(2)}
                        </option>
                      ))
                    )}
                  </select>
                  {touched.order_id && errors.order_id && (
                    <ErrorMsg text={errors.order_id} />
                  )}
                </div>

                {selectedOrder && (
                  <div
                    className="form-group"
                    style={{
                      gridColumn: 'span 2',
                      background: '#f8fafc',
                      padding: 15,
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 10,
                      }}
                    >
                      <p style={{ margin: 0 }}>
                        <strong>Customer:</strong> {selectedOrder.C_Name}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Total Price:</strong> $
                        {Number(selectedOrder.O_Total || 0).toFixed(2)}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Items:</strong> {selectedOrder.O_item}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Remaining:</strong>{' '}
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>
                          ${Number(selectedOrder.remaining || 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>
                    Amount to Pay ($) <span style={{ color: '#ef4444' }}></span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    placeholder="Enter amount"
                    value={form.amount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="form-control"
                    style={fieldStyle('amount')}
                  />
                  {form.amount && !errors.amount && (
                    <small style={{ color: '#2563eb', fontWeight: 600 }}>
                      ≈ {(Number(form.amount) * EXCHANGE_RATE).toLocaleString()} SOS
                    </small>
                  )}
                  {touched.amount && errors.amount && (
                    <ErrorMsg text={errors.amount} />
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Payment Method <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="form-control"
                    style={fieldStyle('payment_method')}
                  >
                    <option value="">-- Choose Method --</option>
                    <option value="ZAAD Kaash">ZAAD Kaash</option>
                    <option value="ZAAD Dollor">ZAAD Dollor</option>
                    <option value="E-Dahab">E-Dahab</option>
                    <option value="Cash">Cash</option>
                  </select>
                  {touched.payment_method && errors.payment_method && (
                    <ErrorMsg text={errors.payment_method} />
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Payment Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="payment_date"
                    value={form.payment_date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="form-control"
                    style={fieldStyle('payment_date')}
                  />
                  {touched.payment_date && errors.payment_date && (
                    <ErrorMsg text={errors.payment_date} />
                  )}
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: 30 }}>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={loading}
                  style={{ width: 200 }}
                >
                  {loading ? 'Processing...' : 'Submit Payment'}
                </button>
                <Link
                  to="/payment"
                  className="btn-cancel"
                  style={{ textDecoration: 'none', marginLeft: 10 }}
                >
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

function ErrorMsg({ text }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        color: '#dc2626',
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      <i className="bi bi-exclamation-circle-fill"></i>
      <span>{text}</span>
    </div>
  );
}

export default PaymentAdd;