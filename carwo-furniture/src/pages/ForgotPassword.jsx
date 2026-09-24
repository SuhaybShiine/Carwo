import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import 'bootstrap-icons/font/bootstrap-icons.css';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authService.isLoggedIn()) navigate('/', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCode('');

    if (!email.trim()) {
      setError('Fadlan geli email-kaaga');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      sessionStorage.setItem('reset_email', email.trim());

      // ⭐ OFFLINE: Code-ka waa la soo bandhigay
      if (res.code) {
        setCode(res.code);
      } else {
        navigate('/verify-code');
      }
    } catch (err) {
      // ⭐ Muuji fariinta cad ee backend-ka
      const msg =
        err.response?.data?.message ||
        'Khalad baa dhacay. Fadlan hubi email-kaaga ama la xiriir maamulka.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const goToVerify = () => {
    navigate('/verify-code');
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={logoCircle}>
            <i className="bi bi-shield-lock" style={{ fontSize: 28 }}></i>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#1e1e2f', fontWeight: 700 }}>
            Forgot Password
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
            Admin-kaliya ayaa isticmaali kara
          </p>
        </div>

        {error && <div style={errStyle}>{error}</div>}

        {!code ? (
          <form onSubmit={handleSubmit}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email Address (Admin)</label>
              <div style={inputGroupStyle}>
                <i className="bi bi-envelope" style={iconStyle}></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="admin@example.com"
                  style={{ ...inputStyle, paddingLeft: 40 }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? (
                <>
                  <i
                    className="bi bi-arrow-repeat"
                    style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}
                  ></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Send Verification Code
                </>
              )}
            </button>

            {/* ⭐ Fariinta cad ee user-ka caadiga ah */}
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fcd34d',
                borderRadius: 10,
                padding: '12px 14px',
                marginTop: 16,
                fontSize: 12,
                color: '#92400e',
                lineHeight: 1.6,
              }}
            >
              <i className="bi bi-info-circle me-1"></i>
              <strong>Ogeysiis:</strong> Haddii aad tahay <b>User</b> (ma aha Admin), ma isticmaali kartid
              Forget Password. Fadlan la xiriir <b>Admin-ka</b> si uu password-kaaga kuu beddelo.
            </div>
          </form>
        ) : (
          // ⭐ CODE-KA WAA LA SOO BANDHIGAY
          <div>
            <div
              style={{
                background: '#f0fdf4',
                border: '2px solid #16a34a',
                borderRadius: 12,
                padding: '20px',
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  color: '#166534',
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 10,
                }}
              >
                <i className="bi bi-check-circle me-1"></i>
                Code-kaaga Xaqiijinta
              </div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: '#0f2027',
                  letterSpacing: 8,
                  fontFamily: 'Courier New, monospace',
                  background: '#fff',
                  padding: '12px',
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              >
                {code}
              </div>
              <div style={{ color: '#64748b', fontSize: 12 }}>
                Code-kan wuxuu shaqeynayaa 10 daqiiqo
              </div>
            </div>

            <button onClick={goToVerify} style={btnStyle}>
              <i className="bi bi-arrow-right me-2"></i>
              Geli Code-ka
            </button>
          </div>
        )}

        <p
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 14,
            color: '#64748b',
          }}
        >
          <Link
            to="/login"
            style={{ fontWeight: 700, color: '#0f2027', textDecoration: 'none' }}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Back to Login
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
  padding: 20,
  fontFamily: "'Segoe UI', system-ui, sans-serif",
};
const cardStyle = {
  width: '100%',
  maxWidth: 440,
  background: '#ffffff',
  borderRadius: 20,
  padding: '40px 34px',
  boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
};
const logoCircle = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #0f2027, #00d2ff)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 12px',
  boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
};
const fieldStyle = { marginBottom: 18 };
const labelStyle = {
  display: 'block',
  fontWeight: 600,
  marginBottom: 5,
  fontSize: 13,
  color: '#334155',
};
const inputGroupStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};
const iconStyle = {
  position: 'absolute',
  left: 14,
  fontSize: 18,
  color: '#94a3b8',
  zIndex: 2,
  pointerEvents: 'none',
};
const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 12,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#f8fafc',
};
const btnStyle = {
  width: '100%',
  padding: '14px',
  border: 'none',
  borderRadius: 12,
  background: 'linear-gradient(135deg, #0f2027, #203a43)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 16,
  marginTop: 8,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(15, 32, 39, 0.3)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};
const errStyle = {
  background: '#fef2f2',
  color: '#b91c1c',
  padding: '12px 14px',
  borderRadius: 10,
  marginBottom: 16,
  fontSize: 13,
  borderLeft: '4px solid #b91c1c',
};

export default ForgotPassword;