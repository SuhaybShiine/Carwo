import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import employeeService from '../../services/employeeService';
import Sidebar from '../../components/Sidebar';
import './Employee.css';

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await employeeService.getAll();
      setEmployees(res.data);
      setFiltered(res.data);
    } catch (error) {
      console.error(error);
      alert('Error loading employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const searchLower = search.toLowerCase().trim();

    const result = employees.filter((emp) => {
      const name = (emp.E_Name || '').toLowerCase();
      const phone = (emp.E_phone || '').toString().toLowerCase();

      return name.includes(searchLower) || phone.includes(searchLower);
    });

    setFiltered(result);
  }, [search, employees]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.remove(id);
        fetchEmployees();
      } catch (error) {
        alert('Error deleting employee');
      }
    }
  };

  const totalSalary = filtered.reduce((sum, emp) => sum + Number(emp.E_Salary || 0), 0);

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />

      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Employee List</h1>
          </div>
          <div className="right">
            <Link to="/employee/add" className="btn-add">
              <i className="bi bi-plus-lg"></i> Add Employee
            </Link>
          </div>
        </header>

        <div className="content">
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
            <>
              <div className="table-card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Position</th>
                      <th>Shift</th>
                      <th>Salary</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center">No employees found</td>
                      </tr>
                    ) : (
                      filtered.map((emp, index) => (
                        <tr key={emp.E_id}>
                          <td>{index + 1}</td>
                          <td>{emp.E_Name}</td>
                          <td>{emp.E_phone || '-'}</td>
                          <td>{emp.E_Position || '-'}</td>
                          <td>{emp.E_Shift || '-'}</td>
                          <td>${emp.E_Salary || 0}</td>
                          <td className="actions">
                            <Link to={`/employee/edit/${emp.E_id}`} className="btn-edit">
                              <i className="bi bi-pencil"></i>
                            </Link>
                            <button onClick={() => handleDelete(emp.E_id)} className="btn-delete">
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Salary — hoosta jadwalka */}
              <div
                style={{
                  marginTop: '16px',
                  background: 'linear-gradient(135deg, #38a169, #276749)',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '18px 22px',
                  maxWidth: '280px',
                }}
              >
                <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                  <i className="bi bi-cash-stack"></i> Total Salary
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 'bold' }}>${totalSalary.toFixed(2)}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeList;