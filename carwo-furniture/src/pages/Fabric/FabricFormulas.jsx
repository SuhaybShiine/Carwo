import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import fabricService from '../../services/fabricService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function FabricFormulas() {
  const [formulas, setFormulas] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fabricService.getFormulas();
      setFormulas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert('Error loading formulas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this formula?')) return;
    try {
      await fabricService.removeFormula(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting');
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
            <h1>Fabric Formulas</h1>
          </div>
          <div className="right">
            <Link to="/fabric/stock" className="btn-back">
              <i className="bi bi-arrow-left"></i> Stock
            </Link>
          </div>
        </header>

        <div className="content">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category</th>
                    <th>Item Type</th>
                    <th>Material</th>
                    <th>Waar / unit</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formulas.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No formulas
                      </td>
                    </tr>
                  ) : (
                    formulas.map((f, index) => (
                      <tr key={f.Formula_id}>
                        <td>{index + 1}</td>
                        <td>{f.Category}</td>
                        <td>
                          <strong>{f.Item_Type}</strong>
                        </td>
                        <td>{f.Material}</td>
                        <td>
                          <strong>{Number(f.Waar_Per_Unit).toFixed(2)}</strong>
                        </td>
                        <td>{f.Notes || '-'}</td>
                        <td className="actions">
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => handleDelete(f.Formula_id)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FabricFormulas;