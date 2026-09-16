import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import fabricService from '../../services/fabricService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function FabricCalculator() {
  const [collapsed, setCollapsed] = useState(false);
  const [itemTypes, setItemTypes] = useState([]);
  const [Item_Type, setItem_Type] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fabricService.getItemTypes();
        setItemTypes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!Item_Type) {
      setError('Please select item type (e.g. Fadhi taaga)');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      const data = await fabricService.calculate({
        Item_Type,
        quantity: Number(quantity),
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Calculation failed');
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
            <button type="button" onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Fabric Calculator (Waar)</h1>
          </div>
          <div className="right">
            <Link to="/fabric/stock" className="btn-back">
              <i className="bi bi-arrow-left"></i> Stock
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="form-card" style={{ maxWidth: 640 }}>
            <form onSubmit={handleCalculate}>
              {error && (
                <div
                  style={{
                    background: '#fef2f2',
                    color: '#b91c1c',
                    padding: '10px 14px',
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Item Type *</label>
                  <select
                    value={Item_Type}
                    onChange={(e) => {
                      setItem_Type(e.target.value);
                      setResult(null);
                    }}
                  >
                    <option value="">-- Select type --</option>
                    {itemTypes.map((t) => (
                      <option key={t.Item_Type} value={t.Item_Type}>
                        {t.Category} — {t.Item_Type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setResult(null);
                    }}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Calculating...' : 'Calculate Waar'}
                </button>
              </div>
            </form>

            {result && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ marginBottom: 12, color: '#1a2744' }}>
                  Result: {result.Item_Type} × {result.Quantity}
                </h3>

                <div
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <table className="table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>Per unit</th>
                        <th>Needed</th>
                        <th>Stock</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.lines.map((line) => (
                        <tr key={line.Material}>
                          <td>
                            <strong>{line.Material_So || line.Material}</strong>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                              {line.Material}
                            </div>
                          </td>
                          <td>{line.Waar_Per_Unit}</td>
                          <td>
                            <strong>{line.Needed}</strong> waar
                          </td>
                          <td>{line.Available} waar</td>
                          <td>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#fff',
                                background: line.Enough ? '#16a34a' : '#dc2626',
                              }}
                            >
                              {line.Enough ? 'OK' : 'NOT ENOUGH'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: '14px 18px',
                    borderRadius: 10,
                    background: result.allEnough
                      ? 'linear-gradient(135deg, #166534, #22c55e)'
                      : 'linear-gradient(135deg, #7f1d1d, #dc2626)',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{result.message}</span>
                  <span style={{ fontSize: 20, fontWeight: 800 }}>
                    Total: {result.totalNeeded} waar
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FabricCalculator;