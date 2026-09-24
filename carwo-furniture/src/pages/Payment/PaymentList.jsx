import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import exchangeRateService from '../../services/exchangeRateService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

const CASH_METHODS_LOWER = ['zaad kaash', 'kaash', 'e-dahab kaash'];
const isCashMethod = (m) =>
  m ? CASH_METHODS_LOWER.includes(String(m).trim().toLowerCase()) : false;

function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todayRate, setTodayRate] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [balanceError, setBalanceError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ============================================================
  // FETCH
  // ============================================================
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [data, rateData] = await Promise.all([
        paymentService.getAll(),
        exchangeRateService.getToday(),
      ]);
      setPayments(Array.isArray(data) ? data : []);
      setTodayRate(rateData?.rate ? Number(rateData.rate) : null);
    } catch (error) {
      console.error(error);
      alert('Error loading payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // ============================================================
  // DELETE
  // ============================================================
  const handleDelete = async (id) => {
    if (!window.confirm('Ma hubtaa inaad tirtirto lacagtan?')) return;
    try {
      await paymentService.remove(id);
      fetchPayments();
    } catch (error) {
      alert('Error deleting payment');
    }
  };

  // ============================================================
  // PAY BALANCE MODAL
  // ============================================================
  const openBalanceModal = (payment) => {
    setSelected(payment);
    setPayAmount('');
    setPayMethod('');
    setBalanceError('');
    setShowModal(true);
  };

  const closeBalanceModal = () => {
    setShowModal(false);
    setSelected(null);
    setPayAmount('');
    setPayMethod('');
    setBalanceError('');
  };

  const isBalanceCash = isCashMethod(payMethod);

  const handlePayBalance = async (e) => {
    e.preventDefault();
    setBalanceError('');

    if (!payAmount || Number(payAmount) <= 0) {
      setBalanceError('Geli lacag sax ah (ka badan 0)');
      return;
    }
    if (Number(selected.payment_balance) <= 0.01) {
      setBalanceError('Payment-kan waa PAID. Lama qaadan karo baaqi.');
      return;
    }
    if (!payMethod) {
      setBalanceError('Dooro payment method');
      return;
    }

    // SARIF LOGIC
    let usdAmount = Number(payAmount);
    if (isBalanceCash) {
      if (!todayRate) {
        setBalanceError('Ma jiro sarif maanta. Fadlan sarifka dhigo.');
        return;
      }
      usdAmount = Number(payAmount) / todayRate;
    }

    if (usdAmount > Number(selected.payment_balance) + 0.01) {
      const max =
        isBalanceCash && todayRate
          ? ` Max SLSH: ${Math.round(
              Number(selected.payment_balance) * todayRate
            ).toLocaleString()}`
          : '';
      setBalanceError(
        `Kama badnaan karto remaining ($${Number(
          selected.payment_balance
        ).toFixed(2)})${max}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await paymentService.payBalance(selected.payment_id, {
        amount_paid: Number(payAmount),
        payment_method: payMethod,
      });

      console.log('✅ PayBalance response:', res);

      alert('Baaqigii waa laga qabtay!');
      closeBalanceModal();
      fetchPayments();
    } catch (error) {
      console.error('❌ PayBalance error:', error);
      console.error('Response:', error.response);

      // SOO BANDHIG ERROR-KA DHABTA AH
      let msg = 'Khalad baa dhacay';
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error.response?.data?.error) {
        msg = error.response.data.error;
      } else if (error.message) {
        msg = `Network: ${error.message}`;
      } else if (error.response?.status) {
        msg = `Server error (${error.response.status})`;
      }

      setBalanceError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // FILTER
  // ============================================================
  const filtered = (Array.isArray(payments) ? payments : []).filter(
    (p) =>
      p.C_Name?.toLowerCase().includes(search.toLowerCase()) ||
      p.items_with_qty?.toLowerCase().includes(search.toLowerCase()) ||
      String(p.payment_id).includes(search) ||
      p.payment_method?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaidUSD = filtered.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );

  const totalPaidSLSH = filtered.reduce((acc, p) => {
    if (p.paid_currency === 'SLSH' && p.paid_amount) {
      return acc + Number(p.paid_amount);
    }
    return acc;
  }, 0);

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
            <h1>Payment Management</h1>
          </div>
          <div
            className="right"
            style={{ display: 'flex', gap: 10, alignItems: 'center' }}
          >
            <Link
              to="/exchange-rate"
              className="btn-back"
              style={{
                background: 'linear-gradient(135deg, #c5a059, #b08b4e)',
                color: '#fff',
                border: 'none',
              }}
            >
              <i className="bi bi-currency-exchange"></i>{' '}
              {todayRate ? `1$ = ${todayRate.toLocaleString()}` : 'Sarif'}
            </Link>
            <Link to="/payment/report" className="btn-back">
              <i className="bi bi-bar-chart"></i> Report
            </Link>
            <Link to="/payment/add" className="btn-add">
              <i className="bi bi-plus-lg"></i> Add Payment
            </Link>
          </div>
        </header>

        <div className="content">
          <div
            style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}
          >
            <i
              className="bi bi-search"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
              }}
            ></i>
            <input
              type="text"
              placeholder="Search customer, item, method..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: 40 }}
            />
          </div>

          <div className="table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Items / Qty</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount (USD / SLSH)</th>
                  <th>Method</th>
                  <th>Balance Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>
                      No data found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const isCash = p.paid_currency === 'SLSH';
                    const paidAmount = Number(p.paid_amount || 0);
                    const usdAmount = Number(p.amount || 0);
                    const rateUsed = Number(p.exchange_rate_used) || 0;

                    return (
                      <tr key={p.payment_id}>
                        <td>{p.payment_id}</td>
                        <td style={{ fontSize: 11 }}>
                          <strong>{p.items_with_qty || 'N/A'}</strong>
                        </td>
                        <td>{p.C_Name || 'N/A'}</td>
                        <td>
                          {p.payment_date
                            ? String(p.payment_date).slice(0, 10)
                            : '-'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>
                            ${usdAmount.toFixed(2)}
                          </div>
                          {isCash && paidAmount > 0 && (
                            <small style={{ color: '#2563eb' }}>
                              {paidAmount.toLocaleString()} SLSH
                            </small>
                          )}
                          {rateUsed > 0 && (
                            <small
                              style={{
                                color: '#94a3b8',
                                fontSize: 10,
                                display: 'block',
                              }}
                            >
                              1$ = {rateUsed.toLocaleString()}
                            </small>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              background: isCash ? '#fef3c7' : '#dbeafe',
                              color: isCash ? '#92400e' : '#1e40af',
                              padding: '3px 10px',
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {p.payment_method}
                          </span>
                        </td>
                        <td
                          style={{
                            color:
                              Number(p.payment_balance) > 0
                                ? '#dc3545'
                                : '#28a745',
                            fontWeight: 700,
                          }}
                        >
                          {Number(p.payment_balance) <= 0
                            ? 'PAID'
                            : `$${Number(p.payment_balance || 0).toFixed(2)}`}
                        </td>
                        <td className="actions">
                          <Link
                            to={`/payment/receipt/${p.payment_id}`}
                            className="btn-edit"
                            title="Receipt"
                            style={{ background: '#e0f2fe', color: '#0369a1' }}
                          >
                            <i className="bi bi-printer"></i>
                          </Link>
                          <Link
                            to={`/payment/edit/${p.payment_id}`}
                            className="btn-edit"
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          {Number(p.payment_balance) > 0 && (
                            <button
                              onClick={() => openBalanceModal(p)}
                              className="btn-edit"
                              title="Pay Balance"
                              style={{
                                background: '#dcfce7',
                                color: '#166534',
                              }}
                            >
                              <i className="bi bi-cash-coin"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(p.payment_id)}
                            className="btn-delete"
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, #0f2027, #203a43)',
              color: '#fff',
              borderRadius: 12,
              padding: '20px 28px',
              marginTop: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <div>
              <div style={{ opacity: 0.85, fontSize: 14 }}>
                Total Amount Paid{search ? ' (filtered)' : ''}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                ${totalPaidUSD.toFixed(2)}
              </div>
            </div>

            {totalPaidSLSH > 0 && (
              <div
                style={{
                  paddingLeft: 20,
                  borderLeft: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <div style={{ opacity: 0.85, fontSize: 14 }}>
                  Total Cash (SLSH)
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#fbbf24',
                  }}
                >
                  {totalPaidSLSH.toLocaleString()} SLSH
                </div>
              </div>
            )}

            <i
              className="bi bi-cash-stack"
              style={{ fontSize: 36, opacity: 0.4 }}
            ></i>
          </div>
        </div>
      </div>

      {/* ================= PAY BALANCE MODAL ================= */}
      {showModal && selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeBalanceModal}
        >
          <div
            className="form-card"
            style={{ width: 440, padding: 25, borderRadius: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Pay Remaining Balance</h3>
            <p>
              Customer: <b>{selected.C_Name}</b>
            </p>
            <p>
              Remaining:{' '}
              <b style={{ color: '#dc3545' }}>
                ${Number(selected.payment_balance).toFixed(2)}
              </b>
              {todayRate && (
                <span
                  style={{
                    marginLeft: 8,
                    color: '#64748b',
                    fontSize: 13,
                  }}
                >
                  (≈{' '}
                  {Math.round(
                    Number(selected.payment_balance) * todayRate
                  ).toLocaleString()}{' '}
                  SLSH)
                </span>
              )}
            </p>
            <hr style={{ border: '0.5px solid #eee' }} />

            {balanceError && (
              <div
                style={{
                  background: '#fef2f2',
                  color: '#b91c1c',
                  padding: '10px 12px',
                  borderRadius: 8,
                  marginBottom: 12,
                  fontSize: 13,
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <i className="bi bi-exclamation-triangle-fill"></i>
                {balanceError}
              </div>
            )}

            <form onSubmit={handlePayBalance} noValidate>
              <div className="form-group">
                <label>
                  Payment Method <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPayMethod(val);
                    setBalanceError('');

                    // AUTO-FILL
                    if (isCashMethod(val) && todayRate) {
                      const autoSLSH = Math.round(
                        Number(selected.payment_balance) * todayRate
                      );
                      setPayAmount(autoSLSH.toString());
                    } else if (val) {
                      setPayAmount(
                        Number(selected.payment_balance).toFixed(2)
                      );
                    } else {
                      setPayAmount('');
                    }
                  }}
                  className="form-control"
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
              </div>

              <div className="form-group" style={{ marginTop: 15 }}>
                <label>
                  {isBalanceCash ? 'Amount (SLSH)' : 'Amount ($)'}{' '}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  step={isBalanceCash ? '1' : '0.01'}
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => {
                    setPayAmount(e.target.value);
                    setBalanceError('');
                  }}
                  className="form-control"
                  placeholder={isBalanceCash ? 'e.g. 500000' : 'e.g. 56.00'}
                  disabled={!payMethod}
                />
                {isBalanceCash && payAmount && todayRate && (
                  <small
                    style={{
                      color: '#2563eb',
                      fontWeight: 600,
                      display: 'block',
                      marginTop: 4,
                    }}
                  >
                    ≈ ${(Number(payAmount) / todayRate).toFixed(2)}{' '}
                    <span style={{ color: '#64748b' }}>
                      (1$ = {todayRate.toLocaleString()})
                    </span>
                  </small>
                )}
              </div>

              <div style={{ marginTop: 25, display: 'flex', gap: 10 }}>
                <button
                  type="submit"
                  className="btn-save"
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Submit Payment'}
                </button>
                <button
                  type="button"
                  onClick={closeBalanceModal}
                  className="btn-cancel"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentList;