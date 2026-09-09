import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

const EXCHANGE_RATE = 11500;

function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [balanceError, setBalanceError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getAll();
      setPayments(Array.isArray(data) ? data : []);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Ma hubtaa inaad tirtirto lacagtan?')) return;
    try {
      await paymentService.remove(id);
      fetchPayments();
    } catch (error) {
      alert('Error deleting payment');
    }
  };

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
    if (Number(payAmount) > Number(selected.payment_balance) + 0.01) {
      setBalanceError(
        `Kama badnaan karto remaining ($${Number(selected.payment_balance).toFixed(2)})`
      );
      return;
    }
    if (!payMethod) {
      setBalanceError('Dooro payment method');
      return;
    }

    setSubmitting(true);
    try {
      await paymentService.payBalance(selected.payment_id, {
        amount_paid: Number(payAmount),
        payment_method: payMethod,
      });
      alert('Baaqigii waa laga qabtay!');
      closeBalanceModal();
      fetchPayments();
    } catch (error) {
      setBalanceError(error.response?.data?.message || 'Khalad baa dhacay');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = (Array.isArray(payments) ? payments : []).filter(
    (p) =>
      p.C_Name?.toLowerCase().includes(search.toLowerCase()) ||
      p.items_with_qty?.toLowerCase().includes(search.toLowerCase()) ||
      String(p.payment_id).includes(search) ||
      p.payment_method?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = filtered.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );

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
          <div className="right" style={{ display: 'flex', gap: 10 }}>
            <Link to="/payment/report" className="btn-back">
              <i className="bi bi-bar-chart"></i> Report
            </Link>
            <Link to="/payment/add" className="btn-add">
              <i className="bi bi-plus-lg"></i> Add Payment
            </Link>
          </div>
        </header>

        <div className="content">
          <div style={{ position: 'relative', maxWidth: 400, marginBottom: 20 }}>
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
                  <th>Amount Paid ($ / SOS)</th>
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
                  filtered.map((p) => (
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
                          ${Number(p.amount || 0).toFixed(2)}
                        </div>
                        <small style={{ color: '#2563eb' }}>
                          {p.amount_sos ||
                            (
                              Number(p.amount || 0) * EXCHANGE_RATE
                            ).toLocaleString()}{' '}
                          SOS
                        </small>
                      </td>
                      <td>{p.payment_method}</td>
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
                  ))
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
            }}
          >
            <div>
              <div style={{ opacity: 0.85, fontSize: 14 }}>
                Total Amount Paid{search ? ' (filtered)' : ''}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                ${totalPaid.toFixed(2)}
              </div>
              <div style={{ fontSize: 13, color: '#93c5fd', marginTop: 4 }}>
                {(totalPaid * EXCHANGE_RATE).toLocaleString()} SOS
              </div>
            </div>
            <i
              className="bi bi-cash-stack"
              style={{ fontSize: 36, opacity: 0.4 }}
            ></i>
          </div>
        </div>
      </div>

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
            style={{ width: 400, padding: 25, borderRadius: 12 }}
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
                  Amount to Pay ($) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selected.payment_balance}
                  value={payAmount}
                  onChange={(e) => {
                    setPayAmount(e.target.value);
                    setBalanceError('');
                  }}
                  className="form-control"
                />
                {payAmount && Number(payAmount) > 0 && (
                  <small style={{ color: '#2563eb' }}>
                    {(Number(payAmount) * EXCHANGE_RATE).toLocaleString()} SOS
                  </small>
                )}
              </div>

              <div className="form-group" style={{ marginTop: 15 }}>
                <label>
                  Payment Method <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => {
                    setPayMethod(e.target.value);
                    setBalanceError('');
                  }}
                  className="form-control"
                >
                  <option value="">-- Select Method --</option>
                  <option value="ZAAD Kaash">ZAAD Kaash</option>
                  <option value="ZAAD Dollor">ZAAD Dollor</option>
                  <option value="E-Dahab">E-Dahab</option>
                  <option value="Cash">Cash</option>
                </select>
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