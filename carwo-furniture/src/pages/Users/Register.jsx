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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
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

    setLoading(true);
    try {
      await authService.register({
        Username: form.Username.trim(),
        Email: form.Email.trim(),
        Password: form.Password,
        Role: form.Role,
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
      <div style={cardStyle}>
        {/* Header with icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={logoCircle}>
            <i className="bi bi-person-plus-fill" style={{ fontSize: 28 }}></i>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#1e1e2f', fontWeight: 700 }}>
            Register
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
            Carwo Furniture System
          </p>
        </div>

        {error && <div style={errStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Username with icon */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Username </label>
            <div style={inputGroupStyle}>
              <i className="bi bi-person" style={iconStyle}></i>
              <input
                name="Username"
                value={form.Username}
                onChange={handleChange}
                placeholder="Enter username"
                style={{ ...inputStyle, paddingLeft: 40 }}
              />
            </div>
          </div>

          {/* Email with icon */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Email </label>
            <div style={inputGroupStyle}>
              <i className="bi bi-envelope" style={iconStyle}></i>
              <input
                type="email"
                name="Email"
                value={form.Email}
                onChange={handleChange}
                placeholder="name@gmail.com"
                style={{ ...inputStyle, paddingLeft: 40 }}
              />
            </div>
          </div>

          {/* Password with icon + toggle */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Password </label>
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

          {/* Role with icon */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Account Type </label>
            <div style={inputGroupStyle}>
              <i className="bi bi-person-badge" style={iconStyle}></i>
              <select
                name="Role"
                value={form.Role}
                onChange={handleChange}
                style={{ ...inputStyle, paddingLeft: 40, appearance: 'auto' }}
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          {/* Submit button with loading spinner */}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}></i>
                Creating...
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>

        {/* Link to Login */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Already have account?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: '#0f2027', textDecoration: 'none' }}>
            Login
          </Link>
        </p>

     
    

        <div style={socialContainer}>
          {/* Google */}
          <a href="#" style={socialIconStyle} className="social-icon-link" title="Google">
            <i className="bi bi-google" style={{ fontSize: 20, color: '#ea4335' }}></i>
          </a>
          {/* Facebook */}
          <a href="#" style={socialIconStyle} className="social-icon-link" title="Facebook">
            <i className="bi bi-facebook" style={{ fontSize: 20, color: '#1877f2' }}></i>
          </a>
          {/* Twitter / X */}
          <a href="#" style={socialIconStyle} className="social-icon-link" title="Twitter">
            <i className="bi bi-twitter-x" style={{ fontSize: 20, color: '#000000' }}></i>
          </a>
          {/* Instagram */}
          <a href="#" style={socialIconStyle} className="social-icon-link" title="Instagram">
            <i className="bi bi-instagram" style={{ fontSize: 20, color: '#e4405f' }}></i>
          </a>
        </div>
      </div>

      {/* Global styles for spinner, focus, and social hover */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Focus effect for inputs and select */
        input:focus, select:focus {
          border-color: #0f2027 !important;
          box-shadow: 0 0 0 3px rgba(15, 32, 39, 0.15) !important;
          background-color: #ffffff !important;
        }

        /* Social icon hover effect */
        .social-icon-link:hover {
          background: #f1f5f9 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
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

export default Register;