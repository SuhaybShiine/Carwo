import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import fabricInventoryService from '../../services/fabricInventoryService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function FabricInventoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    Fabric_Code: '',
    Fabric_Name: '',
    Color: '',
    Available_Waar: '',
    Notes: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fabricInventoryService.getById(id);
        setForm({
          Fabric_Code: data.Fabric_Code || '',
          Fabric_Name: data.Fabric_Name || '',
          Color: data.Color || '',
          Available_Waar: data.Available_Waar ?? '',
          Notes: data.Notes || '',
        });
      } catch {
        alert('Fabric not found');
        navigate('/fabric-inventory');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

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
    setSaving(true);
    try {
      await fabricInventoryService.update(id, {
        ...form,
        Available_Waar: Number(form.Available_Waar),
      });
      alert('Updated successfully');
      navigate('/fabric-inventory');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="layout">
        <Sidebar collapsed={collapsed} />
        <div className="main">
          <p style={{ padding: 40 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />
      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button type="button" onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Edit Fabric</h1>
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
                  />
                </div>
                <div className="form-group">
                  <label>Fabric Name *</label>
                  <input
                    name="Fabric_Name"
                    value={form.Fabric_Name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Color *</label>
                  <input name="Color" value={form.Color} onChange={handleChange} />
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
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <input name="Notes" value={form.Notes} onChange={handleChange} />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Update'}
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

export default FabricInventoryEdit;