import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import expenseService from '../../services/expenseService';
import paymentService from '../../services/paymentService';
import employeeService from '../../services/employeeService';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}

function formatDisplayDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function money(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SystemReport() {
  const [startDate, setStartDate] = useState(firstOfMonthISO());
  const [endDate, setEndDate] = useState(todayISO());

  const [expenseData, setExpenseData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAll = async (s = startDate, e = endDate) => {
    setLoading(true);
    setError('');
    try {
      const [expRes, payRes, empRes] = await Promise.all([
        expenseService.getReport({ start_date: s, end_date: e }),
        paymentService.getAll(),
        employeeService.getAll(),
      ]);
      setExpenseData(expRes);
      setPayments(Array.isArray(payRes) ? payRes : []);
      setEmployees(Array.isArray(empRes?.data) ? empRes.data : (Array.isArray(empRes) ? empRes : []));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load system report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    loadAll(startDate, endDate);
  };

  const handlePrint = () => {
    window.print();
  };

  // ---- Payments collected within the selected period ----
  const paymentsInRange = payments.filter((p) => {
    const d = p.payment_date ? String(p.payment_date).slice(0, 10) : null;
    if (!d) return false;
    return d >= startDate && d <= endDate;
  });
  const paymentsGrandTotal = paymentsInRange.reduce(
    (acc, p) => acc + (Number(p.amount) || 0),
    0
  );
  const paymentsCount = paymentsInRange.length;

  // ---- Expenses within the selected period ----
  const expensesGrandTotal = Number(expenseData?.grand_total || 0);
  const expensesCount = Number(expenseData?.total_count || 0);
  const byType = expenseData?.by_type || [];

  // ---- Employee salaries (current roster, not period-based) ----
  const totalSalary = employees.reduce(
    (acc, emp) => acc + (Number(emp.E_Salary) || 0),
    0
  );
  const employeeCount = employees.length;

  // ---- Combined totals ----
  const totalOutgoings = expensesGrandTotal + totalSalary;
  const netResult = paymentsGrandTotal - totalOutgoings;
  const isProfit = netResult >= 0;

  const dayCount = daysBetween(startDate, endDate);

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#f4f5f7',
        fontFamily:
          "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sr-card { animation: fadeInUp 0.35s ease both; }
        .sr-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
        }
        .sr-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }
        .sr-btn:active { transform: translateY(0); }
        .sr-summary:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.10) !important;
        }
        .sr-table-row:hover { background: #fafafa; }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* Header banner */}
      <div
        style={{
          background: 'linear-gradient(120deg, #0a1a33 0%, #16233f 55%, #1c2b4a 100%)',
          color: '#fff',
          padding: '26px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #c8963e',
          flexWrap: 'wrap',
          gap: 18,
          boxShadow: '0 4px 20px rgba(10, 26, 51, 0.25)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: '2px solid #c8963e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color: '#c8963e',
              flexShrink: 0,
              background: 'rgba(200,150,62,0.08)',
            }}
          >
            <i className="bi bi-house-heart-fill"></i>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, fontFamily: 'Georgia, serif' }}>
              CARWO FURNITURE
            </div>
            <div style={{ fontSize: 12, color: '#c8963e', letterSpacing: 0.5 }}>
              Home Decorations System
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 27, fontWeight: 700, fontFamily: 'Georgia, serif', letterSpacing: 1.5 }}>
            OVERALL SYSTEM REPORT
          </div>
          <div style={{ height: 1, width: 170, background: '#c8963e', margin: '9px auto 0', opacity: 0.6 }} />
        </div>

        <div
          style={{
            border: '1px solid #c8963e',
            borderRadius: 8,
            padding: '9px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#c8963e',
            whiteSpace: 'nowrap',
            background: 'rgba(200,150,62,0.06)',
          }}
        >
          <i className="bi bi-calendar3"></i>
          {formatDisplayDate(todayISO())}
        </div>
      </div>

      {/* Page body */}
      <div className="print-area" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px 48px' }}>
        {/* Filter row */}
        <div
          className="sr-card"
          style={{
            background: '#fff',
            borderRadius: 14,
            padding: 22,
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 24,
            flexWrap: 'wrap',
            marginBottom: 24,
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 6, fontWeight: 600 }}>
              Start Date
            </label>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-calendar3" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}></i>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '10px 14px 10px 34px', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', minWidth: 190 }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 6, fontWeight: 600 }}>
              End Date
            </label>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-calendar3" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }}></i>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '10px 14px 10px 34px', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', minWidth: 190 }}
              />
            </div>
          </div>
          <button
            type="button"
            className="sr-btn"
            onClick={handleFilter}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 8,
              border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
              background: '#7a1418', color: '#fff', boxShadow: '0 4px 12px rgba(122,20,24,0.25)',
            }}
          >
            <i className="bi bi-funnel-fill"></i> FILTER REPORT
          </button>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="sr-btn"
            onClick={handlePrint}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #fecaca',
              background: '#fff', color: '#b91c1c', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', padding: '10px 18px', borderRadius: 8,
            }}
          >
            <i className="bi bi-file-earmark-arrow-down"></i> Export PDF
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 14, borderRadius: 10, marginBottom: 16, border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Loading report...</p>
        ) : (
          <>
            {/* Report for banner */}
            <div
              className="sr-card"
              style={{
                background: '#faf3e8', border: '1px solid #f0dcb2', borderRadius: 10,
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 20, fontSize: 14,
              }}
            >
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#7a1418', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                <i className="bi bi-calendar3"></i>
              </span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>Report for:</span>
              <span style={{ color: '#7a1418', fontWeight: 700 }}>
                {formatDisplayDate(startDate)} - {formatDisplayDate(endDate)}
              </span>
              <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 13 }}>
                {dayCount} day{dayCount > 1 ? 's' : ''} · Salaries reflect current roster
              </span>
            </div>

            {/* Top summary cards: the three source totals */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: 18,
                marginBottom: 18,
              }}
            >
              <SummaryCard
                circleColor="#4c8a2b"
                icon="bi-cash-stack"
                label="PAYMENTS COLLECTED"
                value={`$${money(paymentsGrandTotal)}`}
                valueColor="#4c8a2b"
                sub={`${paymentsCount} payment${paymentsCount !== 1 ? 's' : ''}`}
              />
              <SummaryCard
                circleColor="#7a1418"
                icon="bi-wallet2"
                label="EXPENSES"
                value={`$${money(expensesGrandTotal)}`}
                valueColor="#7a1418"
                sub={`${expensesCount} expense${expensesCount !== 1 ? 's' : ''}`}
              />
              <SummaryCard
                circleColor="#0f2540"
                icon="bi-people-fill"
                label="TOTAL SALARY"
                value={`$${money(totalSalary)}`}
                valueColor="#0f2540"
                sub={`${employeeCount} employee${employeeCount !== 1 ? 's' : ''}`}
              />
              <SummaryCard
                circleColor="#c8963e"
                icon="bi-graph-up-arrow"
                label="TOTAL OUTGOINGS"
                value={`$${money(totalOutgoings)}`}
                valueColor="#c8963e"
                sub="Expenses + Salary"
              />
            </div>

            {/* Combined calculation table */}
            <div
              className="sr-card"
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                background: '#fff',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                marginBottom: 24,
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
                <thead>
                  <tr style={{ background: '#7a1418', color: '#fff' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, letterSpacing: 0.5 }}>#</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, letterSpacing: 0.5 }}>LINE</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 13, letterSpacing: 0.5 }}>AMOUNT ($)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="sr-table-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '13px 16px', color: '#64748b' }}>1</td>
                    <td style={{ padding: '13px 16px' }}>
                      <i className="bi bi-cash-stack" style={{ color: '#4c8a2b', marginRight: 8 }}></i>
                      Payments Grand Total
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 700, color: '#4c8a2b' }}>
                      ${money(paymentsGrandTotal)}
                    </td>
                  </tr>
                  <tr className="sr-table-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '13px 16px', color: '#64748b' }}>2</td>
                    <td style={{ padding: '13px 16px' }}>
                      <i className="bi bi-wallet2" style={{ color: '#7a1418', marginRight: 8 }}></i>
                      Expenses Grand Total
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 700, color: '#7a1418' }}>
                      - ${money(expensesGrandTotal)}
                    </td>
                  </tr>
                  <tr className="sr-table-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '13px 16px', color: '#64748b' }}>3</td>
                    <td style={{ padding: '13px 16px' }}>
                      <i className="bi bi-people-fill" style={{ color: '#7a1418', marginRight: 8 }}></i>
                      Total Salary
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 700, color: '#7a1418' }}>
                      - ${money(totalSalary)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: isProfit ? '#eaf6ea' : '#fdeceb', fontWeight: 800 }}>
                    <td style={{ padding: '16px 16px' }} colSpan="2">
                      <i className="bi bi-award-fill" style={{ color: '#c8963e', marginRight: 8 }}></i>
                      <span style={{ color: isProfit ? '#276749' : '#b91c1c' }}>
                        NET {isProfit ? 'PROFIT' : 'LOSS'}:
                      </span>
                    </td>
                    <td style={{ padding: '16px 16px', textAlign: 'right', fontSize: 18, color: isProfit ? '#276749' : '#b91c1c' }}>
                      {isProfit ? '' : '-'}${money(Math.abs(netResult))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Expense breakdown by category, for reference */}
            <div
              className="sr-card"
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                background: '#fff',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                marginBottom: 30,
              }}
            >
              <div style={{ padding: '16px 20px 4px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                <i className="bi bi-tags-fill" style={{ color: '#7a1418', marginRight: 8 }}></i>
                Expenses by Category
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
                <thead>
                  <tr style={{ background: '#7a1418', color: '#fff' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, letterSpacing: 0.5 }}>#</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, letterSpacing: 0.5 }}>EXPENSE CATEGORY</th>
                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, letterSpacing: 0.5 }}>NO. OF TIMES</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 13, letterSpacing: 0.5 }}>TOTAL AMOUNT ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {byType.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                        No expenses for this period
                      </td>
                    </tr>
                  ) : (
                    byType.map((row, i) => (
                      <tr key={i} className="sr-table-row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '13px 16px', color: '#64748b' }}>{i + 1}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <i className="bi bi-tag-fill" style={{ color: '#7a1418', marginRight: 8 }}></i>
                          {row.type}
                        </td>
                        <td style={{ padding: '13px 16px', textAlign: 'center' }}>{row.count}</td>
                        <td style={{ padding: '13px 16px', textAlign: 'right', fontWeight: 700 }}>
                          ${money(row.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
              <button
                type="button"
                className="sr-btn"
                onClick={handlePrint}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 26px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  background: '#c8963e', color: '#fff', boxShadow: '0 4px 14px rgba(200,150,62,0.35)',
                }}
              >
                <i className="bi bi-printer-fill"></i> PRINT REPORT
              </button>
              <Link
                to="/dashboard"
                className="sr-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 26px', borderRadius: 8,
                  border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  background: '#fff', color: '#334155', textDecoration: 'none',
                }}
              >
                <i className="bi bi-arrow-left"></i> BACK TO DASHBOARD
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ circleColor, icon, label, value, valueColor, sub }) {
  return (
    <div
      className="sr-card sr-summary"
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '20px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 2px 14px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div
        style={{
          width: 50, height: 50, borderRadius: '50%', background: circleColor, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
        }}
      >
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 25, fontWeight: 800, color: valueColor, lineHeight: 1.3 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{sub}</div>
      </div>
    </div>
  );
}

export default SystemReport;