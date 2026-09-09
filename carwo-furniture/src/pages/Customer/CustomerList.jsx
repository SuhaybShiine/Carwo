import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import customerService from '../../services/customerService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]); // Waxaa lagu daray filtered si search u shaqeeyo
  const [search, setSearch] = useState(''); // Waxaa lagu daray search state
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const res = await customerService.getAll();
      setCustomers(res.data);
      setFiltered(res.data); // Waxaa lagu daray si search u shaqeeyo
    } catch (error) {
      console.error(error);
      alert('Error loading customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // SEARCH-GA: Kaliya waxaa lagu baadhaa Magaca (C_Name) iyo Taleefanka (C_phone)
  // Tirooyinka (numbers) sidoo kale waa loo qabtay si ammaan ah (safe).
  useEffect(() => {
    const searchLower = search.toLowerCase().trim();

    const result = customers.filter((cus) => {
      const name = (cus.C_Name || '').toLowerCase();
      const phone = (cus.C_phone || '').toString().toLowerCase();

      return name.includes(searchLower) || phone.includes(searchLower);
    });

    setFiltered(result);
  }, [search, customers]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerService.remove(id);
        fetchCustomers();
      } catch (error) {
        alert('Error deleting customer');
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
            <h1>Customer List</h1>
          </div>
          <div className="right">
            <Link to="/customer/add" className="btn-add">
              <i className="bi bi-plus-lg"></i> Add Customer
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
                  {/* Halkan filtered ayaa loo isticmaalayaa, ma aha customers */}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">No customers found</td>
                    </tr>
                  ) : (
                    filtered.map((cus, index) => (
                      <tr key={cus.C_id}>
                        <td>{index + 1}</td>
                        <td>{cus.C_Name}</td>
                        <td>{cus.C_phone || '-'}</td>
                        <td>{cus.C_address || '-'}</td>
                        <td className="actions">
                          <Link to={`/customer/edit/${cus.C_id}`} className="btn-edit">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button onClick={() => handleDelete(cus.C_id)} className="btn-delete">
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

export default CustomerList;