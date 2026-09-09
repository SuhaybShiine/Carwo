import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ Username: '', Password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.Username.trim() || !form.Password) {
      setError('Fadlan geli username iyo password');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login({
        Username: form.Username.trim(),
        Password: form.Password,
      });
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Header with icon */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={logoCircle}>
            <i className="bi bi-house-heart-fill" style={{ fontSize: 30 }}></i>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#1e1e2f', fontWeight: 700 }}>
            Carwo Furniture
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
            Sign in to continue
          </p>
        </div>

        {/* Error message */}
        {error && <div style={errStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Username with icon */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Username</label>
            <div style={inputGroupStyle}>
              <i className="bi bi-person" style={iconStyle}></i>
              <input
                type="text"
                name="Username"
                value={form.Username}
                onChange={(e) => setForm({ ...form, Username: e.target.value })}
                placeholder="Enter your username"
                style={{ ...inputStyle, paddingLeft: 40 }}
                autoFocus
              />
            </div>
          </div>

          {/* Password with icon + toggle */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Password</label>
            <div style={inputGroupStyle}>
              <i className="bi bi-lock" style={iconStyle}></i>
              <input
                type={showPassword ? 'text' : 'password'}
                name="Password"
                value={form.Password}
                onChange={(e) => setForm({ ...form, Password: e.target.value })}
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

          {/* Submit button with loading spinner */}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}></i>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Link to Register */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          No account?{' '}
          <Link to="/register" style={{ fontWeight: 700, color: '#0f2027', textDecoration: 'none' }}>
            Register
          </Link>
        </p>

        {/* === SOCIAL MEDIA ICONS (as you requested) === */}
     

        <div style={socialContainer}>
          {/* Google */}
          <a href="#" style={socialIconStyle} title="Google">
            <i className="bi bi-google" style={{ fontSize: 20, color: '#ea4335' }}></i>
          </a>
          {/* Facebook */}
          <a href="#" style={socialIconStyle} title="Facebook">
            <i className="bi bi-facebook" style={{ fontSize: 20, color: '#1877f2' }}></i>
          </a>
          {/* Twitter / X */}
          <a href="#" style={socialIconStyle} title="Twitter">
            <i className="bi bi-twitter-x" style={{ fontSize: 20, color: '#000000' }}></i>
          </a>
          {/* Instagram */}
          <a href="#" style={socialIconStyle} title="Instagram">
            <i className="bi bi-instagram" style={{ fontSize: 20, color: '#e4405f' }}></i>
          </a>
        </div>
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Focus effect for inputs */
        input:focus {
          border-color: #0f2027 !important;
          box-shadow: 0 0 0 3px rgba(15, 32, 39, 0.15) !important;
          background-color: #ffffff !important;
        }
        select:focus {
          border-color: #0f2027 !important;
          box-shadow: 0 0 0 3px rgba(15, 32, 39, 0.15) !important;
        }
        /* Social icon hover */
        .social-icon-link:hover {
          background: #f1f5f9 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}

// ===== Professional Styles =====
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
  transition: 'transform 0.2s ease',
};

const logoCircle = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #0f2027, #00d2ff)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 14px',
  color: '#fff',
  boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
};

const fieldStyle = { marginBottom: 18 };

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  marginBottom: 5,
  fontSize: 13,
  color: '#334155',
  letterSpacing: '0.3px',
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
  transition: 'border-color 0.2s, box-shadow 0.2s',
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
  transition: 'transform 0.1s, box-shadow 0.2s',
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

// === Social Media Styles ===
const dividerStyle = {
  display: 'flex',
  alignItems: 'center',
  marginTop: 24,
  marginBottom: 20,
  gap: 10,
};

const dividerText = {
  fontSize: 12,
  color: '#94a3b8',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '0 8px',
};

const socialContainer = {
  display: 'flex',
  justifyContent: 'center',
  gap: 16,
  marginBottom: 4,
};

const socialIconStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 44,
  height: 44,
  borderRadius: '50%',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
};

export default Login;