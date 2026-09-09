import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import employeeService from '../../services/employeeService';
import Sidebar from '../../components/Sidebar';
import './Employee.css';

const POSITIONS = ['Manager', 'Sales', 'Cashier', 'Storekeeper', 'Delivery', 'Carpenter'];

function EmployeeAdd() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    E_Name: '',
    E_address: '',
    E_phone: '',
    E_Position: '',
    E_Shift: '',
    E_STime: '',
    E_ETime: '',
    E_Salary: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'E_Name') {
      const lettersOnly = value.replace(/[0-9]/g, '');
      setForm({ ...form, [name]: lettersOnly });
    } else {
      setForm({ ...form, [name]: value });
    }

    setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.E_Name.trim()) {
      newErrors.E_Name = 'Name is required';
    } else if (!/^[A-Za-z\s'-]+$/.test(form.E_Name)) {
      newErrors.E_Name = 'Name cannot contain numbers or symbols';
    }

    if (!form.E_phone.trim()) newErrors.E_phone = 'Phone is required';
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.E_phone)) {
      newErrors.E_phone = 'Enter a valid phone number';
    }
    if (!form.E_Position) newErrors.E_Position = 'Position is required';
    if (!form.E_Salary) newErrors.E_Salary = 'Salary is required';
    else if (isNaN(form.E_Salary) || Number(form.E_Salary) < 0) {
      newErrors.E_Salary = 'Salary must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await employeeService.create(form);
      alert('Employee added successfully');
      navigate('/employee');
    } catch (error) {
      const message = error.response?.data?.message || 'Error adding employee';
      if (message.toLowerCase().includes('phone')) {
        setErrors({ ...errors, E_phone: message });
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
            <h1>Add Employee</h1>
          </div>
          <div className="right">
            <Link to="/employee" className="btn-back">
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
                    name="E_Name"
                    value={form.E_Name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                  />
                  {errors.E_Name && <span className="error">{errors.E_Name}</span>}
                </div>

                <div className="form-group">
                  <label>Phone </label>
                  <input
                    type="text"
                    name="E_phone"
                    value={form.E_phone}
                    onChange={handleChange}
                    placeholder="e.g. 0612345678"
                  />
                  {errors.E_phone && <span className="error">{errors.E_phone}</span>}
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="E_address"
                    value={form.E_address}
                    onChange={handleChange}
                    placeholder="Enter address"
                  />
                </div>

                <div className="form-group">
                  <label>Position </label>
                  <select name="E_Position" value={form.E_Position} onChange={handleChange}>
                    <option value="">Select position</option>
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  {errors.E_Position && <span className="error">{errors.E_Position}</span>}
                </div>

                <div className="form-group">
                  <label>Shift</label>
                  <select name="E_Shift" value={form.E_Shift} onChange={handleChange}>
                    <option value="">Select shift</option>
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Salary ($) </label>
                  <input
                    type="number"
                    name="E_Salary"
                    value={form.E_Salary}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                    min="0"
                    step="0.01"
                  />
                  {errors.E_Salary && <span className="error">{errors.E_Salary}</span>}
                </div>

                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    name="E_STime"
                    value={form.E_STime}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    name="E_ETime"
                    value={form.E_ETime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Employee'}
                </button>
                <Link to="/employee" className="btn-cancel">Cancel</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeAdd;