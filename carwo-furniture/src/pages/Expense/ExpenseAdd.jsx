import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import expenseService from '../../services/expenseService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function ExpenseAdd() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    Ex_Type: '',
    Ex_amount: '',
    Ex_Date: new Date().toISOString().slice(0, 10),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  // Type: ha u oggolaanin digits marka la qorayo
  const handleTypeKeyDown = (e) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
    }
  };

  const validate = () => {
    const err = {};
    const type = form.Ex_Type.trim();

    // TYPE — text only, no numbers
    if (!type) {
      err.Ex_Type = 'Type is required';
    } else if (/^\d+(\.\d+)?$/.test(type)) {
      err.Ex_Type = 'Type cannot be a number. Write text only (e.g. Rent)';
    } else if (/\d/.test(type)) {
      err.Ex_Type = 'Type: letters only (numbers not allowed)';
    } else if (!/^[a-zA-Z\u0600-\u06FF\s\-_/]+$/.test(type)) {
      err.Ex_Type = 'Type: use letters only (e.g. Rent, Electricity)';
    }

    // AMOUNT — number only
    if (form.Ex_amount === '' || form.Ex_amount === null) {
      err.Ex_amount = 'Amount is required';
    } else if (isNaN(Number(form.Ex_amount)) || Number(form.Ex_amount) < 0) {
      err.Ex_amount = 'Enter a valid amount';
    } else if (Number(form.Ex_amount) === 0) {
      err.Ex_amount = 'Amount must be greater than 0';
    }

    // DATE
    if (!form.Ex_Date) {
      err.Ex_Date = 'Date is required';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await expenseService.create({
        Ex_Type: form.Ex_Type.trim(),
        Ex_amount: Number(form.Ex_amount),
        Ex_Date: form.Ex_Date,
      });
      alert('Expense added successfully!');
      navigate('/expense');
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />
      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Add Expense</h1>
          </div>
          <div className="right">
            <Link to="/expense" className="btn-back">
              <i className="bi bi-arrow-left"></i> Back
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="form-card">
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                {/* TYPE — text only */}
                <div className="form-group">
                  <label>
                    Expense Type <span style={{ color: '#ef4444' }}></span>
                  </label>
                  <input
                    type="text"
                    name="Ex_Type"
                    value={form.Ex_Type}
                    onChange={handleChange}
                    onKeyDown={handleTypeKeyDown}
                    placeholder="e.g. Rent, Electricity, Transport"
                    style={{
                      borderColor: errors.Ex_Type ? '#ef4444' : undefined,
                      boxShadow: errors.Ex_Type
                        ? '0 0 0 3px rgba(239,68,68,0.15)'
                        : undefined,
                    }}
                  />
                  {errors.Ex_Type && (
                    <span className="error" style={{ color: '#dc2626', fontSize: 13 }}>
                      <i className="bi bi-exclamation-circle-fill"></i> {errors.Ex_Type}
                    </span>
                  )}
                  <small style={{ color: '#64748b' }}>
                    Letters only — numbers not allowed
                  </small>
                </div>

                {/* AMOUNT — number */}
                <div className="form-group">
                  <label>
                    Amount ($) <span style={{ color: '#ef4444' }}></span>
                  </label>
                  <input
                    type="number"
                    name="Ex_amount"
                    value={form.Ex_amount}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 150.00"
                    style={{
                      borderColor: errors.Ex_amount ? '#ef4444' : undefined,
                      boxShadow: errors.Ex_amount
                        ? '0 0 0 3px rgba(239,68,68,0.15)'
                        : undefined,
                    }}
                  />
                  {errors.Ex_amount && (
                    <span className="error" style={{ color: '#dc2626', fontSize: 13 }}>
                      <i className="bi bi-exclamation-circle-fill"></i> {errors.Ex_amount}
                    </span>
                  )}
                </div>

                {/* DATE */}
                <div className="form-group">
                  <label>
                    Date <span style={{ color: '#ef4444' }}></span>
                  </label>
                  <input
                    type="date"
                    name="Ex_Date"
                    value={form.Ex_Date}
                    onChange={handleChange}
                    style={{
                      borderColor: errors.Ex_Date ? '#ef4444' : undefined,
                      boxShadow: errors.Ex_Date
                        ? '0 0 0 3px rgba(239,68,68,0.15)'
                        : undefined,
                    }}
                  />
                  {errors.Ex_Date && (
                    <span className="error" style={{ color: '#dc2626', fontSize: 13 }}>
                      <i className="bi bi-exclamation-circle-fill"></i> {errors.Ex_Date}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Expense'}
                </button>
                <Link to="/expense" className="btn-cancel">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpenseAdd;