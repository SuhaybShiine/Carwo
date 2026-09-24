import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import exchangeRateService from '../../services/exchangeRateService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

// ============================================================
// PAYMENT METHODS
// ============================================================
const CASH_METHODS = ['Zaad Kaash', 'Kaash', 'E-Dahab Kaash'];
const DOLLAR_METHODS = ['Zaad Dollor', 'Dollor', 'E-Dahab Dollor', 'Card'];

const isCashMethod = (m) => CASH_METHODS.includes(m);
const isDollarMethod = (m) => DOLLAR_METHODS.includes(m);

function PaymentAdd() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);

  // SARIF
  const [todayRate, setTodayRate] = useState(null);
  const [isCash, setIsCash] = useState(false);
  const [isDollar, setIsDollar] = useState(false);

  // ── LABA FIELD OO GOONI AH ──
  const [amountDollar, setAmountDollar] = useState(''); // USD
  const [amountCash, setAmountCash] = useState('');     // SLSH

  const [form, setForm] = useState({
    order_id: '',
    payment_method: '',
    payment_date: new Date().toISOString().slice(0, 10),
  });

  // ============================================================
  // FETCH
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, rateData] = await Promise.all([
          paymentService.getOrdersList(),
          exchangeRateService.getToday(),
        ]);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setTodayRate(rateData?.rate ? Number(rateData.rate) : null);
      } catch (error) {
        console.error(error);
        alert('Wuu ku guuldareystay inuu soo akhriyo xogta');
      }
    };
    fetchData();
  }, []);

  // ============================================================
  // AUTO-FILL LOGIC
  // ============================================================
  const autoFillAmounts = (order, method, rate) => {
    if (!order || !method) {
      setAmountDollar('');
      setAmountCash('');
      return;
    }

    const remaining = Number(order.remaining) || 0;

    if (isCashMethod(method)) {
      // Kaash → SLSH
      if (rate && rate > 0) {
        setAmountCash(Math.round(remaining * rate).toString());
      } else {
        setAmountCash('');
      }
      setAmountDollar('');
    } else if (isDollarMethod(method)) {
      // Dollar → USD
      setAmountDollar(remaining.toFixed(2));
      setAmountCash('');
    } else {
      setAmountDollar('');
      setAmountCash('');
    }
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const getActiveAmount = () => {
    if (isCash) return amountCash;
    if (isDollar) return amountDollar;
    return '';
  };

  const validateField = (name, value, order = selectedOrder, cash = isCash, dollar = isDollar) => {
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

        let usdNum = num;
        if (cash) {
          if (!todayRate) {
            return 'Ma jiro sarif maanta. Fadlan marka hore dhigo sarifka.';
          }
          usdNum = num / todayRate;
        }

        if (order && usdNum > Number(order.remaining) + 0.01) {
          const max =
            cash && todayRate
              ? ` Max SLSH: ${(
                  Number(order.remaining) * todayRate
                ).toLocaleString()}`
              : '';
          return `Kama badnaan karto remaining ($${Number(order.remaining).toFixed(2)})${max}`;
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
    const activeAmount = getActiveAmount();
    const next = {
      order_id: validateField('order_id', form.order_id),
      amount: validateField('amount', activeAmount, selectedOrder, isCash, isDollar),
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

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleOrderChange = (e) => {
    const id = e.target.value;
    const order = orders.find((o) => String(o.O_id) === String(id)) || null;
    setSelectedOrder(order);

    // Auto-fill labada field
    autoFillAmounts(order, form.payment_method, todayRate);

    setForm({ ...form, order_id: id });
    setTouched({ ...touched, order_id: true });
    setErrors({
      ...errors,
      order_id: validateField('order_id', id, order, isCash, isDollar),
      amount: '',
    });
  };

  const handleMethodChange = (e) => {
    const method = e.target.value;
    const cash = isCashMethod(method);
    const dollar = isDollarMethod(method);

    setIsCash(cash);
    setIsDollar(dollar);
    setForm({ ...form, payment_method: method });

    // Auto-fill labada field
    autoFillAmounts(selectedOrder, method, todayRate);

    setErrors({ ...errors, payment_method: '', amount: '' });
    setTouched({ ...touched, payment_method: true });
  };

  const handleDollarChange = (e) => {
    setAmountDollar(e.target.value);
    if (touched.amount) {
      setErrors({
        ...errors,
        amount: validateField('amount', e.target.value, selectedOrder, false, true),
      });
    }
  };

  const handleCashChange = (e) => {
    setAmountCash(e.target.value);
    if (touched.amount) {
      setErrors({
        ...errors,
        amount: validateField('amount', e.target.value, selectedOrder, true, false),
      });
    }
  };

  const handleDateChange = (e) => {
    setForm({ ...form, payment_date: e.target.value });
    if (touched.payment_date) {
      setErrors({
        ...errors,
        payment_date: validateField('payment_date', e.target.value),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    if (selectedOrder && Number(selectedOrder.remaining) <= 0.01) {
      alert('Order-kan waa PAID. Lama qaadan karo lacag kale.');
      return;
    }

    if (isCash && !todayRate) {
      alert('Ma jiro sarif maanta. Fadlan marka hore dhigo sarifka.');
      return;
    }

    const activeAmount = getActiveAmount();

    setLoading(true);
    try {
      await paymentService.create({
        order_id: form.order_id,
        amount: Number(activeAmount),
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

  // Preview
  const usdPreview =
    isCash && amountCash && todayRate
      ? (Number(amountCash) / todayRate).toFixed(2)
      : null;

  // ============================================================
  // RENDER
  // ============================================================
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
          <div className="form-card" style={{ maxWidth: 820, margin: '0 auto' }}>

            {/* SARIF BANNER */}
            <div
              style={{
                background: todayRate
                  ? 'linear-gradient(135deg, #0f291e, #1b4332)'
                  : 'linear-gradient(135deg, #7f1d1d, #991b1b)',
                color: '#fff',
                padding: '14px 20px',
                borderRadius: 10,
                marginBottom: 20,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 1,
                    opacity: 0.85,
                    textTransform: 'uppercase',
                  }}
                >
                  Today's Exchange Rate
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
                  {todayRate
                    ? `1 USD = ${todayRate.toLocaleString()} SLSH`
                    : '⚠ No rate set for today'}
                </div>
              </div>
              <Link
                to="/exchange-rate"
                style={{
                  color: '#fff',
                  textDecoration: 'underline',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <i className="bi bi-pencil-square"></i>{' '}
                {todayRate ? 'Update' : 'Set Rate'}
              </Link>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">

                {/* SELECT ORDER */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Select Order</label>
                  <select
                    name="order_id"
                    value={form.order_id}
                    onChange={handleOrderChange}
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

                {/* ORDER INFO */}
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
                        {todayRate && (
                          <span
                            style={{
                              color: '#64748b',
                              marginLeft: 6,
                              fontSize: 13,
                            }}
                          >
                            (≈{' '}
                            {(
                              Number(selectedOrder.remaining) * todayRate
                            ).toLocaleString()}{' '}
                            SLSH)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* PAYMENT METHOD */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>
                    Payment Method <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleMethodChange}
                    className="form-control"
                    style={fieldStyle('payment_method')}
                  >
                    <option value="">-- Choose Method --</option>
                    <optgroup label="💵 Cash (SLSH)">
                      <option value="Zaad Kaash">Zaad Kaash (SLSH)</option>
                      <option value="Kaash">Kaash (SLSH)</option>
                      <option value="E-Dahab Kaash">E-Dahab Kaash (SLSH)</option>
                    </optgroup>
                    <optgroup label="💵 Dollar (USD)">
                      <option value="Zaad Dollor">Zaad Dollor (USD)</option>
                      <option value="Dollor">Dollor (USD)</option>
                      <option value="E-Dahab Dollor">E-Dahab Dollor (USD)</option>
                      <option value="Card">Card (USD)</option>
                    </optgroup>
                  </select>
                  {touched.payment_method && errors.payment_method && (
                    <ErrorMsg text={errors.payment_method} />
                  )}
                </div>

                {/* ═══════════════════════════════════════════════
                    LABA FIELD OO GOONI AH — Amount Dollar + Amount Cash
                   ═══════════════════════════════════════════════ */}

                {/* AMOUNT DOLLAR */}
                <div className="form-group">
                  <label
                    style={{
                      color: isDollar ? '#0f291e' : '#94a3b8',
                      transition: 'color 0.2s',
                    }}
                  >
                    <i className="bi bi-currency-dollar me-1"></i>
                    Amount Dollar ($)
                    {isDollar && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          color: '#166534',
                          background: '#dcfce7',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontWeight: 600,
                        }}
                      >
                        AUTO
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    name="amountDollar"
                    step="0.01"
                    min="0.01"
                    placeholder={isDollar ? 'e.g. 45.00' : '— disabled —'}
                    value={amountDollar}
                    onChange={handleDollarChange}
                    className="form-control"
                    disabled={!isDollar}
                    style={{
                      background: isDollar ? '#fff' : '#f1f5f9',
                      fontWeight: isDollar ? 700 : 400,
                      color: isDollar ? '#0f291e' : '#94a3b8',
                      borderColor: isDollar && errors.amount ? '#ef4444' : undefined,
                    }}
                  />
                  {isDollar && amountDollar && (
                    <small
                      style={{
                        color: '#2563eb',
                        fontWeight: 600,
                        display: 'block',
                        marginTop: 4,
                      }}
                    >
                      USD: ${Number(amountDollar).toFixed(2)}
                    </small>
                  )}
                </div>

                {/* AMOUNT CASH */}
                <div className="form-group">
                  <label
                    style={{
                      color: isCash ? '#92400e' : '#94a3b8',
                      transition: 'color 0.2s',
                    }}
                  >
                    <i className="bi bi-cash-stack me-1"></i>
                    Amount Cash (SLSH)
                    {isCash && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          color: '#166534',
                          background: '#dcfce7',
                          padding: '2px 8px',
                          borderRadius: 10,
                          fontWeight: 600,
                        }}
                      >
                        AUTO
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    name="amountCash"
                    step="1"
                    min="1"
                    placeholder={isCash ? 'e.g. 532350' : '— disabled —'}
                    value={amountCash}
                    onChange={handleCashChange}
                    className="form-control"
                    disabled={!isCash}
                    style={{
                      background: isCash ? '#fff' : '#f1f5f9',
                      fontWeight: isCash ? 700 : 400,
                      color: isCash ? '#92400e' : '#94a3b8',
                      borderColor: isCash && errors.amount ? '#ef4444' : undefined,
                    }}
                  />
                  {usdPreview && (
                    <small
                      style={{
                        color: '#2563eb',
                        fontWeight: 600,
                        display: 'block',
                        marginTop: 4,
                      }}
                    >
                      <i className="bi bi-arrow-left-right"></i>{' '}
                      {Number(amountCash).toLocaleString()} SLSH ≈{' '}
                      <b>${usdPreview}</b>{' '}
                      <span style={{ color: '#64748b' }}>
                        (1$ = {todayRate.toLocaleString()})
                      </span>
                    </small>
                  )}
                  {isCash && !todayRate && form.payment_method && (
                    <small
                      style={{
                        color: '#dc2626',
                        fontWeight: 600,
                        display: 'block',
                        marginTop: 4,
                      }}
                    >
                      ⚠ Ma jiro sarif maanta — fadlan marka hore dhigo sarifka
                    </small>
                  )}
                </div>

                {/* ERROR ROW */}
                {touched.amount && errors.amount && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <ErrorMsg text={errors.amount} />
                  </div>
                )}

                {/* DATE */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>
                    Payment Date <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="payment_date"
                    value={form.payment_date}
                    onChange={handleDateChange}
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