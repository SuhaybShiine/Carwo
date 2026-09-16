import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import fabricInventoryService from '../../services/fabricInventoryService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function FabricInventoryList() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fabricInventoryService.getAll();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert('Error loading fabric inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = list.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.Fabric_Code?.toLowerCase().includes(q) ||
      f.Fabric_Name?.toLowerCase().includes(q) ||
      f.Color?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete fabric ${code}?`)) return;
    try {
      await fabricInventoryService.remove(id);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error deleting');
    }
  };

  const totalWaar = filtered.reduce(
    (s, f) => s + (Number(f.Available_Waar) || 0),
    0
  );

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />
      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button type="button" onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Fabric Inventory (Maro)</h1>
          </div>
          <div className="right">
            <Link to="/fabric-inventory/add" className="btn-add">
              <i className="bi bi-plus-lg"></i> Add Fabric
            </Link>
          </div>
        </header>

        <div className="content">
          <div
            style={{
              background: 'linear-gradient(135deg, #0f2027, #203a43)',
              color: '#fff',
              borderRadius: 12,
              padding: '16px 22px',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ opacity: 0.85, fontSize: 13 }}>Total waar (filtered)</div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>
                {totalWaar.toFixed(2)} waar
              </div>
            </div>
            <i className="bi bi-palette" style={{ fontSize: 32, opacity: 0.4 }}></i>
          </div>

          <div style={{ marginBottom: 16, maxWidth: 400 }}>
            <input
              type="text"
              placeholder="Search code, name, color..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
              }}
            />
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Color</th>
                    <th>Waar (duub)</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center">
                        No fabric registered
                      </td>
                    </tr>
                  ) : (
                    filtered.map((f, i) => (
                      <tr key={f.Fabric_id}>
                        <td>{i + 1}</td>
                        <td>
                          <strong>{f.Fabric_Code}</strong>
                        </td>
                        <td>{f.Fabric_Name}</td>
                        <td>{f.Color}</td>
                        <td>
                          <strong
                            style={{
                              color:
                                Number(f.Available_Waar) < 10
                                  ? '#dc2626'
                                  : '#166534',
                            }}
                          >
                            {Number(f.Available_Waar).toFixed(2)}
                          </strong>
                        </td>
                        <td>{f.Notes || '-'}</td>
                        <td className="actions">
                          <Link
                            to={`/fabric-inventory/edit/${f.Fabric_id}`}
                            className="btn-edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() =>
                              handleDelete(f.Fabric_id, f.Fabric_Code)
                            }
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

export default FabricInventoryList;