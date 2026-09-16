import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import fabricInventoryService from '../../services/fabricInventoryService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function FabricInventoryAdd() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    Fabric_Code: '',
    Fabric_Name: '',
    Color: '',
    Available_Waar: '',
    Notes: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Fabric_Code.trim() || !form.Fabric_Name.trim() || !form.Color.trim()) {
      setError('Code, Name and Color are required');
      return;
    }
    if (form.Available_Waar === '' || Number(form.Available_Waar) < 0) {
      setError('Waar must be 0 or more');
      return;
    }

    setSaving(true);
    try {
      await fabricInventoryService.create({
        ...form,
        Available_Waar: Number(form.Available_Waar),
      });
      alert('Fabric registered successfully');
      navigate('/fabric-inventory');
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />
      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button type="button" onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Add Fabric (Maro)</h1>
          </div>
          <div className="right">
            <Link to="/fabric-inventory" className="btn-back">
              Back
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="form-card">
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    background: '#fef2f2',
                    color: '#b91c1c',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Fabric Code *</label>
                  <input
                    name="Fabric_Code"
                    value={form.Fabric_Code}
                    onChange={handleChange}
                    placeholder="e.g. Red001"
                  />
                </div>
                <div className="form-group">
                  <label>Fabric Name *</label>
                  <input
                    name="Fabric_Name"
                    value={form.Fabric_Name}
                    onChange={handleChange}
                    placeholder="e.g. Marda saafi"
                  />
                </div>
                <div className="form-group">
                  <label>Color *</label>
                  <input
                    name="Color"
                    value={form.Color}
                    onChange={handleChange}
                    placeholder="e.g. Red"
                  />
                </div>
                <div className="form-group">
                  <label>Waar (duub) *</label>
                  <input
                    type="number"
                    name="Available_Waar"
                    min="0"
                    step="0.01"
                    value={form.Available_Waar}
                    onChange={handleChange}
                    placeholder="75"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <input
                    name="Notes"
                    value={form.Notes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Fabric'}
                </button>
                <Link to="/fabric-inventory" className="btn-cancel">
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

export default FabricInventoryAdd;