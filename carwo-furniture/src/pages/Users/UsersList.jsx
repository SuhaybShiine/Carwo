import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function UsersList() {
  const [users, setUsers] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getUser();

  const fetchUsers = async () => {
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      alert('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await authService.remove(id);
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting user');
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
            <h1>Users</h1>
          </div>
          <div className="right">
            <Link to="/users/add" className="btn-add">
              <i className="bi bi-plus-lg"></i> Add User
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
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">No users found</td>
                    </tr>
                  ) : (
                    users.map((u, index) => (
                      <tr key={u.User_id}>
                        <td>{index + 1}</td>
                        <td>{u.Full_Name || '-'}</td>
                        <td>{u.Username}</td>
                        <td>{u.Email || '-'}</td>
                        <td>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '0.8rem',
                              color: '#fff',
                              background: u.Role === 'admin' ? '#805ad5' : '#4a5568',
                            }}
                          >
                            {u.Role}
                          </span>
                        </td>
                        <td className="actions">
                          {currentUser?.User_id === u.User_id ? (
                            <span style={{ color: '#a0aec0', fontSize: '0.85rem' }}>You</span>
                          ) : (
                            <button onClick={() => handleDelete(u.User_id)} className="btn-delete" title="Delete">
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
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

export default UsersList;