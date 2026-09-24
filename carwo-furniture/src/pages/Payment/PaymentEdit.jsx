import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import exchangeRateService from '../../services/exchangeRateService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

const CASH_METHODS_LOWER = ['zaad kaash', 'kaash', 'e-dahab kaash'];
const isCashMethod = (m) =>
  m ? CASH_METHODS_LOWER.includes(String(m).trim().toLowerCase()) : false;
const isDollarMethod = (m) => m && !isCashMethod(m);

function PaymentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [paymentInfo, setPaymentInfo] = useState(null);

  // SARIF
  const [todayRate, setTodayRate] = useState(null);
  const [originalRate, setOriginalRate] = useState(null); // ⭐ RATE-KII HORE
  const [isCash, setIsCash] = useState(false);
  const [isDollar, setIsDollar] = useState(false);

  // LABA FIELD
  const [amountDollar, setAmountDollar] = useState('');
  const [amountCash, setAmountCash] = useState('');

  const [form, setForm] = useState({
    payment_method: '',
    payment_date: '',
  });

  // ============================================================
  // FETCH
  // ============================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, rateData] = await Promise.all([
          paymentService.getById(id),
          exchangeRateService.getToday(),
        ]);

        const payment = data?.data || data;
        setPaymentInfo(payment);

        const todayRateVal = rateData?.rate ? Number(rateData.rate) : null;
        const originalRateVal = Number(payment.exchange_rate_used) || null;

        setTodayRate(todayRateVal);
        setOriginalRate(originalRateVal);

        const method = payment.payment_method || '';
        const cash = isCashMethod(method);
        const dollar = isDollarMethod(method);
        setIsCash(cash);
        setIsDollar(dollar);

        if (cash) {
          const slshAmount =
            payment.paid_currency === 'SLSH' && payment.paid_amount
              ? payment.paid_amount
              : '';
          setAmountCash(slshAmount?.toString() || '');
          setAmountDollar('');
        } else {
          setAmountDollar(
            payment.amount !== null && payment.amount !== undefined
              ? Number(payment.amount).toFixed(2)
              : ''
          );
          setAmountCash('');
        }

        setForm({
          payment_method: method,
          payment_date: payment.payment_date
            ? String(payment.payment_date).slice(0, 10)
            : '',
        });
      } catch (error) {
        console.error(error);
        alert('Payment-ka lama helin!');
        navigate('/payment');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // ============================================================
  // RATE-KA LA ISTICMAALI DOONO (HORE HADDII JIRO, HADDII KALE MAANTA)
  // ============================================================
  const getEffectiveRate = () => {
    if (originalRate && originalRate > 0) return originalRate;
    if (todayRate && todayRate > 0) return todayRate;
    return null;
  };

  // ============================================================
  // MAX BALANCE
  // ============================================================
  const getMaxBalanceUSD = () => {
    if (!paymentInfo) return 0;
    const currentBalance = Number(paymentInfo.payment_balance) || 0;
    const currentAmount = Number(paymentInfo.amount) || 0;
    return currentBalance + currentAmount;
  };

  // ============================================================
  // AUTO-FILL
  // ============================================================
  const autoFillAmounts = (method) => {
    const balance = getMaxBalanceUSD();
    const rate = getEffectiveRate();

    if (!method) {
      setAmountDollar('');
      setAmountCash('');
      return;
    }

    if (isCashMethod(method)) {
      if (rate && rate > 0) {
        setAmountCash(Math.round(balance * rate).toString());
      } else {
        setAmountCash('');
      }
      setAmountDollar('');
    } else {
      setAmountDollar(balance.toFixed(2));
      setAmountCash('');
    }
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const getActiveAmount = () =>
    isCash ? amountCash : isDollar ? amountDollar : '';

  const validateField = (name, value, cash = isCash) => {
    switch (name) {
      case 'amount': {
        if (value === '' || value === null) return 'Lacagta waa qasab';
        const num = Number(value);
        if (isNaN(num)) return 'Geli number sax ah';
        if (num <= 0) return 'Lacagtu waa inay ka badan tahay 0';

        const rate = getEffectiveRate();
        if (cash && (!rate || rate <= 0)) {
          return 'Ma jiro sarif la heli karo. Fadlan sarifka dhigo.';
        }

        const maxUSD = getMaxBalanceUSD();
        let usdNum = num;
        if (cash && rate) usdNum = num / rate;

        if (usdNum > maxUSD + 0.01) {
          const maxSLSH =
            cash && rate ? Math.round(maxUSD * rate) : null;
          return `Kama badnaan karto $${maxUSD.toFixed(2)}${
            maxSLSH ? ` (Max SLSH: ${maxSLSH.toLocaleString()})` : ''
          }`;
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
      amount: validateField('amount', activeAmount, isCash),
      payment_method: validateField('payment_method', form.payment_method),
      payment_date: validateField('payment_date', form.payment_date),
    };
    setErrors(next);
    setTouched({ amount: true, payment_method: true, payment_date: true });
    return !Object.values(next).some((m) => m);
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleMethodChange = (e) => {
    const method = e.target.value;
    setIsCash(isCashMethod(method));
    setIsDollar(isDollarMethod(method));
    setForm({ ...form, payment_method: method });

    autoFillAmounts(method);

    setErrors({ ...errors, payment_method: '', amount: '' });
    setTouched({ ...touched, payment_method: true });
  };

  const handleDollarChange = (e) => {
    setAmountDollar(e.target.value);
    if (touched.amount) {
      setErrors({
        ...errors,
        amount: validateField('amount', e.target.value, false),
      });
    }
  };

  const handleCashChange = (e) => {
    setAmountCash(e.target.value);
    if (touched.amount) {
      setErrors({
        ...errors,
        amount: validateField('amount', e.target.value, true),
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

    const activeAmount = getActiveAmount();
    const rate = getEffectiveRate();

    if (isCash && (!rate || rate <= 0)) {
      alert('Ma jiro sarif la heli karo. Fadlan sarifka dhigo.');
      return;
    }

    setSaving(true);
    try {
      await paymentService.update(id, {
        amount: Number(activeAmount),
        payment_method: form.payment_method,
        payment_date: form.payment_date,
      });
      alert('Update-ka waa lagu guuleystay!');
      navigate('/payment');
    } catch (error) {
      const msg = error.response?.data?.message || 'Khalad ayaa dhacay';
      alert(msg);
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

  const effectiveRate = getEffectiveRate();
  const usdPreview =
    isCash && amountCash && effectiveRate
      ? (Number(amountCash) / effectiveRate).toFixed(2)
      : null;

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

  const maxUSD = getMaxBalanceUSD();
  const maxSLSH = effectiveRate ? Math.round(maxUSD * effectiveRate) : null;

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
          <div className="form-card" style={{ maxWidth: 720, margin: '0 auto' }}>

            {/* SARIF BANNER */}
            <div
              style={{
                background: effectiveRate
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
                  {originalRate ? 'Rate Used (Hore)' : "Today's Exchange Rate"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
                  {effectiveRate
                    ? `1 USD = ${effectiveRate.toLocaleString()} SLSH`
                    : '⚠ No rate available'}
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
                <i className="bi bi-pencil-square"></i> Manage Rates
              </Link>
            </div>

            {/* ORDER INFO */}
            <div
              style={{
                background: '#f8fafc',
                padding: 15,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                marginBottom: 20,
              }}
            >
              <h4 style={{ marginTop: 0, color: '#1a2a44' }}>
                Order Information
              </h4>
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

              {maxUSD > 0 && (
                <p
                  style={{
                    margin: '6px 0',
                    paddingTop: 8,
                    borderTop: '1px dashed #cbd5e1',
                    color: '#0369a1',
                    fontWeight: 600,
                  }}
                >
                  <i className="bi bi-info-circle me-1"></i>
                  Max la beddeli karo: <b>${maxUSD.toFixed(2)}</b>
                  {maxSLSH && ` (≈ ${maxSLSH.toLocaleString()} SLSH)`}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">

                {/* METHOD */}
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
                    <option value="">-- Select Method --</option>
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

                {/* AMOUNT DOLLAR */}
                <div className="form-group">
                  <label style={{ color: isDollar ? '#0f291e' : '#94a3b8' }}>
                    <i className="bi bi-currency-dollar me-1"></i>
                    Amount Dollar ($)
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
                      borderColor:
                        isDollar && errors.amount ? '#ef4444' : undefined,
                    }}
                  />
                </div>

                {/* AMOUNT CASH */}
                <div className="form-group">
                  <label style={{ color: isCash ? '#92400e' : '#94a3b8' }}>
                    <i className="bi bi-cash-stack me-1"></i>
                    Amount Cash (SLSH)
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
                      borderColor:
                        isCash && errors.amount ? '#ef4444' : undefined,
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
                        (1$ = {effectiveRate.toLocaleString()})
                      </span>
                    </small>
                  )}
                </div>

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