const db = require('../config/db');

// GET all orders (header + item count + latest state)
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        o.*,
        c.C_Name,
        (SELECT COUNT(*) FROM Order_Items oi WHERE oi.O_id = o.O_id) AS item_count,
        (SELECT GROUP_CONCAT(p.P_item SEPARATOR ', ')
         FROM Order_Items oi
         JOIN Product p ON oi.P_id = p.P_id
         WHERE oi.O_id = o.O_id) AS item_names,
        (SELECT os.state_name
         FROM Order_State os
         WHERE os.Order_id = o.O_id
         ORDER BY os.state_date DESC, os.state_id DESC
         LIMIT 1) AS latest_state
      FROM Orders o
      LEFT JOIN Customer c ON o.C_id = c.C_id
      ORDER BY o.O_id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

// GET one order (header + all its items + latest state)
exports.getOrderById = async (req, res) => {
  try {
    const [orderRows] = await db.query(
      `SELECT
        o.*,
        c.C_Name,
        (SELECT os.state_name
         FROM Order_State os
         WHERE os.Order_id = o.O_id
         ORDER BY os.state_date DESC, os.state_id DESC
         LIMIT 1) AS latest_state
       FROM Orders o
       LEFT JOIN Customer c ON o.C_id = c.C_id
       WHERE o.O_id = ?`,
      [req.params.id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const [items] = await db.query(
      `SELECT oi.*, p.P_item AS Product_Name
       FROM Order_Items oi
       JOIN Product p ON oi.P_id = p.P_id
       WHERE oi.O_id = ?`,
      [req.params.id]
    );

    res.json({ ...orderRows[0], items });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
};

// CREATE order — header + multiple items, oo Product stock-ga laga jaraa
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { C_id, O_date, O_AppointmentDate, items } = req.body;

    if (!C_id) {
      return res.status(400).json({ message: 'Customer is required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one order item is required' });
    }

    // Isugee qty-ga haddii isla product-ku dhowr jeer ku jiro items-ka
    const requestedQtyByProduct = {};
    for (const it of items) {
      if (!it.P_id) {
        return res.status(400).json({ message: 'Each item must have a product selected' });
      }
      const qty = parseInt(it.O_quantity) || 0;
      if (qty <= 0) {
        return res.status(400).json({ message: 'Quantity must be greater than 0' });
      }
      requestedQtyByProduct[it.P_id] = (requestedQtyByProduct[it.P_id] || 0) + qty;
    }

    await connection.beginTransaction();

    // Hubi stock-ga Product kasta (FOR UPDATE = lock, si labo order isku mar socda aysan iska qasin)
    const stockByProduct = {};
    for (const P_id of Object.keys(requestedQtyByProduct)) {
      const [[product]] = await connection.query(
        'SELECT P_id, P_item, P_quantity, P_price FROM Product WHERE P_id = ? FOR UPDATE',
        [P_id]
      );

      if (!product) {
        await connection.rollback();
        return res.status(404).json({ message: `Product not found (ID ${P_id})` });
      }

      if (requestedQtyByProduct[P_id] > product.P_quantity) {
        await connection.rollback();
        return res.status(400).json({
          message: `Not enough stock for "${product.P_item}" — only ${product.P_quantity} available, but ${requestedQtyByProduct[P_id]} requested`,
        });
      }

      stockByProduct[P_id] = product;
    }

    const preparedItems = items.map((it) => {
      const quantity = parseInt(it.O_quantity) || 0;
      const price = parseFloat(it.O_price) || 0;
      const discount = parseFloat(it.O_Discount) || 0;
      const subtotal = quantity * price * (1 - discount / 100);
      return {
        P_id: it.P_id,
        O_color: it.O_color || null,
        O_quantity: quantity,
        O_price: price,
        O_Discount: discount,
        O_Subtotal: subtotal,
      };
    });

    const grandTotal = preparedItems.reduce((sum, it) => sum + it.O_Subtotal, 0);
    const orderDate = O_date || new Date().toISOString().slice(0, 10);

    const [orderResult] = await connection.query(
      `INSERT INTO Orders (C_id, O_date, O_AppointmentDate, O_Total) VALUES (?, ?, ?, ?)`,
      [C_id, orderDate, O_AppointmentDate || null, grandTotal]
    );

    const newOrderId = orderResult.insertId;

    for (const it of preparedItems) {
      await connection.query(
        `INSERT INTO Order_Items (O_id, P_id, O_color, O_quantity, O_price, O_Discount, O_Subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [newOrderId, it.P_id, it.O_color, it.O_quantity, it.O_price, it.O_Discount, it.O_Subtotal]
      );
    }

    // Ka jar stock-ga Product-ka, oo dib u xisaabi P_total (Qty cusub × Price)
    for (const P_id of Object.keys(requestedQtyByProduct)) {
      const newQty = stockByProduct[P_id].P_quantity - requestedQtyByProduct[P_id];
      await connection.query(
        `UPDATE Product SET P_quantity = ?, P_total = ? * P_price WHERE P_id = ?`,
        [newQty, newQty, P_id]
      );
    }

    await connection.query(
      `INSERT INTO Order_State (Order_id, state_name, state_date) VALUES (?, ?, ?)`,
      [newOrderId, 'Pending', orderDate]
    );

    await connection.commit();
    res.status(201).json({ message: 'Order created successfully', id: newOrderId });
  } catch (error) {
    await connection.rollback();
    console.error('Create Order Error:', error);
    res.status(500).json({ message: 'Error creating order' });
  } finally {
    connection.release();
  }
};

// UPDATE order — items-kii hore stock-ga waa loo celiyaa, kadibna items-ka cusub isla hubinta ayaa lagu sameeyaa
exports.updateOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { C_id, O_date, O_AppointmentDate, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one order item is required' });
    }

    const requestedQtyByProduct = {};
    for (const it of items) {
      if (!it.P_id) {
        return res.status(400).json({ message: 'Each item must have a product selected' });
      }
      const qty = parseInt(it.O_quantity) || 0;
      if (qty <= 0) {
        return res.status(400).json({ message: 'Quantity must be greater than 0' });
      }
      requestedQtyByProduct[it.P_id] = (requestedQtyByProduct[it.P_id] || 0) + qty;
    }

    await connection.beginTransaction();

    // 1) Soo qaad items-kii hore ee order-kan, stock-gooda soo celi
    const [oldItems] = await connection.query(
      'SELECT P_id, O_quantity FROM Order_Items WHERE O_id = ?',
      [req.params.id]
    );

    for (const oldItem of oldItems) {
      await connection.query(
        'UPDATE Product SET P_quantity = P_quantity + ? WHERE P_id = ?',
        [oldItem.O_quantity, oldItem.P_id]
      );
    }

    // 2) Hubi stock-ga cusub (kaddib markii kii hore la soo celiyay) oo lock gareey
    const stockByProduct = {};
    for (const P_id of Object.keys(requestedQtyByProduct)) {
      const [[product]] = await connection.query(
        'SELECT P_id, P_item, P_quantity, P_price FROM Product WHERE P_id = ? FOR UPDATE',
        [P_id]
      );

      if (!product) {
        await connection.rollback();
        return res.status(404).json({ message: `Product not found (ID ${P_id})` });
      }

      if (requestedQtyByProduct[P_id] > product.P_quantity) {
        await connection.rollback();
        return res.status(400).json({
          message: `Not enough stock for "${product.P_item}" — only ${product.P_quantity} available, but ${requestedQtyByProduct[P_id]} requested`,
        });
      }

      stockByProduct[P_id] = product;
    }

    const preparedItems = items.map((it) => {
      const quantity = parseInt(it.O_quantity) || 0;
      const price = parseFloat(it.O_price) || 0;
      const discount = parseFloat(it.O_Discount) || 0;
      const subtotal = quantity * price * (1 - discount / 100);
      return {
        P_id: it.P_id,
        O_color: it.O_color || null,
        O_quantity: quantity,
        O_price: price,
        O_Discount: discount,
        O_Subtotal: subtotal,
      };
    });

    const grandTotal = preparedItems.reduce((sum, it) => sum + it.O_Subtotal, 0);

    const [result] = await connection.query(
      `UPDATE Orders SET C_id = ?, O_date = ?, O_AppointmentDate = ?, O_Total = ? WHERE O_id = ?`,
      [C_id, O_date, O_AppointmentDate || null, grandTotal, req.params.id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    await connection.query(`DELETE FROM Order_Items WHERE O_id = ?`, [req.params.id]);

    for (const it of preparedItems) {
      await connection.query(
        `INSERT INTO Order_Items (O_id, P_id, O_color, O_quantity, O_price, O_Discount, O_Subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.params.id, it.P_id, it.O_color, it.O_quantity, it.O_price, it.O_Discount, it.O_Subtotal]
      );
    }

    // Ka jar stock-ga cusub, dib u xisaabi P_total
    for (const P_id of Object.keys(requestedQtyByProduct)) {
      const newQty = stockByProduct[P_id].P_quantity - requestedQtyByProduct[P_id];
      await connection.query(
        `UPDATE Product SET P_quantity = ?, P_total = ? * P_price WHERE P_id = ?`,
        [newQty, newQty, P_id]
      );
    }

    await connection.commit();
    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Update Order Error:', error);
    res.status(500).json({ message: 'Error updating order' });
  } finally {
    connection.release();
  }
};

// DELETE order — stock-ga items-ka waa loo celiyaa Product-ka ka hor intii order-ku la tirtirin
exports.deleteOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [items] = await connection.query(
      'SELECT P_id, O_quantity FROM Order_Items WHERE O_id = ?',
      [req.params.id]
    );

    for (const item of items) {
      const [[product]] = await connection.query(
        'SELECT P_quantity FROM Product WHERE P_id = ? FOR UPDATE',
        [item.P_id]
      );
      if (product) {
        const newQty = product.P_quantity + item.O_quantity;
        await connection.query(
          'UPDATE Product SET P_quantity = ?, P_total = ? * P_price WHERE P_id = ?',
          [newQty, newQty, item.P_id]
        );
      }
    }

    const [result] = await connection.query('DELETE FROM Orders WHERE O_id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    await connection.commit();
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Delete Order Error:', error);
    res.status(500).json({ message: 'Error deleting order' });
  } finally {
    connection.release();
  }
};