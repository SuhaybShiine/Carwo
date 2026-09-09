import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import customerService from '../../services/customerService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function CustomerAdd() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    C_Name: '',
    C_address: '',
    C_phone: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'C_Name') {
      const lettersOnly = value.replace(/[0-9]/g, '');
      setForm({ ...form, [name]: lettersOnly });
    } else {
      setForm({ ...form, [name]: value });
    }

    setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.C_Name.trim()) {
      newErrors.C_Name = 'Name is required';
    } else if (!/^[A-Za-z\s'-]+$/.test(form.C_Name)) {
      newErrors.C_Name = 'Name cannot contain numbers or symbols';
    }

    if (!form.C_phone.trim()) newErrors.C_phone = 'Phone is required';
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.C_phone)) {
      newErrors.C_phone = 'Enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await customerService.create(form);
      alert('Customer added successfully');
      navigate('/customer');
    } catch (error) {
      const message = error.response?.data?.message || 'Error adding customer';
      if (message.toLowerCase().includes('phone')) {
        setErrors({ ...errors, C_phone: message });
      } else {
        alert(message);
      }
      console.error(error);
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
            <h1>Add Customer</h1>
          </div>
          <div className="right">
            <Link to="/customer" className="btn-back">
              <i className="bi bi-arrow-left"></i> Back to List
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name </label>
                  <input
                    type="text"
                    name="C_Name"
                    value={form.C_Name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                  {errors.C_Name && <span className="error">{errors.C_Name}</span>}
                </div>

                <div className="form-group">
                  <label>Phone </label>
                  <input
                    type="text"
                    name="C_phone"
                    value={form.C_phone}
                    onChange={handleChange}
                    placeholder="e.g. 0612345678"
                  />
                  {errors.C_phone && <span className="error">{errors.C_phone}</span>}
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="C_address"
                    value={form.C_address}
                    onChange={handleChange}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Customer'}
                </button>
                <Link to="/customer" className="btn-cancel">Cancel</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerAdd;