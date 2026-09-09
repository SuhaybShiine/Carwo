import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import paymentService from '../../services/paymentService';

const EXCHANGE_RATE = 11500;

function PaymentReceipt() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await paymentService.getById(id);
        setPayment(res);
      } catch (e) {
        setError('Payment not found');
      }
    };
    load();
  }, [id]);

  if (error) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: '#b91c1c' }}>{error}</p>
          <Link to="/payment" style={styles.linkBack}>
            Back to List
          </Link>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: 'center', padding: 100, color: '#1a2a44' }}>
          Loading receipt...
        </div>
      </div>
    );
  }

  const itemsList = payment.items_raw
    ? payment.items_raw.split(';').map((i) => {
        const [name, qty, price] = i.split(':');
        return {
          name: name || 'Item',
          qty: Number(qty) || 1,
          price: Number(price) || 0,
        };
      })
    : [];

  const isPaid = Number(payment.payment_balance) <= 0;
  const amount = Number(payment.amount) || 0;
  const orderTotal = Number(payment.O_Total) || 0;
  const balance = Number(payment.payment_balance) || 0;

  return (
    <div style={styles.page}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .receipt-paper {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            max-width: 100% !important;
            padding: 24px !important;
          }
        }
      `}</style>

      {/* RECEIPT */}
      <div className="receipt-paper" style={styles.paper}>
        {/* Gold top bar */}
        <div style={styles.topBar} />

        {/* PAID stamp */}
        {isPaid && <div style={styles.stamp}>PAID</div>}

        {/* Brand */}
        <div style={styles.brand}>
          <div style={styles.logoCircle}>
            <span style={{ fontSize: 22 }}>🛋️</span>
          </div>
          <h1 style={styles.brandName}>CARWO FURNITURE</h1>
          <p style={styles.tagline}>Home Decorations · Excellence in Every Piece</p>
          <div style={styles.titleRow}>
            <div style={styles.line} />
            <h2 style={styles.receiptTitle}>OFFICIAL RECEIPT</h2>
            <div style={styles.line} />
          </div>
        </div>

        {/* Meta info */}
        <div style={styles.infoGrid}>
          <div>
            <InfoRow label="Receipt No." value={`#CARWO-${String(payment.payment_id).padStart(5, '0')}`} />
            <InfoRow
              label="Date Paid"
              value={
                payment.payment_date
                  ? String(payment.payment_date).slice(0, 10)
                  : '-'
              }
            />
            <InfoRow label="Customer" value={payment.C_Name || 'N/A'} />
          </div>
          <div>
            <InfoRow label="Payment Method" value={payment.payment_method || '-'} />
            <InfoRow
              label="Appointment"
              value={
                payment.O_AppointmentDate
                  ? String(payment.O_AppointmentDate).slice(0, 10)
                  : '-'
              }
            />
            <InfoRow label="Branch" value="Hargeisa Main" />
          </div>
        </div>

        {/* Items table */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, textAlign: 'left' }}>DESCRIPTION</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>QTY</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>UNIT PRICE</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {itemsList.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>
                  No items listed
                </td>
              </tr>
            ) : (
              itemsList.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ ...styles.td, textAlign: 'left', fontWeight: 600 }}>
                    {item.name}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    ${item.price.toFixed(2)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>
                    ${(item.price * item.qty).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Amount paid banner */}
        <div style={styles.paidBanner}>
          <p style={styles.paidLabel}>AMOUNT PAID THIS TRANSACTION</p>
          <h1 style={styles.paidAmount}>${amount.toFixed(2)}</h1>
          <p style={styles.paidSos}>
            ({(amount * EXCHANGE_RATE).toLocaleString()} SOS)
          </p>
        </div>

        {/* Totals */}
        <div style={styles.totalsGrid}>
          <div style={styles.totalBox}>
            <p style={styles.totalLabel}>Grand Total</p>
            <h3 style={styles.totalValue}>${orderTotal.toFixed(2)}</h3>
          </div>
          <div style={styles.totalBox}>
            <p style={styles.totalLabel}>Balance Due</p>
            <h3
              style={{
                ...styles.totalValue,
                color: isPaid ? '#16a34a' : '#dc2626',
              }}
            >
              {isPaid ? 'PAID' : `$${balance.toFixed(2)}`}
            </h3>
          </div>
        </div>

        {/* Thank you + signature */}
        <div style={styles.footer}>
          <p style={styles.thanks}>
            “Thank you for your business! We look forward to serving you again.”
          </p>
          <div style={styles.signRow}>
            <div>
              <div style={styles.signLine} />
              <p style={styles.signText}>Authorized Signature</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#1a2a44' }}>
                CARWO FURNITURE
              </p>
              <p style={{ margin: '4px 0 0' }}>Hargeisa, Somaliland</p>
              <p style={{ margin: '2px 0 0' }}>www.carwofurniture.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* BUTTONS — HOOSE */}
      <div className="no-print" style={styles.actionsBottom}>
        <button onClick={() => window.print()} style={styles.btnPrint}>
          <i className="bi bi-printer" style={{ marginRight: 8 }}></i>
          Print Receipt
        </button>
        <Link to="/payment" style={styles.btnBack}>
          <i className="bi bi-arrow-left" style={{ marginRight: 8 }}></i>
          Back to List
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 8, fontSize: 14, lineHeight: 1.6 }}>
      <strong
        style={{
          display: 'inline-block',
          minWidth: 130,
          color: '#64748b',
          fontWeight: 600,
        }}
      >
        {label}
      </strong>
      <span style={{ color: '#1e293b', fontWeight: 600 }}>: {value}</span>
    </div>
  );
}

