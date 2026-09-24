import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ Username: '', Password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ⭐ Hubi haddii Username-ku u eg yahay Admin
  const isAdminUsername = (username) => {
    if (!username) return false;
    const u = String(username).trim().toLowerCase();
    return u === 'admin' || u.startsWith('admin');
  };

  const showAdminIndicator = isAdminUsername(form.Username);

  // ⭐ Haddii user-ku horey u login → dashboard
  useEffect(() => {
    if (authService.isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.Username.trim() || !form.Password) {
      setError('Fadlan geli Username iyo Password');
      return;
    }

    setLoading(true);
    try {
      await authService.login({
        Username: form.Username.trim(),
        Password: form.Password,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div
        style={{
          ...cardStyle,
          boxShadow: showAdminIndicator
            ? '0 30px 60px rgba(197, 168, 89, 0.4)'
            : '0 30px 60px rgba(0, 210, 255, 0.25)',
          transition: 'box-shadow 0.3s ease',
        }}
      >

        {/* ============================================================
            ⭐ ADMIN INDICATOR — Badge-ka sare
            ============================================================ */}
        {showAdminIndicator && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'linear-gradient(135deg, #c5a059, #b08b4e)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(197, 168, 89, 0.4)',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <i className="bi bi-shield-fill-check"></i>
            Admin Access
          </div>
        )}

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              ...logoCircle,
              background: showAdminIndicator
                ? 'linear-gradient(135deg, #c5a059, #b08b4e)'
                : 'linear-gradient(135deg, #0f2027, #00d2ff)',
              transition: 'background 0.3s ease',
            }}
          >
            <i
              className={
                showAdminIndicator
                  ? 'bi bi-shield-lock-fill'
                  : 'bi bi-box-arrow-in-right'
              }
              style={{ fontSize: 28 }}
            ></i>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              color: '#1e1e2f',
              fontWeight: 700,
            }}
          >
            {showAdminIndicator ? 'Admin Login' : 'Welcome Back'}
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              color: showAdminIndicator ? '#c5a059' : '#64748b',
              fontSize: 14,
              fontWeight: showAdminIndicator ? 600 : 400,
            }}
          >
            {showAdminIndicator
              ? 'Administrator Access — Carwo Furniture'
              : 'Carwo Furniture System'}
          </p>
        </div>

        {error && <div style={errStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Username</label>
            <div style={inputGroupStyle}>
              <i
                className={
                  showAdminIndicator ? 'bi bi-shield-fill' : 'bi bi-person'
                }
                style={{
                  ...iconStyle,
                  color: showAdminIndicator ? '#c5a059' : '#94a3b8',
                }}
              ></i>
              <input
                name="Username"
                value={form.Username}
                onChange={handleChange}
                placeholder="Enter username"
                style={{
                  ...inputStyle,
                  paddingLeft: 40,
                  borderColor: showAdminIndicator ? '#c5a059' : '#e2e8f0',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Password</label>
            <div style={inputGroupStyle}>
              <i className="bi bi-lock" style={iconStyle}></i>
              <input
                type={showPassword ? 'text' : 'password'}
                name="Password"
                value={form.Password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingLeft: 40, paddingRight: 44 }}
              />
              <i
                className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                style={toggleIconStyle}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>

          {/* ============================================================
              ⭐ ADMIN — Forgot Password link-ka wuu soo baxaa
              ============================================================ */}
          {showAdminIndicator && (
            <div
              style={{
                textAlign: 'right',
                marginTop: -8,
                marginBottom: 16,
              }}
            >
              <Link
                to="/forgot-password"
                style={{
                  color: '#c5a059',
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                <i className="bi bi-key me-1"></i>
                Forgot password?
              </Link>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnStyle,
              background: showAdminIndicator
                ? 'linear-gradient(135deg, #c5a059, #b08b4e)'
                : 'linear-gradient(135deg, #0f2027, #203a43)',
              boxShadow: showAdminIndicator
                ? '0 4px 12px rgba(197, 168, 89, 0.4)'
                : '0 4px 12px rgba(15, 32, 39, 0.3)',
            }}
          >
            {loading ? (
              <>
                <i
                  className="bi bi-arrow-repeat"
                  style={{
                    marginRight: 8,
                    animation: 'spin 1s linear infinite',
                  }}
                ></i>
                Signing in...
              </>
            ) : (
              <>
                <i
                  className={
                    showAdminIndicator
                      ? 'bi bi-shield-lock me-2'
                      : 'bi bi-box-arrow-in-right me-2'
                  }
                ></i>
                {showAdminIndicator ? 'Admin Login' : 'Login'}
              </>
            )}
          </button>
        </form>

        {/* ============================================================
            ⭐ ADMIN-KALIYA — Register link
            User-ku ma arko Register iyo Forgot labadaba
            ============================================================ */}
        {showAdminIndicator ? (
          <p
            style={{
              textAlign: 'center',
              marginTop: 20,
              fontSize: 14,
              color: '#64748b',
            }}
          >
            <i
              className="bi bi-shield-fill-check me-1"
              style={{ color: '#c5a059' }}
            ></i>
            Ma lihid akoon Admin?{' '}
            <Link
              to="/register"
              style={{
                fontWeight: 700,
                color: '#c5a059',
                textDecoration: 'none',
              }}
            >
              Register
            </Link>
          </p>
        ) : (
          <div style={{ height: 20 }}></div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input:focus {
          border-color: #0f2027 !important;
          box-shadow: 0 0 0 3px rgba(15, 32, 39, 0.15) !important;
          background-color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

// ===== Styles =====
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
  position: 'relative',
  transition: 'box-shadow 0.3s ease',
};

const logoCircle = {
  width: 64,
  height: 64,
  borderRadius: '50%',
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

const toggleIconStyle = {
  position: 'absolute',
  right: 14,
  fontSize: 18,
  color: '#94a3b8',
  cursor: 'pointer',
  zIndex: 2,
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
  transition: 'border-color 0.2s',
};

const btnStyle = {
  width: '100%',
  padding: '14px',
  border: 'none',
  borderRadius: 12,
  color: '#fff',
  fontWeight: 700,
  fontSize: 16,
  marginTop: 8,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s ease',
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

export default Login;