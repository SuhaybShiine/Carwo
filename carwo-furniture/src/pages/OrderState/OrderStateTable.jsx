import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderStateService from '../../services/orderStateService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function OrderStateTable() {
  const { orderId } = useParams();
  const [states, setStates] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStates = async () => {
    try {
      const res = await orderStateService.getByOrder(orderId);
      setStates(res.data);
    } catch (error) {
      console.error(error);
      alert('Error loading state history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, [orderId]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this state entry?')) {
      try {
        await orderStateService.remove(id);
        fetchStates();
      } catch (error) {
        alert('Error deleting state');
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
            <h1>Order State History</h1>
          </div>
          <div className="right">
            <Link to="/order" className="btn-back">
              <i className="bi bi-arrow-left"></i> Back to List
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
                    <th>Customer</th>
                    <th>State</th>
                    <th>State Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {states.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No state history found for this order
                      </td>
                    </tr>
                  ) : (
                    states.map((s, index) => (
                      <tr key={s.state_id}>
                        <td>{index + 1}</td>
                        <td>{s.C_Name || '-'}</td>
                        <td>{s.state_name}</td>
                        <td>{new Date(s.state_date).toLocaleDateString()}</td>
                        <td className="actions">
                          <Link to={`/order-state/edit/${s.state_id}`} className="btn-edit" title="Edit">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(s.state_id)}
                            className="btn-delete"
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

export default OrderStateTable;