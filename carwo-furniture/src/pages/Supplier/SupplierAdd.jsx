import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import supplierService from '../../services/supplierService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function SupplierAdd() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    Sup_Name: '',
    Sup_address: '',
    Sup_phone: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'Sup_Name') {
      const lettersOnly = value.replace(/[0-9]/g, '');
      setForm({ ...form, [name]: lettersOnly });
    } else {
      setForm({ ...form, [name]: value });
    }

    setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.Sup_Name.trim()) {
      newErrors.Sup_Name = 'Name is required';
    } else if (!/^[A-Za-z\s'-]+$/.test(form.Sup_Name)) {
      newErrors.Sup_Name = 'Name cannot contain numbers or symbols';
    }

    if (!form.Sup_phone.trim()) newErrors.Sup_phone = 'Phone is required';
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.Sup_phone)) {
      newErrors.Sup_phone = 'Enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await supplierService.create(form);
      alert('Supplier added successfully');
      navigate('/supplier');
    } catch (error) {
      const message = error.response?.data?.message || 'Error adding supplier';
      if (message.toLowerCase().includes('phone')) {
        setErrors({ ...errors, Sup_phone: message });
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
            <h1>Add Supplier</h1>
          </div>
          <div className="right">
            <Link to="/supplier" className="btn-back">
              <i className="bi bi-arrow-left"></i> Back to List
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="form-card">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Supplier Name </label>
                  <input
                    type="text"
                    name="Sup_Name"
                    value={form.Sup_Name}
                    onChange={handleChange}
                    placeholder="Enter supplier name"
                  />
                  {errors.Sup_Name && <span className="error">{errors.Sup_Name}</span>}
                </div>

                <div className="form-group">
                  <label>Phone </label>
                  <input
                    type="text"
                    name="Sup_phone"
                    value={form.Sup_phone}
                    onChange={handleChange}
                    placeholder="e.g. 0612345678"
                  />
                  {errors.Sup_phone && <span className="error">{errors.Sup_phone}</span>}
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="Sup_address"
                    value={form.Sup_address}
                    onChange={handleChange}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Supplier'}
                </button>
                <Link to="/supplier" className="btn-cancel">Cancel</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierAdd;