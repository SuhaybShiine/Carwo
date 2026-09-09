import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import expenseService from '../../services/expenseService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await expenseService.getAll();

      // API: { expenses: [], total: 0 }
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.expenses)
          ? data.expenses
          : [];

      const sum =
        data?.total !== undefined
          ? Number(data.total)
          : list.reduce((acc, e) => acc + (Number(e.Ex_amount) || 0), 0);

      setExpenses(list);
      setFiltered(list);
      setTotal(sum);
    } catch (error) {
      console.error(error);
      alert('Error loading expenses');
      setExpenses([]);
      setFiltered([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    const list = Array.isArray(expenses) ? expenses : [];

    if (!q) {
      setFiltered(list);
      return;
    }

    setFiltered(
      list.filter(
        (e) =>
          (e.Ex_Type || '').toLowerCase().includes(q) ||
          String(e.Ex_amount || '').includes(q) ||
          String(e.Ex_Date || '').includes(q)
      )
    );
  }, [search, expenses]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseService.remove(id);
      fetchExpenses();
    } catch (error) {
      alert('Error deleting expense');
    }
  };

  // Safe list for render
  const rows = Array.isArray(filtered) ? filtered : [];

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />

      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Expenses</h1>
          </div>
          <div className="right" style={{ display: 'flex', gap: 10 }}>
            <Link to="/expense/report" className="btn-back">
              <i className="bi bi-bar-chart"></i> Report
            </Link>
            <Link to="/expense/add" className="btn-add">
              <i className="bi bi-plus-lg"></i> Add Expense
            </Link>
          </div>
        </header>

        <div className="content">
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 400, marginBottom: 16 }}>
            <i
              className="bi bi-search"
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                fontSize: 14,
              }}
            ></i>
            <input
              type="text"
              placeholder="Search type, amount, date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                outline: 'none',
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
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No expenses found
                      </td>
                    </tr>
                  ) : (
                    rows.map((e, index) => (
                      <tr key={e.Ex_id || index}>
                        <td>{index + 1}</td>
                        <td>{e.Ex_Type}</td>
                        <td>
                          <strong>${Number(e.Ex_amount || 0).toFixed(2)}</strong>
                        </td>
                        <td>
                          {e.Ex_Date ? String(e.Ex_Date).slice(0, 10) : '-'}
                        </td>
                        <td className="actions">
                          <Link
                            to={`/expense/edit/${e.Ex_id}`}
                            className="btn-edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(e.Ex_id)}
                            className="btn-delete"
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

          {/* Total Card - now placed below the table */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f2027, #203a43)',
              color: '#fff',
              borderRadius: 12,
              padding: '20px 28px',
              marginTop: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            }}
          >
            <div>
              <div style={{ opacity: 0.85, fontSize: 14 }}>Total Expenses</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                ${Number(total || 0).toFixed(2)}
              </div>
            </div>
            <i className="bi bi-cash-stack" style={{ fontSize: 36, opacity: 0.4 }}></i>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpenseList;