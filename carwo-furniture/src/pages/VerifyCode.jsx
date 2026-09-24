import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import 'bootstrap-icons/font/bootstrap-icons.css';

function VerifyCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const email = sessionStorage.getItem('reset_email');

  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
    if (authService.isLoggedIn()) navigate('/', { replace: true });
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!code.trim() || code.length !== 6) {
      setError('Fadlan geli 6-ta xaraf ee code-ka');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyCode(email, code.trim());
      // Ku kaydi resetToken sessionStorage
      sessionStorage.setItem('reset_token', res.resetToken);
      navigate('/reset-password');
    } catch (err) {
      setError(err.response?.data?.message || 'Code-ka waa khalad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={logoCircle}>
            <i className="bi bi-shield-check" style={{ fontSize: 28 }}></i>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#1e1e2f', fontWeight: 700 }}>
            Enter Security Code
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
            Code-ka waxaa loo diray <b>{email}</b>
          </p>
        </div>

        {error && <div style={errStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>6-Digit Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(v);
                setError('');
              }}
              placeholder="000000"
              maxLength={6}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e2e8f0',
                borderRadius: 12,
                fontSize: 32,
                textAlign: 'center',
                letterSpacing: 12,
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#f8fafc',
                fontFamily: 'Courier New, monospace',
              }}
              autoFocus
              required
            />
          </div>

          <button type="submit" disabled={loading || code.length !== 6} style={btnStyle}>
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}></i>
                Verifying...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Verify Code
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          <Link to="/forgot-password" style={{ fontWeight: 700, color: '#0f2027', textDecoration: 'none' }}>
            <i className="bi bi-arrow-left me-1"></i>
            Resend Code
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const pageStyle = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', padding: 20, fontFamily: "'Segoe UI', system-ui, sans-serif" };
const cardStyle = { width: '100%', maxWidth: 440, background: '#ffffff', borderRadius: 20, padding: '40px 34px', boxShadow: '0 30px 60px rgba(0,0,0,0.4)' };
const logoCircle = { width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #0f2027, #00d2ff)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' };
const fieldStyle = { marginBottom: 18 };
const labelStyle = { display: 'block', fontWeight: 600, marginBottom: 5, fontSize: 13, color: '#334155' };
const btnStyle = { width: '100%', padding: '14px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #0f2027, #203a43)', color: '#fff', fontWeight: 700, fontSize: 16, marginTop: 8, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 32, 39, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const errStyle = { background: '#fef2f2', color: '#b91c1c', padding: '12px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, borderLeft: '4px solid #b91c1c' };

export default VerifyCode;