const styles = {
  page: {
    background: 'linear-gradient(160deg, #e8eef5 0%, #f5f0e8 100%)',
    minHeight: '100vh',
    padding: '40px 16px 60px',
    fontFamily: '"Segoe UI", system-ui, sans-serif',
  },
  paper: {
    background: '#fff',
    maxWidth: 780,
    margin: '0 auto',
    padding: '0 48px 40px',
    position: 'relative',
    boxShadow: '0 20px 50px rgba(26, 42, 68, 0.12)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  topBar: {
    height: 8,
    background: 'linear-gradient(90deg, #1a2a44, #c5a059, #1a2a44)',
    margin: '0 -48px 32px',
  },
  stamp: {
    position: 'absolute',
    top: 70,
    right: 40,
    border: '3px double #16a34a',
    color: '#16a34a',
    padding: '6px 16px',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 900,
    transform: 'rotate(-12deg)',
    opacity: 0.85,
    letterSpacing: 2,
  },
  brand: { textAlign: 'center', marginBottom: 28 },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a2a44, #2c3e5e)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    boxShadow: '0 4px 12px rgba(26,42,68,0.25)',
  },
  brandName: {
    margin: 0,
    color: '#1a2a44',
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: 2,
  },
  tagline: {
    margin: '6px 0 0',
    color: '#c5a059',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 22,
    gap: 16,
  },
  line: { flex: 1, height: 1, background: '#e2e8f0' },
  receiptTitle: {
    margin: 0,
    fontSize: 14,
    color: '#1a2a44',
    fontWeight: 700,
    letterSpacing: 3,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24,
    marginBottom: 28,
    padding: '16px 0',
    borderTop: '1px dashed #e2e8f0',
    borderBottom: '1px dashed #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: 28,
  },
  th: {
    padding: '12px 14px',
    background: '#1a2a44',
    color: '#fff',
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: 600,
  },
  td: {
    padding: '12px 14px',
    fontSize: 14,
    color: '#1e293b',
  },
  paidBanner: {
    background: 'linear-gradient(135deg, #1a2a44 0%, #2c3e5e 100%)',
    color: '#fff',
    padding: '28px 24px',
    borderRadius: 12,
    textAlign: 'center',
    marginBottom: 24,
    boxShadow: '0 8px 24px rgba(26,42,68,0.2)',
  },
  paidLabel: {
    margin: '0 0 8px',
    fontSize: 11,
    color: '#c5a059',
    fontWeight: 700,
    letterSpacing: 2,
  },
  paidAmount: {
    fontSize: 48,
    fontWeight: 800,
    margin: 0,
    letterSpacing: 1,
  },
  paidSos: {
    margin: '8px 0 0',
    fontSize: 16,
    color: '#c5a059',
    fontWeight: 600,
  },
  totalsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 32,
  },
  totalBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '18px 16px',
    textAlign: 'center',
  },
  totalLabel: {
    margin: 0,
    fontSize: 12,
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValue: {
    margin: '6px 0 0',
    fontSize: 22,
    fontWeight: 800,
    color: '#1a2a44',
  },
  footer: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: 24,
  },
  thanks: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
    fontSize: 14,
    margin: '0 0 32px',
  },
  signRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signLine: {
    borderBottom: '1px solid #1a2a44',
    width: 160,
    marginBottom: 6,
  },
  signText: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
  },
  actionsBottom: {
    maxWidth: 780,
    margin: '28px auto 0',
    display: 'flex',
    justifyContent: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  btnPrint: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #1a2a44, #2c3e5e)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
    boxShadow: '0 4px 14px rgba(26,42,68,0.3)',
  },
  btnBack: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 28px',
    background: '#fff',
    color: '#1a2a44',
    border: '2px solid #1a2a44',
    borderRadius: 10,
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 14,
  },
  linkBack: {
    color: '#1a2a44',
    fontWeight: 700,
    textDecoration: 'none',
  },
};

export default PaymentReceipt;