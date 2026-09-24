import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    Username: '',
    Email: '',
    Password: '',
    Role: 'user',
  });
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ⭐ Hubi haddii Admin la doorto
  const isAdmin = form.Role === 'admin';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');

    // Marka Role la beddelo → nadiifi Admin Code
    if (name === 'Role') {
      if (value !== 'admin') setAdminCode('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.Username.trim() || !form.Email.trim() || !form.Password) {
      setError('Fadlan buuxi Username, Email iyo Password');
      return;
    }
    if (form.Password.length < 6) {
      setError('Password waa inuu ugu yaraan 6 xaraf noqdaa');
      return;
    }

    // Hubi Admin Code haddii Admin la doorto
    if (isAdmin && !adminCode.trim()) {
      setError('Fadlan geli Admin Code');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        Username: form.Username.trim(),
        Email: form.Email.trim(),
        Password: form.Password,
        Role: form.Role,
        Admin_Code: isAdmin ? adminCode.trim() : null,
      });
      alert('Registered successfully! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Register failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div
        style={{
          ...cardStyle,
          boxShadow: isAdmin
            ? '0 30px 60px rgba(197, 168, 89, 0.4)'
            : '0 30px 60px rgba(0, 210, 255, 0.25)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {/* ============================================================
            ⭐ ADMIN INDICATOR — Badge-ka sare
            ============================================================ */}
        {isAdmin && (
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
              background: isAdmin
                ? 'linear-gradient(135deg, #c5a059, #b08b4e)'
                : 'linear-gradient(135deg, #0f2027, #00d2ff)',
              transition: 'background 0.3s ease',
            }}
          >
            <i
              className={
                isAdmin ? 'bi bi-shield-lock-fill' : 'bi bi-person-plus-fill'
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
            {isAdmin ? 'Admin Register' : 'Create Account'}
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              color: isAdmin ? '#c5a059' : '#64748b',
              fontSize: 14,
              fontWeight: isAdmin ? 600 : 400,
            }}
          >
            {isAdmin
              ? 'Administrator Registration — Carwo Furniture'
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
                className={isAdmin ? 'bi bi-shield-fill' : 'bi bi-person'}
                style={{
                  ...iconStyle,
                  color: isAdmin ? '#c5a059' : '#94a3b8',
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
                  borderColor: isAdmin ? '#c5a059' : '#e2e8f0',
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <div style={inputGroupStyle}>
              <i
                className="bi bi-envelope"
                style={{
                  ...iconStyle,
                  color: isAdmin ? '#c5a059' : '#94a3b8',
                }}
              ></i>
              <input
                type="email"
                name="Email"
                value={form.Email}
                onChange={handleChange}
                placeholder="name@gmail.com"
                style={{
                  ...inputStyle,
                  paddingLeft: 40,
                  borderColor: isAdmin ? '#c5a059' : '#e2e8f0',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Password</label>
            <div style={inputGroupStyle}>
              <i
                className="bi bi-lock"
                style={{
                  ...iconStyle,
                  color: isAdmin ? '#c5a059' : '#94a3b8',
                }}
              ></i>
              <input
                type={showPassword ? 'text' : 'password'}
                name="Password"
                value={form.Password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{
                  ...inputStyle,
                  paddingLeft: 40,
                  paddingRight: 44,
                  borderColor: isAdmin ? '#c5a059' : '#e2e8f0',
                }}
              />
              <i
                className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                style={toggleIconStyle}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>

          {/* Account Type */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Account Type</label>
            <div style={inputGroupStyle}>
              <i
                className="bi bi-person-badge"
                style={{
                  ...iconStyle,
                  color: isAdmin ? '#c5a059' : '#94a3b8',
                }}
              ></i>
              <select
                name="Role"
                value={form.Role}
                onChange={handleChange}
                style={{
                  ...inputStyle,
                  paddingLeft: 40,
                  appearance: 'auto',
                  borderColor: isAdmin ? '#c5a059' : '#e2e8f0',
                  fontWeight: 600,
                }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Admin Code — kaliya marka Admin la doorto */}
          {isAdmin && (
            <div
              style={{
                background: '#FFF8E7',
                border: '1px dashed #c5a059',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 18,
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <label
                style={{
                  ...labelStyle,
                  color: '#8B6A1E',
                  fontWeight: 700,
                }}
              >
                <i className="bi bi-shield-lock me-1"></i>
                Admin Code
              </label>
              <div style={inputGroupStyle}>
                <i
                  className="bi bi-key"
                  style={{ ...iconStyle, color: '#c5a059' }}
                ></i>
                <input
                  type="text"
                  value={adminCode}
                  onChange={(e) => {
                    setAdminCode(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter admin code"
                  style={{
                    ...inputStyle,
                    paddingLeft: 40,
                    borderColor: '#c5a059',
                  }}
                  autoComplete="off"
                />
              </div>
              <small
                style={{
                  color: '#8B6A1E',
                  fontSize: 12,
                  marginTop: 6,
                  display: 'block',
                }}
              >
                Admin Code-ka waxaa yaqaan kaliya maamulka
              </small>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...btnStyle,
              background: isAdmin
                ? 'linear-gradient(135deg, #c5a059, #b08b4e)'
                : 'linear-gradient(135deg, #0f2027, #203a43)',
              boxShadow: isAdmin
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
                Creating...
              </>
            ) : (
              <>
                <i
                  className={
                    isAdmin
                      ? 'bi bi-shield-lock me-2'
                      : 'bi bi-person-plus me-2'
                  }
                ></i>
                {isAdmin ? 'Register as Admin' : 'Register'}
              </>
            )}
          </button>
        </form>

        {/* ⭐ Login link — kaliya marka User la doorto */}
        {!isAdmin && (
          <p
            style={{
              textAlign: 'center',
              marginTop: 20,
              fontSize: 14,
              color: '#64748b',
            }}
          >
            Already have account?{' '}
            <Link
              to="/login"
              style={{
                fontWeight: 700,
                color: '#0f2027',
                textDecoration: 'none',
              }}
            >
              Login
            </Link>
          </p>
        )}

        {/* ⭐ Back to Login — kaliya marka Admin la doorto */}
        {isAdmin && (
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
              style={{
                fontWeight: 700,
                color: '#c5a059',
                textDecoration: 'none',
              }}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Back to Admin Login
            </Link>
          </p>
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
        input:focus, select:focus {
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

export default Register;