import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

const EXCHANGE_RATE = 11500;

function PaymentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [paymentInfo, setPaymentInfo] = useState(null);

  const [form, setForm] = useState({
    amount: '',
    payment_method: '',
    payment_date: '',
  });

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const data = await paymentService.getById(id);
        setPaymentInfo(data);
        setForm({
          amount: data.amount ?? '',
          payment_method: data.payment_method || '',
          payment_date: data.payment_date
            ? String(data.payment_date).slice(0, 10)
            : '',
        });
      } catch (error) {
        alert('Payment-ka lama helin!');
        navigate('/payment');
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [id, navigate]);

  const validateField = (name, value) => {
    switch (name) {
      case 'amount': {
        if (value === '' || value === null) return 'Lacagta waa qasab';
        const num = Number(value);
        if (isNaN(num)) return 'Geli number sax ah';
        if (num <= 0) return 'Lacagtu waa inay ka badan tahay 0';
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
      amount: validateField('amount', form.amount),
      payment_method: validateField('payment_method', form.payment_method),
      payment_date: validateField('payment_date', form.payment_date),
    };
    setErrors(next);
    setTouched({ amount: true, payment_method: true, payment_date: true });
    return !Object.values(next).some((m) => m);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (touched[name]) {
      setErrors({ ...errors, [name]: validateField(name, value) });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setSaving(true);
    try {
      await paymentService.update(id, {
        amount: Number(form.amount),
        payment_method: form.payment_method,
        payment_date: form.payment_date,
      });
      alert('Update-ka waa lagu guuleystay!');
      navigate('/payment');
    } catch (error) {
      alert(error.response?.data?.message || 'Khalad ayaa dhacay');
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = (name) => ({
    borderColor: touched[name] && errors[name] ? '#ef4444' : undefined,
    boxShadow:
      touched[name] && errors[name]
        ? '0 0 0 3px rgba(239, 68, 68, 0.15)'
        : undefined,
  });

  const formatItems = (raw) => {
    if (!raw) return 'N/A';
    return String(raw)
      .split(';')
      .map((part) => {
        const [item, qty, price] = part.split(':');
        if (qty && price) return `${item} x${qty} ($${price})`;
        if (qty) return `${item} x${qty}`;
        return part;
      })
      .join(', ');
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
            <h1>Edit Payment #{id}</h1>
          </div>
          <div className="right">
            <Link to="/payment" className="btn-back">
              Back to List
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="form-card" style={{ maxWidth: 700, margin: '0 auto' }}>
            <div
              style={{
                background: '#f8fafc',
                padding: 15,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                marginBottom: 20,
              }}
            >
              <h4 style={{ marginTop: 0, color: '#1a2a44' }}>Order Information</h4>
              <p style={{ margin: '6px 0' }}>
                <strong>Customer:</strong> {paymentInfo?.C_Name || 'N/A'}
              </p>
              <p style={{ margin: '6px 0' }}>
                <strong>Items:</strong> {formatItems(paymentInfo?.items_raw)}
              </p>
              <p style={{ margin: '6px 0' }}>
                <strong>Grand Total:</strong>{' '}
                <span style={{ fontWeight: 700, color: '#166534' }}>
                  ${Number(paymentInfo?.O_Total || 0).toFixed(2)}
                </span>
              </p>
              <p style={{ margin: '6px 0' }}>
                <strong>Balance:</strong>{' '}
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      Number(paymentInfo?.payment_balance) > 0
                        ? '#dc2626'
                        : '#16a34a',
                  }}
                >
                  {Number(paymentInfo?.payment_balance) <= 0
                    ? 'PAID'
                    : `$${Number(paymentInfo?.payment_balance || 0).toFixed(2)}`}
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Amount Paid ($) <span style={{ color: '#ef4444' }}></span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
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
                    Payment Method <span style={{ color: '#ef4444' }}></span>
                  </label>
                  <select
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="form-control"
                    style={fieldStyle('payment_method')}
                  >
                    <option value="">-- Select Method --</option>
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
                    Payment Date <span style={{ color: '#ef4444' }}></span>
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
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
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

export default PaymentEdit;