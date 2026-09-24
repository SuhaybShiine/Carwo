import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import paymentService from '../../services/paymentService';

const NAVY = '#1a2744';
const GOLD = '#c5a059';

function PaymentReceipt() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await paymentService.getById(id);
        setPayment(res?.data || res);
      } catch (e) {
        setError('Payment not found');
      }
    };
    load();
  }, [id]);

  if (error) {
    return (
      <div style={s.page}>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: '#b91c1c' }}>{error}</p>
          <Link to="/payment" style={s.btnBack}>
            Back to List
          </Link>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={s.page}>
        <div style={{ textAlign: 'center', padding: 80, color: NAVY }}>
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
  const status = isPaid ? 'PAID' : 'BALANCE DUE';

  // ============================================================
  // SARIF — Rate-ka la isticmaalay
  // ============================================================
  const rate = Number(payment.exchange_rate_used) || 0;
  const paidAmount = Number(payment.paid_amount) || amount;
  const paidCurrency = payment.paid_currency || 'USD';
  const isCash = paidCurrency === 'SLSH' && rate > 0;

  return (
    <div style={s.page} className="receipt-page">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .receipt-page {
            background: #fff !important;
            padding: 0 !important;
            min-height: auto !important;
          }
          .receipt-paper {
            box-shadow: none !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="receipt-paper" style={s.paper}>
        <div style={s.cornerTL} />
        <div style={s.cornerTR} />

        <div style={s.brandBlock}>
          <div style={s.logoWrap}>
            <span style={{ fontSize: 28 }}>🛋️</span>
          </div>
          <h1 style={s.brandTitle}>Carwo Furniture</h1>
          <p style={s.brandCity}>HARGEISA, SOMALILAND</p>
          <p style={s.brandTag}>Home Decor · Quality · Trust</p>
        </div>

        <div style={s.contactRow}>
          <span>📞 +252 63 XXX XXXX</span>
          <span>📍 Hargeisa Main</span>
          <span>💳 ZAAD / E-Dahab / Cash</span>
        </div>

        <div style={s.goldLine} />

        <div style={s.metaBlock}>
          <MetaRow
            label="RECEIPT #:"
            value={`#CARWO-${String(payment.payment_id).padStart(5, '0')}`}
          />
          <MetaRow
            label="DATE:"
            value={
              payment.payment_date
                ? String(payment.payment_date).slice(0, 10)
                : '-'
            }
          />
          <MetaRow
            label="ORDER #:"
            value={payment.O_id ? `ORD-${payment.O_id}` : '-'}
          />
          <MetaRow label="CUSTOMER:" value={payment.C_Name || 'N/A'} />
          <MetaRow label="METHOD:" value={payment.payment_method || '-'} />

          {/* SARIF ROW */}
          {rate > 0 && (
            <MetaRow
              label="EXCHANGE RATE:"
              value={`1$ = ${rate.toLocaleString()} SLSH`}
            />
          )}

          {payment.O_AppointmentDate && (
            <MetaRow
              label="APPOINTMENT:"
              value={String(payment.O_AppointmentDate).slice(0, 10)}
            />
          )}
          <MetaRow label="SERVED BY:" value={payment.E_Name || 'N/A'} />
        </div>

        <div style={s.dashLine} />

        <div style={s.itemsHead}>
          <span>ITEMS</span>
          <span>PRICE</span>
        </div>

        <div style={s.itemsBody}>
          {itemsList.length === 0 ? (
            <div style={{ ...s.itemRow, color: '#94a3b8' }}>No items</div>
          ) : (
            itemsList.map((item, index) => (
              <div key={index} style={s.itemRow}>
                <span>
                  {item.qty}x {item.name}
                </span>
                <span style={{ fontWeight: 600 }}>
                  ${(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={s.dashLine} />

        <div style={s.totalRows}>
          <div style={s.totalLine}>
            <span>Order Total</span>
            <span>${orderTotal.toFixed(2)}</span>
          </div>

          {/* HADDII SLSH */}
          {isCash && (
            <div style={s.totalLine}>
              <span>Paid in SLSH</span>
              <span>
                {paidAmount.toLocaleString()} SLSH
              </span>
            </div>
          )}

          <div style={s.totalLine}>
            <span>Paid (this receipt)</span>
            <span>${amount.toFixed(2)}</span>
          </div>
        </div>

        <div style={s.totalBar}>
          <span>TOTAL PAID</span>
          <span>${amount.toFixed(2)}</span>
        </div>

        <div style={s.balanceBlock}>
          <div style={s.balanceRow}>
            <span
              style={{
                fontWeight: 800,
                color: NAVY,
                letterSpacing: 1,
              }}
            >
              BALANCE DUE
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: 18,
                color: isPaid ? '#16a34a' : NAVY,
              }}
            >
              {isPaid ? 'PAID' : `$${balance.toFixed(2)}`}
            </span>
          </div>

          {/* SARIF BALANCE */}
          {rate > 0 && (
            <p style={s.balanceSos}>
              {isPaid
                ? `Amount SLS: ${(amount * rate).toLocaleString()} SLS`
                : `Balance SLS: ${(balance * rate).toLocaleString()} SLS`}
            </p>
          )}
        </div>

        <div style={s.goldLine} />

        <p style={s.thanks}>— Thank you! Please come again. —</p>
        <p style={s.status}>Status: {status}</p>

        <div style={s.cornerBL} />
        <div style={s.cornerBR} />
      </div>

      <div className="no-print" style={s.actions}>
        <button
          type="button"
          onClick={() => window.print()}
          style={s.btnPrint}
        >
          🖨️ Print Receipt
        </button>
        <Link to="/payment" style={s.btnBack}>
          ← Back to List
        </Link>
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8,
        fontSize: 14,
      }}
    >
      <span style={{ fontWeight: 700, color: NAVY }}>{label}</span>
      <span style={{ fontWeight: 600, color: NAVY, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

const s = {
  page: {
    background: '#e8eef5',
    minHeight: '100vh',
    padding: '32px 16px 48px',
    fontFamily: '"Segoe UI", system-ui, sans-serif',
  },
  paper: {
    background: '#fffef9',
    maxWidth: 420,
    margin: '0 auto',
    padding: '28px 28px 36px',
    position: 'relative',
    boxShadow: '0 12px 40px rgba(26, 39, 68, 0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 70,
    height: 70,
    borderTop: `6px solid ${NAVY}`,
    borderLeft: `6px solid ${NAVY}`,
    borderTopLeftRadius: 4,
    boxShadow: `inset 3px 3px 0 ${GOLD}`,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 70,
    height: 70,
    borderTop: `6px solid ${NAVY}`,
    borderRight: `6px solid ${NAVY}`,
    borderTopRightRadius: 4,
    boxShadow: `inset -3px 3px 0 ${GOLD}`,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 70,
    height: 70,
    borderBottom: `6px solid ${NAVY}`,
    borderLeft: `6px solid ${NAVY}`,
    borderBottomLeftRadius: 4,
    boxShadow: `inset 3px -3px 0 ${GOLD}`,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 70,
    height: 70,
    borderBottom: `6px solid ${NAVY}`,
    borderRight: `6px solid ${NAVY}`,
    borderBottomRightRadius: 4,
    boxShadow: `inset -3px -3px 0 ${GOLD}`,
  },
  brandBlock: { textAlign: 'center', marginBottom: 14, paddingTop: 8 },
  logoWrap: {
    width: 52,
    height: 52,
    margin: '0 auto 8px',
    borderRadius: '50%',
    border: `2px solid ${GOLD}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
  },
  brandTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: NAVY },
  brandCity: {
    margin: '4px 0 0',
    fontSize: 11,
    fontWeight: 700,
    color: GOLD,
    letterSpacing: 2,
  },
  brandTag: {
    margin: '8px 0 0',
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  contactRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '8px 14px',
    fontSize: 11,
    color: NAVY,
    fontWeight: 600,
    marginBottom: 12,
  },
  goldLine: {
    height: 2,
    background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
    margin: '10px 0 14px',
  },
  metaBlock: { marginBottom: 8 },
  dashLine: { borderTop: '1.5px dashed #cbd5e1', margin: '12px 0' },
  itemsHead: {
    display: 'flex',
    justifyContent: 'space-between',
    background: NAVY,
    color: '#fff',
    padding: '10px 14px',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 4,
  },
  itemsBody: { padding: '4px 0' },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 6px',
    fontSize: 14,
    color: NAVY,
    borderBottom: '1px solid #f1f5f9',
  },
  totalRows: { padding: '4px 6px' },
  totalLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    color: NAVY,
    marginBottom: 6,
    fontWeight: 600,
  },
  totalBar: {
    display: 'flex',
    justifyContent: 'space-between',
    background: NAVY,
    color: '#fff',
    padding: '12px 14px',
    borderRadius: 6,
    fontWeight: 800,
    fontSize: 16,
    letterSpacing: 1,
    marginTop: 8,
  },
  balanceBlock: { marginTop: 14, padding: '0 4px' },
  balanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceSos: {
    margin: '6px 0 0',
    textAlign: 'right',
    fontSize: 12,
    color: '#64748b',
    fontWeight: 600,
  },
  thanks: {
    textAlign: 'center',
    color: GOLD,
    fontSize: 13,
    margin: '16px 0 8px',
    fontWeight: 600,
  },
  status: {
    textAlign: 'center',
    color: NAVY,
    fontSize: 13,
    fontWeight: 700,
    fontStyle: 'italic',
    margin: 0,
  },
  actions: {
    maxWidth: 420,
    margin: '24px auto 0',
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  btnPrint: {
    padding: '12px 24px',
    background: NAVY,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
  },
  btnBack: {
    padding: '12px 24px',
    background: '#fff',
    color: NAVY,
    border: `2px solid ${NAVY}`,
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 14,
  },
};

export default PaymentReceipt;