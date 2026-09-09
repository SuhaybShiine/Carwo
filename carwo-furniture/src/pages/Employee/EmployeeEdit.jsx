import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import employeeService from '../../services/employeeService';
import Sidebar from '../../components/Sidebar';
import './Employee.css';

const POSITIONS = ['Manager', 'Sales', 'Cashier', 'Storekeeper', 'Delivery', 'Carpenter'];

function EmployeeEdit() {
  const { id } = useParams();
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

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await employeeService.getById(id);
        const data = res.data;
        setForm({
          E_Name: data.E_Name || '',
          E_address: data.E_address || '',
          E_phone: data.E_phone || '',
          E_Position: data.E_Position || '',
          E_Shift: data.E_Shift || '',
          E_STime: data.E_STime || '',
          E_ETime: data.E_ETime || '',
          E_Salary: data.E_Salary || '',
        });
      } catch (error) {
        alert('Employee not found');
        navigate('/employee');
      }
    };
    fetchEmployee();
  }, [id, navigate]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await employeeService.update(id, form);
      alert('Employee updated successfully');
      navigate('/employee');
    } catch (error) {
      const message = error.response?.data?.message || 'Error updating employee';
      if (message.toLowerCase().includes('phone')) {
        setErrors({ ...errors, E_phone: message });
      } else {
        alert(message);
      }
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
            <h1>Edit Employee</h1>
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
                  <input type="text" name="E_Name" value={form.E_Name} onChange={handleChange} />
                  {errors.E_Name && <span className="error">{errors.E_Name}</span>}
                </div>

                <div className="form-group">
                  <label>Phone </label>
                  <input type="text" name="E_phone" value={form.E_phone} onChange={handleChange} />
                  {errors.E_phone && <span className="error">{errors.E_phone}</span>}
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input type="text" name="E_address" value={form.E_address} onChange={handleChange} />
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
                  <input type="number" name="E_Salary" value={form.E_Salary} onChange={handleChange} min="0" step="0.01" />
                  {errors.E_Salary && <span className="error">{errors.E_Salary}</span>}
                </div>

                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" name="E_STime" value={form.E_STime} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" name="E_ETime" value={form.E_ETime} onChange={handleChange} />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Employee'}
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

export default EmployeeEdit;