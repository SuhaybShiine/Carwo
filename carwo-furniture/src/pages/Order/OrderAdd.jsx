import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import orderService from '../../services/orderService';
import customerService from '../../services/customerService';
import productService from '../../services/productService';
import employeeService from '../../services/employeeService';
import fabricInventoryService from '../../services/fabricInventoryService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

const ITEM_TYPES = [
  { value: 'Fadhi 1 dabaq', label: 'Fadhi 1 dabaq (7.5 waar)' },
  { value: 'Fadhi 2 dabaq', label: 'Fadhi 2 dabaq (8.5 waar)' },
  { value: 'Fadhi 3 dabaq', label: 'Fadhi 3 dabaq (9.5 waar)' },
  { value: 'Fadhi 4 dabaq', label: 'Fadhi 4 dabaq (10.5 waar)' },
  { value: 'Fadhi taaga', label: 'Fadhi taaga (15 waar)' },
  { value: 'Gogol design', label: 'Gogol design (Gogol 5 + Shabag 2.5)' },
  { value: 'Gogol shuuliyo', label: 'Gogol shuuliyo (Gogol 4 + Shabag 1.5)' },
];

function isGogolType(t) {
  return t === 'Gogol design' || t === 'Gogol shuuliyo';
}

function detectItemTypeFromProduct(productName) {
  const n = String(productName || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
  if (!n) return '';
  if (n.includes('taaga') || n.includes('taag ah') || /\btaag\b/.test(n)) {
    return 'Fadhi taaga';
  }
  if (n.includes('shuuliyo') || n.includes('shuul')) return 'Gogol shuuliyo';
  if (n.includes('gogol') && n.includes('design')) return 'Gogol design';
  if (n.includes('gogol')) return 'Gogol design';
  if (n.includes('4 dabaq') || n.includes('4dabaq') || /\b4\s*dabaq/.test(n)) {
    return 'Fadhi 4 dabaq';
  }
  if (n.includes('3 dabaq') || n.includes('3dabaq') || /\b3\s*dabaq/.test(n)) {
    return 'Fadhi 3 dabaq';
  }
  if (n.includes('2 dabaq') || n.includes('2dabaq') || /\b2\s*dabaq/.test(n)) {
    return 'Fadhi 2 dabaq';
  }
  if (n.includes('1 dabaq') || n.includes('1dabaq') || /\b1\s*dabaq/.test(n)) {
    return 'Fadhi 1 dabaq';
  }
  return '';
}

const emptyItem = () => ({
  P_id: '',
  Item_Type: '',
  Fabric_id: '',
  Shabag_Fabric_id: '',
  O_color: '',
  O_quantity: 1,
  O_price: '',
  O_Discount: 0,
  waarPreview: null,
  waarLoading: false,
  waarError: '',
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// TOTAL = (Qty × Price) − Discount ($)
function lineSubtotal(it) {
  const qty = parseFloat(it.O_quantity) || 0;
  const price = parseFloat(it.O_price) || 0;
  const disc = parseFloat(it.O_Discount) || 0;
  return Math.max(0, qty * price - disc);
}

function OrderAdd() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [fabrics, setFabrics] = useState([]);

  const [form, setForm] = useState({
    C_id: '',
    E_id: '',
    O_date: todayISO(),
    O_AppointmentDate: '',
  });
  const [items, setItems] = useState([emptyItem()]);

  const pick = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [c, e, p, f] = await Promise.all([
          customerService.getAll(),
          employeeService.getAll(),
          productService.getAll(),
          fabricInventoryService.getAll(),
        ]);
        setCustomers(pick(c));
        setEmployees(pick(e));
        setProducts(pick(p));
        setFabrics(pick(f));
      } catch (err) {
        console.error(err);
        setError('Failed to load data. Check backend.');
      }
    };
    load();
  }, []);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const updateItem = (index, patch) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const refreshWaar = async (
    index,
    Item_Type,
    Fabric_id,
    Shabag_Fabric_id,
    quantity
  ) => {
    if (!Item_Type || !Fabric_id || !quantity || Number(quantity) <= 0) {
      updateItem(index, { waarPreview: null, waarError: '', waarLoading: false });
      return;
    }
    if (isGogolType(Item_Type) && !Shabag_Fabric_id) {
      updateItem(index, { waarPreview: null, waarError: '', waarLoading: false });
      return;
    }

    updateItem(index, { waarLoading: true, waarError: '', waarPreview: null });
    try {
      const data = await fabricInventoryService.calculate({
        Item_Type,
        quantity: Number(quantity),
        Fabric_id: Number(Fabric_id),
        Shabag_Fabric_id: Shabag_Fabric_id ? Number(Shabag_Fabric_id) : null,
      });
      updateItem(index, {
        waarPreview: data,
        waarLoading: false,
        waarError: data.allEnough ? '' : data.message || 'Stock check failed',
      });
    } catch (err) {
      updateItem(index, {
        waarLoading: false,
        waarPreview: null,
        waarError: err.response?.data?.message || 'Could not calculate waar',
      });
    }
  };

  const handleItemChange = (index, name, value) => {
    const item = items[index];
    const next = { ...item, [name]: value };

    if (name === 'P_id') {
      const prod = products.find((p) => String(p.P_id) === String(value));
      if (prod) {
        next.O_price = prod.P_price ?? '';
        const autoType = detectItemTypeFromProduct(prod.P_item);
        if (autoType) next.Item_Type = autoType;
        if (!isGogolType(autoType || next.Item_Type)) {
          next.Shabag_Fabric_id = '';
        }
      }
    }

    if (name === 'Item_Type' && !isGogolType(value)) {
      next.Shabag_Fabric_id = '';
    }

    setItems((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });

    const type =
      name === 'P_id'
        ? next.Item_Type
        : name === 'Item_Type'
          ? value
          : item.Item_Type;
    const fabric = name === 'Fabric_id' ? value : next.Fabric_id;
    const shabag =
      name === 'Shabag_Fabric_id' ? value : next.Shabag_Fabric_id;
    const qty = name === 'O_quantity' ? value : item.O_quantity;

    if (
      ['P_id', 'Item_Type', 'Fabric_id', 'Shabag_Fabric_id', 'O_quantity'].includes(
        name
      )
    ) {
      refreshWaar(index, type, fabric, shabag, qty);
    }
  };

  const addItemRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItemRow = (index) =>
    setItems((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)
    );

  const grandTotal = items.reduce((sum, it) => sum + lineSubtotal(it), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.C_id) {
      setError('Please select a customer');
      return;
    }
    if (!form.E_id) {
      setError('Please select an employee');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.P_id) {
        setError(`Item ${i + 1}: select a product`);
        return;
      }
      if (!it.O_quantity || Number(it.O_quantity) <= 0) {
        setError(`Item ${i + 1}: quantity must be greater than 0`);
        return;
      }

      const lineAmt = Number(it.O_quantity) * Number(it.O_price || 0);
      const disc = Number(it.O_Discount) || 0;
      if (disc > lineAmt) {
        setError(
          `Item ${i + 1}: discount ($${disc}) cannot exceed $${lineAmt.toFixed(2)}`
        );
        return;
      }

      if (it.Item_Type && !it.Fabric_id) {
        setError(
          `Item ${i + 1}: dooro ${
            isGogolType(it.Item_Type) ? 'Gogol (GOG001)' : 'maro'
          }`
        );
        return;
      }
      if (isGogolType(it.Item_Type) && !it.Shabag_Fabric_id) {
        setError(`Item ${i + 1}: dooro Shabag gooni (SHB001)`);
        return;
      }
      if (it.waarPreview && it.waarPreview.allEnough === false) {
        setError(`Item ${i + 1}: ${it.waarPreview.message}`);
        return;
      }
    }

    const payload = {
      C_id: Number(form.C_id),
      E_id: Number(form.E_id),
      O_date: form.O_date || todayISO(),
      O_AppointmentDate: form.O_AppointmentDate || null,
      items: items.map((it) => ({
        P_id: Number(it.P_id),
        Item_Type: it.Item_Type || null,
        Fabric_id: it.Fabric_id ? Number(it.Fabric_id) : null,
        Shabag_Fabric_id: it.Shabag_Fabric_id
          ? Number(it.Shabag_Fabric_id)
          : null,
        O_color: it.O_color || null,
        O_quantity: Number(it.O_quantity),
        O_price: Number(it.O_price) || 0,
        O_Discount: it.O_Discount ? Number(it.O_Discount) : 0,
      })),
    };

    setSaving(true);
    try {
      await orderService.create(payload);
      alert('Order created successfully');
      navigate('/order');
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating order');
    } finally {
      setSaving(false);
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
            <h1>Add Order</h1>
          </div>
          <div className="right">
            <Link to="/order" className="btn-back">
              <i className="bi bi-arrow-left"></i> Back
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
                    padding: '12px 14px',
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Customer *</label>
                  <select
                    name="C_id"
                    value={form.C_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">-- Select customer --</option>
                    {customers.map((c) => (
                      <option key={c.C_id} value={c.C_id}>
                        {c.C_Name || c.C_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Employee *</label>
                  <select
                    name="E_id"
                    value={form.E_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">-- Select employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.E_id} value={emp.E_id}>
                        {emp.E_Name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Order Date</label>
                  <input
                    type="date"
                    name="O_date"
                    value={form.O_date}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label>Appointment Date</label>
                  <input
                    type="date"
                    name="O_AppointmentDate"
                    value={form.O_AppointmentDate}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: 0, color: '#1a2744' }}>Order Items</h3>
                <button type="button" className="btn-add" onClick={addItemRow}>
                  <i className="bi bi-plus-lg"></i> Add Item
                </button>
              </div>

              {items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                    background: '#fafbfc',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <strong>Item {index + 1}</strong>
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => removeItemRow(index)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Product *</label>
                      <select
                        value={item.P_id}
                        onChange={(e) =>
                          handleItemChange(index, 'P_id', e.target.value)
                        }
                        required
                      >
                        <option value="">-- Select product --</option>
                        {products.map((p) => (
                          <option key={p.P_id} value={p.P_id}>
                            {p.P_item} (stock: {p.P_quantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        Style / Type{' '}
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          auto from product
                        </span>
                      </label>
                      <select
                        value={item.Item_Type}
                        onChange={(e) =>
                          handleItemChange(index, 'Item_Type', e.target.value)
                        }
                        style={{
                          background: item.Item_Type ? '#ecfdf5' : undefined,
                        }}
                      >
                        <option value="">-- Select type --</option>
                        {ITEM_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      {item.Item_Type && (
                        <small style={{ color: '#16a34a', fontWeight: 600 }}>
                          ✓ {item.Item_Type}
                        </small>
                      )}
                    </div>

                    <div className="form-group">
                      <label>
                        {isGogolType(item.Item_Type)
                          ? 'Gogol (main) *'
                          : 'Fabric / Maro *'}
                      </label>
                      <select
                        value={item.Fabric_id}
                        onChange={(e) =>
                          handleItemChange(index, 'Fabric_id', e.target.value)
                        }
                        disabled={!item.Item_Type}
                      >
                        <option value="">
                          {isGogolType(item.Item_Type)
                            ? '-- Dooro Gogol e.g. GOG001 --'
                            : '-- Dooro maro --'}
                        </option>
                        {fabrics.map((f) => (
                          <option key={f.Fabric_id} value={f.Fabric_id}>
                            {f.Fabric_Code} — {f.Fabric_Name} ({f.Color}) —{' '}
                            {Number(f.Available_Waar).toFixed(2)} waar
                          </option>
                        ))}
                      </select>
                    </div>

                    {isGogolType(item.Item_Type) && (
                      <div className="form-group">
                        <label>Shabag (gooni) *</label>
                        <select
                          value={item.Shabag_Fabric_id}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'Shabag_Fabric_id',
                              e.target.value
                            )
                          }
                        >
                          <option value="">-- Dooro Shabag e.g. SHB001 --</option>
                          {fabrics.map((f) => (
                            <option
                              key={`sh-${f.Fabric_id}`}
                              value={f.Fabric_id}
                            >
                              {f.Fabric_Code} — {f.Fabric_Name} ({f.Color}) —{' '}
                              {Number(f.Available_Waar).toFixed(2)} waar
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Color</label>
                      <input
                        type="text"
                        value={item.O_color}
                        onChange={(e) =>
                          handleItemChange(index, 'O_color', e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={item.O_quantity}
                        onChange={(e) =>
                          handleItemChange(index, 'O_quantity', e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Price *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.O_price}
                        onChange={(e) =>
                          handleItemChange(index, 'O_price', e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Discount ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.O_Discount}
                        onChange={(e) =>
                          handleItemChange(index, 'O_Discount', e.target.value)
                        }
                        placeholder="e.g. 5"
                      />
                      <small style={{ color: '#64748b' }}>
                        Lacag la jarayo — 35 − 5 = 30 (ma aha %)
                      </small>
                    </div>
                    <div className="form-group">
                      <label>Line total</label>
                      <input
                        type="text"
                        disabled
                        value={`$${lineSubtotal(item).toFixed(2)}`}
                        style={{ background: '#f1f5f9', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  {item.Item_Type && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '12px 14px',
                        borderRadius: 10,
                        background:
                          item.waarPreview?.allEnough === false
                            ? '#fef2f2'
                            : item.waarPreview?.allEnough
                              ? '#ecfdf5'
                              : '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {item.waarLoading && <span>Calculating waar...</span>}
                      {!item.waarLoading && item.waarError && (
                        <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                          {item.waarError}
                        </span>
                      )}
                      {!item.waarLoading &&
                        item.waarPreview?.lines?.map((line) => (
                          <div key={line.Material} style={{ marginBottom: 4 }}>
                            <strong>{line.Role || line.Material}:</strong>{' '}
                            {line.Needed} waar
                            {line.fabric
                              ? ` → ${line.fabric.Fabric_Code} (taalla ${
                                  line.fabric.Available_Waar
                                }) ${line.Enough ? '✅' : '❌'}`
                              : ' → weli lama dooran'}
                          </div>
                        ))}
                      {!item.waarLoading &&
                        !item.waarPreview &&
                        !item.Fabric_id && (
                          <span style={{ color: '#64748b' }}>
                            Dooro{' '}
                            {isGogolType(item.Item_Type) ? 'Gogol iyo Shabag' : 'maro'}
                          </span>
                        )}
                    </div>
                  )}
                </div>
              ))}

              <div
                style={{
                  textAlign: 'right',
                  fontSize: 20,
                  fontWeight: 800,
                  marginBottom: 20,
                }}
              >
                Grand Total: ${grandTotal.toFixed(2)}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Order'}
                </button>
                <Link to="/order" className="btn-cancel">
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

export default OrderAdd;