import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import exchangeRateService from '../../services/exchangeRateService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

const NAVY = '#1a2744';
const GOLD = '#c5a059';
const GREEN = '#0f291e';

function ExchangeRate() {
  const [collapsed, setCollapsed] = useState(false);
  const [rates, setRates] = useState([]);
  const [todayRate, setTodayRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    rate_date: today,
    rate: '',
    note: '',
  });

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const [allRates, todayData] = await Promise.all([
        exchangeRateService.getAll(),
        exchangeRateService.getToday(),
      ]);
      setRates(Array.isArray(allRates) ? allRates : []);
      setTodayRate(todayData);
    } catch (err) {
      console.error(err);
      alert('Wuu ku guuldareystay inuu soo akhriyo xogta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================
  // FORM HANDLERS
  // ============================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const next = {};
    if (!form.rate_date) next.rate_date = 'Taariikhda waa qasab';
    if (!form.rate || Number(form.rate) <= 0)
      next.rate = 'Rate-ku waa in uu ka badan yahay 0';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await exchangeRateService.save({
        rate_date: form.rate_date,
        rate: Number(form.rate),
        note: form.note,
      });
      alert(res.message || 'Rate-ka waa la kaydiyay!');
      setForm({ rate_date: today, rate: '', note: '' });
      setEditing(null);
      setErrors({});
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Khalad baa dhacay');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rate) => {
    setEditing(rate.rate_id);
    setForm({
      rate_date: String(rate.rate_date).slice(0, 10),
      rate: rate.rate,
      note: rate.note || '',
    });
    setErrors({});
    const el = document.getElementById('form-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setForm({ rate_date: today, rate: '', note: '' });
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ma hubtaa inaad tirtirto rate-kan?')) return;
    try {
      await exchangeRateService.remove(id);
      fetchData();
    } catch (err) {
      alert('Khalad baa dhacay xiliga tirtirka');
    }
  };

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
            <h1>Exchange Rate — Sarif</h1>
          </div>
          <div className="right">
            <Link to="/payment" className="btn-back">
              <i className="bi bi-arrow-left"></i> Back to Payments
            </Link>
          </div>
        </header>

        <div className="content">

          {/* ================= HERO ================= */}
          <div
            style={{
              background: `linear-gradient(135deg, ${GREEN} 0%, #1e3f35 100%)`,
              color: '#fff',
              borderRadius: 16,
              padding: '28px 32px',
              marginBottom: 22,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.85, textTransform: 'uppercase' }}>
              Today's Exchange Rate — {today}
            </div>
            {todayRate?.rate ? (
              <>
                <div style={{ fontSize: 42, fontWeight: 800, margin: '6px 0 4px' }}>
                  1 USD = {Number(todayRate.rate).toLocaleString()} SLSH
                </div>
                <div style={{ color: GOLD, fontWeight: 600 }}>
                  <i className="bi bi-check-circle-fill"></i> Rate-ka maanta waa la dhigay
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, fontWeight: 800, margin: '6px 0 4px', color: '#fbf0d9' }}>
                  ⚠ No rate set for today
                </div>
                <div>Fadlan geli qiimaha sarifka maanta hoos</div>
              </>
            )}
          </div>

          {/* ================= STATS ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard
              label="Today's Rate"
              value={todayRate?.rate ? `${Number(todayRate.rate).toLocaleString()} SLSH` : '—'}
              sub="1 USD = SLSH"
              color={GREEN}
            />
            <StatCard
              label="Latest Rate"
              value={rates[0]?.rate ? `${Number(rates[0].rate).toLocaleString()} SLSH` : '—'}
              sub={rates[0]?.rate_date ? String(rates[0].rate_date).slice(0, 10) : 'No data'}
              color={GOLD}
            />
            <StatCard
              label="Total Rates"
              value={rates.length}
              sub="Maalmo la diiwaangeliyay"
              color={NAVY}
            />
          </div>

          {/* ================= FORM + LIST ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>

            {/* ========== FORM ========== */}
            <div id="form-section" className="form-card">
              <h3 style={{ marginTop: 0, color: NAVY }}>
                {editing ? '✏️ Edit Exchange Rate' : '➕ Add Exchange Rate'}
              </h3>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="rate_date"
                    value={form.rate_date}
                    onChange={handleChange}
                    className="form-control"
                    style={{ borderColor: errors.rate_date ? '#ef4444' : undefined }}
                  />
                  {errors.rate_date && (
                    <small style={{ color: '#ef4444' }}>{errors.rate_date}</small>
                  )}
                  <small style={{ color: '#64748b' }}>
                    Taariikhda sarifku khuseeyo
                  </small>
                </div>

                <div className="form-group" style={{ marginTop: 15 }}>
                  <label>1 USD = ? SLSH</label>
                  <input
                    type="number"
                    name="rate"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 11830"
                    value={form.rate}
                    onChange={handleChange}
                    className="form-control"
                    style={{ borderColor: errors.rate ? '#ef4444' : undefined }}
                  />
                  {errors.rate && (
                    <small style={{ color: '#ef4444' }}>{errors.rate}</small>
                  )}
                  <small style={{ color: '#64748b' }}>
                    Tusaale: 1$ = 11830 SLSH → geli <b>11830</b>
                  </small>
                </div>

                <div className="form-group" style={{ marginTop: 15 }}>
                  <label>Note</label>
                  <input
                    type="text"
                    name="note"
                    placeholder="Optional — e.g. Market rate"
                    value={form.note}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>

                <div style={{ marginTop: 25, display: 'flex', gap: 10 }}>
                  <button
                    type="submit"
                    className="btn-save"
                    disabled={saving}
                    style={{ flex: 1 }}
                  >
                    {saving ? 'Saving...' : editing ? 'Update Rate' : 'Save Rate'}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn-cancel"
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* ========== LIST ========== */}
            <div className="table-card">
              <div style={{ padding: '18px 22px', borderBottom: '2px solid #efe7ec' }}>
                <h3 style={{ margin: 0, color: NAVY }}>
                  <i className="bi bi-clock-history"></i> Rate History
                </h3>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  Loading...
                </div>
              ) : rates.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  <i
                    className="bi bi-coin"
                    style={{
                      fontSize: 42,
                      opacity: 0.3,
                      display: 'block',
                      marginBottom: 10,
                    }}
                  ></i>
                  Weli ma jiro sarif la diiwaangeliyay.
                </div>
              ) : (
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  <table className="table" style={{ marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>1 USD =</th>
                        <th>Note</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.map((r) => {
                        const isToday =
                          String(r.rate_date).slice(0, 10) === today;
                        return (
                          <tr
                            key={r.rate_id}
                            style={{
                              background: isToday
                                ? 'linear-gradient(90deg, rgba(201,168,108,0.1), transparent 70%)'
                                : undefined,
                            }}
                          >
                            <td>
                              <b>{String(r.rate_date).slice(0, 10)}</b>
                              {isToday && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    background: `linear-gradient(135deg, ${GOLD}, #b08b4e)`,
                                    color: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: 20,
                                    fontSize: 10,
                                    fontWeight: 700,
                                  }}
                                >
                                  TODAY
                                </span>
                              )}
                            </td>
                            <td>
                              <b style={{ color: GREEN, fontSize: 15 }}>
                                {Number(r.rate).toLocaleString()}
                              </b>{' '}
                              <small style={{ color: '#94a3b8' }}>SLSH</small>
                            </td>
                            <td style={{ color: '#64748b', fontSize: 13 }}>
                              {r.note || '—'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => handleEdit(r)}
                                className="btn-edit"
                                title="Edit"
                                style={{ marginRight: 5 }}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(r.rate_id)}
                                className="btn-delete"
                                title="Delete"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================
function StatCard({ label, value, sub, color }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1,
          color: '#8a7a83',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginTop: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#8a7a83', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

export default ExchangeRate;