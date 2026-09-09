import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import Sidebar from '../../components/Sidebar';
import 'bootstrap-icons/font/bootstrap-icons.css';

function ChangePassword() {
  const navigate = useNavigate();
  const currentUser = authService.getUser();
  const [collapsed, setCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Toggles for showing passwords
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!authService.isAdmin()) {
      navigate('/');
      return;
    }
    const load = async () => {
      try {
        const data = await authService.getUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };
    load();
  }, [navigate]);

  const selectedUser = users.find(
    (u) => String(u.User_id) === String(selectedId)
  );

  const isChangingSelf =
    selectedUser &&
    currentUser &&
    Number(selectedUser.User_id) === Number(currentUser.User_id);

  const handleTypeChange = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    setError('');
    setSuccess('');
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const u = users.find((x) => String(x.User_id) === String(id));
    setEmail(u?.Email || '');
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedId) {
      setError('Fadlan dooro Type (account)');
      return;
    }
    if (!form.newPassword || !form.confirmPassword) {
      setError('Fadlan buuxi New Password iyo Confirm');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }
    if (isChangingSelf && !form.currentPassword) {
      setError('Current password is required for your own account');
      return;
    }

    setSaving(true);
    try {
      if (isChangingSelf) {
        await authService.changeMyPassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        });
      } else {
        await authService.adminSetPassword(selectedId, form.newPassword);
      }
      setSuccess(`Password updated for ${selectedUser?.Username || 'user'}`);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (!authService.isAdmin()) return null;

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />
      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        {/* ===== Enhanced Header ===== */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 32px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 22,
                color: '#1e1e2f',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 8,
              }}
            >
              <i className="bi bi-list"></i>
            </button>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: '#1e1e2f',
              }}
            >
              Change Password
            </h1>
          </div>
          <div>
            <Link
              to="/users"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 18px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                transition: '0.2s',
                border: '1px solid #e2e8f0',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f1f5f9';
              }}
            >
              <i className="bi bi-arrow-left"></i> Back to Users
            </Link>
          </div>
        </header>

        {/* ===== Center Content with Professional Card ===== */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '40px 20px',
            minHeight: 'calc(100vh - 90px)',
            backgroundColor: '#f8fafc',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: '#ffffff',
              borderRadius: 20,
              padding: '36px 34px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
              border: '1px solid #f0f2f5',
            }}
          >
            {/* Header of Card */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0f2027, #00d2ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                }}
              >
                <i className="bi bi-shield-lock" style={{ fontSize: 28, color: '#fff' }}></i>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#1e1e2f',
                }}
              >
                Change Password
              </h2>
              <p
                style={{
                  margin: '6px 0 0',
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                Dooro Type → Email ayaa isku buuxinaya
              </p>
            </div>

            {/* Error / Success Alerts */}
            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  color: '#b91c1c',
                  padding: '12px 14px',
                  borderRadius: 10,
                  marginBottom: 16,
                  fontSize: 13,
                  borderLeft: '4px solid #b91c1c',
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  background: '#f0fdf4',
                  color: '#166534',
                  padding: '12px 14px',
                  borderRadius: 10,
                  marginBottom: 16,
                  fontSize: 13,
                  borderLeft: '4px solid #166534',
                }}
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* TYPE - with Icon (Removed *) */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: 5,
                    fontSize: 13,
                    color: '#334155',
                    letterSpacing: '0.3px',
                  }}
                >
                  Type
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i
                    className="bi bi-person-badge"
                    style={{
                      position: 'absolute',
                      left: 14,
                      fontSize: 18,
                      color: '#94a3b8',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}
                  ></i>
                  {loadingUsers ? (
                    <p style={{ fontSize: 13, color: '#64748b', padding: '12px 0' }}>
                      Loading...
                    </p>
                  ) : (
                    <select
                      value={selectedId}
                      onChange={handleTypeChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 40px',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: 12,
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        backgroundColor: '#f8fafc',
                        appearance: 'auto',
                      }}
                    >
                      <option value="">-- Select Type --</option>
                      {users.map((u) => (
                        <option key={u.User_id} value={u.User_id}>
                          {u.Username} ({u.Role === 'admin' ? 'Admin' : 'User'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* EMAIL - with Icon (ReadOnly) */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: 5,
                    fontSize: 13,
                    color: '#334155',
                    letterSpacing: '0.3px',
                  }}
                >
                  Email
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i
                    className="bi bi-envelope"
                    style={{
                      position: 'absolute',
                      left: 14,
                      fontSize: 18,
                      color: '#94a3b8',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}
                  ></i>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    placeholder="Email appears after selecting Type"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 40px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 12,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#f1f5f9',
                      cursor: 'not-allowed',
                      color: email ? '#1e293b' : '#94a3b8',
                    }}
                  />
                </div>
              </div>

              {/* Current Password (only for self) - with Icon + Toggle (Removed *) */}
              {isChangingSelf && (
                <div style={{ marginBottom: 18 }}>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: 5,
                      fontSize: 13,
                      color: '#334155',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Current Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i
                      className="bi bi-lock"
                      style={{
                        position: 'absolute',
                        left: 14,
                        fontSize: 18,
                        color: '#94a3b8',
                        zIndex: 2,
                        pointerEvents: 'none',
                      }}
                    ></i>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      name="currentPassword"
                      value={form.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter current password"
                      style={{
                        width: '100%',
                        padding: '12px 44px 12px 40px',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: 12,
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        backgroundColor: '#f8fafc',
                      }}
                    />
                    <i
                      className={`bi ${showCurrent ? 'bi-eye-slash' : 'bi-eye'}`}
                      style={{
                        position: 'absolute',
                        right: 14,
                        fontSize: 18,
                        color: '#94a3b8',
                        cursor: 'pointer',
                        zIndex: 2,
                      }}
                      onClick={() => setShowCurrent(!showCurrent)}
                    ></i>
                  </div>
                </div>
              )}

              {/* New Password - with Icon + Toggle (Removed *) */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: 5,
                    fontSize: 13,
                    color: '#334155',
                    letterSpacing: '0.3px',
                  }}
                >
                  New Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i
                    className="bi bi-lock-fill"
                    style={{
                      position: 'absolute',
                      left: 14,
                      fontSize: 18,
                      color: '#94a3b8',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}
                  ></i>
                  <input
                    type={showNew ? 'text' : 'password'}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password (min 6 chars)"
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 40px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 12,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: '#f8fafc',
                    }}
                  />
                  <i
                    className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'}`}
                    style={{
                      position: 'absolute',
                      right: 14,
                      fontSize: 18,
                      color: '#94a3b8',
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                    onClick={() => setShowNew(!showNew)}
                  ></i>
                </div>
              </div>

              {/* Confirm Password - with Icon + Toggle (Removed *) */}
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: 5,
                    fontSize: 13,
                    color: '#334155',
                    letterSpacing: '0.3px',
                  }}
                >
                  Confirm New Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <i
                    className="bi bi-shield-check"
                    style={{
                      position: 'absolute',
                      left: 14,
                      fontSize: 18,
                      color: '#94a3b8',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}
                  ></i>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter new password"
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 40px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 12,
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      backgroundColor: '#f8fafc',
                    }}
                  />
                  <i
                    className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`}
                    style={{
                      position: 'absolute',
                      right: 14,
                      fontSize: 18,
                      color: '#94a3b8',
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                    onClick={() => setShowConfirm(!showConfirm)}
                  ></i>
                </div>
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'center',
                  marginTop: 4,
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: 'none',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #0f2027, #203a43)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.1s, box-shadow 0.2s',
                    boxShadow: '0 4px 12px rgba(15, 32, 39, 0.3)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? (
                    <>
                      <i
                        className="bi bi-arrow-repeat"
                        style={{ animation: 'spin 1s linear infinite' }}
                      ></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i> Update Password
                    </>
                  )}
                </button>
                <Link
                  to="/"
                  style={{
                    padding: '14px 24px',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 12,
                    backgroundColor: '#f8fafc',
                    color: '#334155',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 15,
                    transition: '0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8fafc';
                  }}
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Global Styles for animations and focus */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        input:focus, select:focus {
          border-color: #0f2027 !important;
          box-shadow: 0 0 0 3px rgba(15, 32, 39, 0.12) !important;
          background-color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

export default ChangePassword;