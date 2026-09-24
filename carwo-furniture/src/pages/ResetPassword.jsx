import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import 'bootstrap-icons/font/bootstrap-icons.css';

function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetToken = sessionStorage.getItem('reset_token');

  useEffect(() => {
    if (!resetToken) navigate('/forgot-password', { replace: true });
    if (authService.isLoggedIn()) navigate('/', { replace: true });
  }, [resetToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password waa in uu 6 xaraf ka badan yahay');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Labada password isku mid ma aha');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword(resetToken, newPassword);
      setMessage(res.message || 'Password-kaaga waa la beddelay!');

      // Nadiifi sessionStorage
      sessionStorage.removeItem('reset_email');
      sessionStorage.removeItem('reset_token');

      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Link-kan waa uu dhacay');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={logoCircle}>
            <i className="bi bi-shield-lock" style={{ fontSize: 28 }}></i>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#1e1e2f', fontWeight: 700 }}>
            Create New Password
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
            Password-kaagu waa in uu 6 xaraf ka badan yahay
          </p>
        </div>

        {error && <div style={errStyle}>{error}</div>}
        {message && <div style={okStyle}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>New Password</label>
            <div style={inputGroupStyle}>
              <i className="bi bi-lock" style={iconStyle}></i>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{ ...inputStyle, paddingLeft: 40, paddingRight: 44 }}
                required
                autoFocus
              />
              <i
                className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                style={toggleIconStyle}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Confirm New Password</label>
            <div style={inputGroupStyle}>
              <i className="bi bi-shield-check" style={iconStyle}></i>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                style={{ ...inputStyle, paddingLeft: 40 }}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }}></i>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Reset Password
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          <Link to="/login" style={{ fontWeight: 700, color: '#0f2027', textDecoration: 'none' }}>
            <i className="bi bi-arrow-left me-1"></i>
            Back to Login
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
const inputGroupStyle = { position: 'relative', display: 'flex', alignItems: 'center' };
const iconStyle = { position: 'absolute', left: 14, fontSize: 18, color: '#94a3b8', zIndex: 2, pointerEvents: 'none' };
const toggleIconStyle = { position: 'absolute', right: 14, fontSize: 18, color: '#94a3b8', cursor: 'pointer', zIndex: 2 };
const inputStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc' };
const btnStyle = { width: '100%', padding: '14px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #0f2027, #203a43)', color: '#fff', fontWeight: 700, fontSize: 16, marginTop: 8, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 32, 39, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' };
const errStyle = { background: '#fef2f2', color: '#b91c1c', padding: '12px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, borderLeft: '4px solid #b91c1c' };
const okStyle = { background: '#f0fdf4', color: '#166534', padding: '12px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, borderLeft: '4px solid #166534' };

export default ResetPassword;