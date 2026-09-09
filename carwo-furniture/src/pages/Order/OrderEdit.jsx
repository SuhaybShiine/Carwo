import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import orderService from '../../services/orderService';
import customerService from '../../services/customerService';
import productService from '../../services/productService';
import Sidebar from '../../components/Sidebar';
import '../Employee/Employee.css';

function OrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [C_id, setC_id] = useState('');
  const [O_date, setO_date] = useState('');
  const [O_AppointmentDate, setO_AppointmentDate] = useState('');
  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]); // items-kii asalka ahaa, si loo ogaado stock-ka la soo celin karo

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderRes, customerRes, productRes] = await Promise.all([
          orderService.getById(id),
          customerService.getAll(),
          productService.getAll(),
        ]);
        const data = orderRes.data;
        setC_id(data.C_id || '');
        setO_date(data.O_date ? data.O_date.slice(0, 10) : '');
        setO_AppointmentDate(data.O_AppointmentDate ? data.O_AppointmentDate.slice(0, 10) : '');
        const loadedItems = (data.items || []).map((it) => ({
          P_id: it.P_id,
          O_color: it.O_color || '',
          O_quantity: it.O_quantity,
          O_price: it.O_price,
          O_Discount: it.O_Discount || 0,
        }));
        setItems(loadedItems);
        setOriginalItems(loadedItems);
        setCustomers(customerRes.data);
        setProducts(productRes.data);
      } catch (err) {
        console.error('Load Data Error:', err);
        alert('Order not found');
        navigate('/order');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  // Stock-ga la soo bandhigo waa: stock-ga hadda + wixii uu order-kan asal ahaan qaadan jiray product-kaas
  // (waayo, isaga ka mid ah stock-ga hadda ee database-ku wuu la jarnaa horeba order-kan)
  const getAvailableStock = (P_id) => {
    const p = products.find((prod) => String(prod.P_id) === String(P_id));
    if (!p) return null;
    const reserved = originalItems
      .filter((it) => String(it.P_id) === String(P_id))
      .reduce((sum, it) => sum + Number(it.O_quantity || 0), 0);
    return Number(p.P_quantity) + reserved;
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'P_id') {
      const selectedProduct = products.find((p) => String(p.P_id) === String(value));
      if (selectedProduct && selectedProduct.P_price) {
        updated[index].O_price = selectedProduct.P_price;
      }
    }

    setItems(updated);
    if (error) setError('');
  };

  const addItemRow = () =>
    setItems([...items, { P_id: '', O_color: '', O_quantity: 1, O_price: '', O_Discount: 0 }]);

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const itemSubtotal = (item) => {
    const qty = parseFloat(item.O_quantity) || 0;
    const price = parseFloat(item.O_price) || 0;
    const discount = parseFloat(item.O_Discount) || 0;
    return qty * price * (1 - discount / 100);
  };

  const grandTotal = items.reduce((sum, it) => sum + itemSubtotal(it), 0);

  const validate = () => {
    if (!C_id) return 'Customer is required';
    if (!O_date) return 'Order date is required';
    if (items.length === 0) return 'At least one order item is required';

    const qtyByProduct = {};

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.P_id) return `Item ${i + 1}: please select a product`;
      if (!it.O_quantity || parseInt(it.O_quantity) <= 0) return `Item ${i + 1}: quantity must be greater than 0`;
      if (it.O_price === '' || parseFloat(it.O_price) < 0) return `Item ${i + 1}: a valid price is required`;

      qtyByProduct[it.P_id] = (qtyByProduct[it.P_id] || 0) + parseInt(it.O_quantity);

      const available = getAvailableStock(it.P_id);
      if (available !== null && qtyByProduct[it.P_id] > available) {
        const name = products.find((p) => String(p.P_id) === String(it.P_id))?.P_item;
        return `"${name}" — waxaad dalbanaysaa ${qtyByProduct[it.P_id]}, laakiin kaliya ${available} ayaa la heli karaa`;
      }
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSaving(true);

    try {
      await orderService.update(id, {
        C_id,
        O_date,
        O_AppointmentDate: O_AppointmentDate || null,
        items: items.map((it) => ({
          P_id: it.P_id,
          O_color: it.O_color,
          O_quantity: Number(it.O_quantity),
          O_price: Number(it.O_price),
          O_Discount: it.O_Discount ? Number(it.O_Discount) : 0,
        })),
      });
      alert('Order updated successfully!');
      navigate('/order');
    } catch (err) {
      console.error('Update Order Error:', err);
      setError(err.response?.data?.message || 'Error updating order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="layout">
        <Sidebar collapsed={collapsed} />
        <div className={`main ${collapsed ? 'collapsed' : ''}`}>
          <div className="content">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} />

      <div className={`main ${collapsed ? 'collapsed' : ''}`}>
        <header className="header">
          <div className="left">
            <button onClick={() => setCollapsed(!collapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <h1>Edit Order</h1>
          </div>
          <div className="right">
            <Link to="/order" className="btn-back">
              <i className="bi bi-arrow-left"></i> Back to List
            </Link>
          </div>
        </header>

        <div className="content">
          <div className="form-card">
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: '#fed7d7', color: '#c53030', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>
                  {error}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Customer </label>
                  <select value={C_id} onChange={(e) => setC_id(e.target.value)}>
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.C_id} value={c.C_id}>
                        {c.C_Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Order Date *</label>
                  <input type="date" value={O_date} onChange={(e) => setO_date(e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Appointment Date</label>
                  <input
                    type="date"
                    value={O_AppointmentDate}
                    onChange={(e) => setO_AppointmentDate(e.target.value)}
                  />
                </div>
              </div>

              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Order Items</h3>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="btn-add"
                  style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                >
                  <i className="bi bi-plus-lg"></i> Add Item
                </button>
              </div>

              {items.map((item, index) => {
                const available = getAvailableStock(item.P_id);
                return (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '14px',
                      background: '#fafafa',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <strong style={{ color: '#4a5568' }}>Item {index + 1}</strong>
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="btn-delete"
                        title="Remove item"
                        disabled={items.length === 1}
                      >
                        <i className="bi bi-trash"></i> Remove
                      </button>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Product </label>
                        <select
                          value={item.P_id}
                          onChange={(e) => handleItemChange(index, 'P_id', e.target.value)}
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.P_id} value={p.P_id}>
                              {p.P_item} — Stock: {p.P_quantity}
                            </option>
                          ))}
                        </select>
                        {available !== null && (
                          <small style={{ color: '#718096' }}>Available: {available}</small>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Color</label>
                        <input
                          type="text"
                          value={item.O_color}
                          onChange={(e) => handleItemChange(index, 'O_color', e.target.value)}
                          placeholder="e.g. Black"
                        />
                      </div>

                      <div className="form-group">
                        <label>Quantity </label>
                        <input
                          type="number"
                          min="1"
                          max={available !== null ? available : undefined}
                          value={item.O_quantity}
                          onChange={(e) => handleItemChange(index, 'O_quantity', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Price ($) </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.O_price}
                          onChange={(e) => handleItemChange(index, 'O_price', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Discount (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.O_Discount}
                          onChange={(e) => handleItemChange(index, 'O_Discount', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>Subtotal (Auto)</label>
                        <input
                          type="text"
                          value={`$${itemSubtotal(item).toFixed(2)}`}
                          disabled
                          style={{ background: '#eef2f7', fontWeight: 'bold', color: '#2d3748' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#2d3748',
                }}
              >
                Grand Total: ${grandTotal.toFixed(2)}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Updating...' : 'Update Order'}
                </button>
                <Link to="/order" className="btn-cancel">Cancel</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderEdit;