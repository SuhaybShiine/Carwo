import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supplierService from '../../services/supplierService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    try {
      const res = await supplierService.getAll();
      setSuppliers(res.data);
      setFiltered(res.data);
    } catch (error) {
      console.error(error);
      alert('Error loading suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // SEARCH-GA: Kaliya waxaa lagu baadhaa Magaca (Name) iyo Taleefanka (Phone)
  // Ciwaanka (Address) waa laga saaray. Tirooyinka (numbers) sidoo kale waa loo qabtay.
  useEffect(() => {
    const searchLower = search.toLowerCase().trim();

    const result = suppliers.filter((s) => {
      const name = (s.Sup_Name || '').toLowerCase();
      const phone = (s.Sup_phone || '').toString().toLowerCase();

      return name.includes(searchLower) || phone.includes(searchLower);
    });

    setFiltered(result);
  }, [search, suppliers]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await supplierService.remove(id);
        fetchSuppliers();
      } catch (error) {
        alert('Error deleting supplier');
      }
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
            <h1>Supplier List</h1>
          </div>
          <div className="right">
            <Link to="/supplier/add" className="btn-add">
              <i className="bi bi-plus-lg"></i> Add Supplier
            </Link>
          </div>
        </header>

        <div className="content">
          {/* SEARCH BOX - Batoonku wuxuu ku yaal dhinaca bidix (hor dhig) */}
          <div className="search-box" style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                maxWidth: '450px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* Batoonka search-ga oo dhinaca bidix ku yaal */}
              <button
                type="button"
                style={{
                  padding: '10px 16px',
                  background: '#f7fafc',
                  border: 'none',
                  borderRight: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4a5568',
                  fontSize: '1.1rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.target.style.background = '#edf2f7')}
                onMouseLeave={(e) => (e.target.style.background = '#f7fafc')}
              >
                <i className="bi bi-search"></i>
              </button>

              {/* Input-ka search-ga */}
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  background: 'transparent',
                  color: '#2d3748',
                }}
              />
            </div>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">No suppliers found</td>
                    </tr>
                  ) : (
                    filtered.map((sup, index) => (
                      <tr key={sup.Sup_id}>
                        <td>{index + 1}</td>
                        <td>{sup.Sup_Name}</td>
                        <td>{sup.Sup_phone || '-'}</td>
                        <td>{sup.Sup_address || '-'}</td>
                        <td className="actions">
                          <Link to={`/supplier/edit/${sup.Sup_id}`} className="btn-edit">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button onClick={() => handleDelete(sup.Sup_id)} className="btn-delete">
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

export default SupplierList;