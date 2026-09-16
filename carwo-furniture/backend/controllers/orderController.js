const db = require('../config/db');

// =====================================================
// FABRIC HELPERS
// =====================================================

async function calcFormulaLines(connection, Item_Type, quantity) {
  const qty = parseInt(quantity, 10) || 0;
  if (!Item_Type || qty <= 0) return [];

  const [formulas] = await connection.query(
    'SELECT Material, Waar_Per_Unit FROM Fabric_Formula WHERE Item_Type = ?',
    [Item_Type]
  );
  if (formulas.length === 0) return null;

  return formulas.map((f) => ({
    Material: f.Material,
    Needed: Number(f.Waar_Per_Unit) * qty,
  }));
}

async function lockAndCheckFabric(connection, Fabric_id, needed, label) {
  const [rows] = await connection.query(
    'SELECT * FROM Fabric_Inventory WHERE Fabric_id = ? FOR UPDATE',
    [Fabric_id]
  );
  if (rows.length === 0) {
    const err = new Error(`${label || 'Fabric'} not found`);
    err.status = 404;
    throw err;
  }
  const fabric = rows[0];
  const available = Number(fabric.Available_Waar) || 0;
  if (needed > available + 0.001) {
    const err = new Error(
      `${label || 'Maro'} kuma filna: ${fabric.Fabric_Code} (${fabric.Color}) — loo baahan ${needed.toFixed(
        2
      )} waar, taalla ${available.toFixed(2)} waar`
    );
    err.status = 400;
    throw err;
  }
  return fabric;
}

async function deductFabricInventory(connection, Fabric_id, needed) {
  if (!Fabric_id || needed <= 0) return;
  const [result] = await connection.query(
    `UPDATE Fabric_Inventory
     SET Available_Waar = Available_Waar - ?
     WHERE Fabric_id = ? AND Available_Waar >= ?`,
    [needed, Fabric_id, needed]
  );
  if (result.affectedRows === 0) {
    const err = new Error('Could not deduct fabric waar from inventory');
    err.status = 400;
    throw err;
  }
}

async function restoreFabricInventory(connection, Fabric_id, needed) {
  if (!Fabric_id || needed <= 0) return;
  await connection.query(
    `UPDATE Fabric_Inventory
     SET Available_Waar = Available_Waar + ?
     WHERE Fabric_id = ?`,
    [needed, Fabric_id]
  );
}

async function prepareOrderItems(connection, items) {
  const prepared = [];

  for (const it of items) {
    const quantity = parseInt(it.O_quantity, 10) || 0;
    const price = parseFloat(it.O_price) || 0;
    // Discount = $ go'an (35 - 5 = 30) — MA AHA %
    const discount = parseFloat(it.O_Discount) || 0;
    const raw = quantity * price;
    const subtotal = Math.max(0, raw - discount);

    if (discount > raw + 0.001) {
      const err = new Error(
        `Discount ($${discount}) cannot exceed line amount ($${raw.toFixed(2)})`
      );
      err.status = 400;
      throw err;
    }

    const Item_Type = it.Item_Type || null;
    const Fabric_id = it.Fabric_id ? Number(it.Fabric_id) : null;
    const Shabag_Fabric_id = it.Shabag_Fabric_id
      ? Number(it.Shabag_Fabric_id)
      : null;

    let Waar_Used = 0;
    let Shabag_Waar_Used = 0;

    if (Item_Type) {
      const lines = await calcFormulaLines(connection, Item_Type, quantity);
      if (lines === null) {
        const err = new Error(`No fabric formula for "${Item_Type}"`);
        err.status = 400;
        throw err;
      }

      const isGogol =
        Item_Type === 'Gogol design' || Item_Type === 'Gogol shuuliyo';

      for (const line of lines) {
        if (line.Material === 'Fabric' || line.Material === 'Shuuliyo') {
          if (!Fabric_id) {
            const err = new Error(
              isGogol
                ? `Dooro GOGOL (e.g. GOG001) for "${Item_Type}"`
                : `Dooro maro for "${Item_Type}"`
            );
            err.status = 400;
            throw err;
          }
          await lockAndCheckFabric(
            connection,
            Fabric_id,
            line.Needed,
            isGogol ? 'Gogol' : 'Maro'
          );
          Waar_Used = line.Needed;
        }

        if (line.Material === 'Shabag') {
          if (!Shabag_Fabric_id) {
            const err = new Error(
              `Dooro SHABAG gooni (e.g. SHB001) — ${line.Needed} waar`
            );
            err.status = 400;
            throw err;
          }
          await lockAndCheckFabric(
            connection,
            Shabag_Fabric_id,
            line.Needed,
            'Shabag'
          );
          Shabag_Waar_Used = line.Needed;
        }
      }
    }

    prepared.push({
      P_id: it.P_id,
      Item_Type,
      Fabric_id,
      Shabag_Fabric_id,
      Waar_Used,
      Shabag_Waar_Used,
      O_color: it.O_color || null,
      O_quantity: quantity,
      O_price: price,
      O_Discount: discount,
      O_Subtotal: subtotal,
    });
  }

  return prepared;
}

// =====================================================
// GET ALL
// =====================================================
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        o.*,
        c.C_Name,
        e.E_Name,
        (SELECT COUNT(*) FROM Order_Items oi WHERE oi.O_id = o.O_id) AS item_count,
        (SELECT GROUP_CONCAT(p.P_item SEPARATOR ', ')
         FROM Order_Items oi JOIN Product p ON oi.P_id = p.P_id
         WHERE oi.O_id = o.O_id) AS item_names,
        (SELECT GROUP_CONCAT(DISTINCT NULLIF(TRIM(oi.O_color), '') SEPARATOR ', ')
         FROM Order_Items oi WHERE oi.O_id = o.O_id) AS item_colors,
        (SELECT GROUP_CONCAT(DISTINCT NULLIF(TRIM(oi.Item_Type), '') SEPARATOR ', ')
         FROM Order_Items oi WHERE oi.O_id = o.O_id) AS item_types,
        (SELECT COALESCE(SUM(oi.Waar_Used), 0) + COALESCE(SUM(COALESCE(oi.Shabag_Waar_Used,0)), 0)
         FROM Order_Items oi WHERE oi.O_id = o.O_id) AS total_waar,
        (SELECT COALESCE(SUM(oi.O_quantity), 0)
         FROM Order_Items oi WHERE oi.O_id = o.O_id) AS total_qty,
        (SELECT os.state_name FROM Order_State os
         WHERE os.Order_id = o.O_id
         ORDER BY os.state_date DESC, os.state_id DESC LIMIT 1) AS latest_state
      FROM Orders o
      LEFT JOIN Customer c ON o.C_id = c.C_id
      LEFT JOIN Employee e ON o.E_id = e.E_id
      ORDER BY o.O_id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message || 'Error fetching orders' });
  }
};

// =====================================================
// GET ONE
// =====================================================
exports.getOrderById = async (req, res) => {
  try {
    const [orderRows] = await db.query(
      `SELECT o.*, c.C_Name, e.E_Name,
        (SELECT os.state_name FROM Order_State os
         WHERE os.Order_id = o.O_id
         ORDER BY os.state_date DESC, os.state_id DESC LIMIT 1) AS latest_state
       FROM Orders o
       LEFT JOIN Customer c ON o.C_id = c.C_id
       LEFT JOIN Employee e ON o.E_id = e.E_id
       WHERE o.O_id = ?`,
      [req.params.id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const [items] = await db.query(
      `SELECT oi.*, p.P_item AS Product_Name,
              fi.Fabric_Code, fi.Fabric_Name, fi.Color AS Fabric_Color,
              sh.Fabric_Code AS Shabag_Code, sh.Fabric_Name AS Shabag_Name
       FROM Order_Items oi
       JOIN Product p ON oi.P_id = p.P_id
       LEFT JOIN Fabric_Inventory fi ON oi.Fabric_id = fi.Fabric_id
       LEFT JOIN Fabric_Inventory sh ON oi.Shabag_Fabric_id = sh.Fabric_id
       WHERE oi.O_id = ?`,
      [req.params.id]
    );

    res.json({ ...orderRows[0], items });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: error.message || 'Error fetching order' });
  }
};

// =====================================================
// CREATE
// =====================================================
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { C_id, E_id, O_date, O_AppointmentDate, items } = req.body;

    if (!C_id) return res.status(400).json({ message: 'Customer is required' });
    if (!E_id) return res.status(400).json({ message: 'Employee is required' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one order item is required' });
    }

    const requestedQtyByProduct = {};
    for (const it of items) {
      if (!it.P_id) {
        return res.status(400).json({ message: 'Each item must have a product selected' });
      }
      const qty = parseInt(it.O_quantity, 10) || 0;
      if (qty <= 0) {
        return res.status(400).json({ message: 'Quantity must be greater than 0' });
      }
      requestedQtyByProduct[it.P_id] = (requestedQtyByProduct[it.P_id] || 0) + qty;
    }

    await connection.beginTransaction();

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
          message: `Not enough stock for "${product.P_item}"`,
        });
      }
      stockByProduct[P_id] = product;
    }

    let preparedItems;
    try {
      preparedItems = await prepareOrderItems(connection, items);
    } catch (e) {
      await connection.rollback();
      return res.status(e.status || 400).json({ message: e.message });
    }

    const grandTotal = preparedItems.reduce((sum, it) => sum + it.O_Subtotal, 0);
    const orderDate = O_date || new Date().toISOString().slice(0, 10);

    const [orderResult] = await connection.query(
      `INSERT INTO Orders (C_id, E_id, O_date, O_AppointmentDate, O_Total)
       VALUES (?, ?, ?, ?, ?)`,
      [C_id, E_id, orderDate, O_AppointmentDate || null, grandTotal]
    );
    const newOrderId = orderResult.insertId;

    for (const it of preparedItems) {
      await connection.query(
        `INSERT INTO Order_Items
         (O_id, P_id, Item_Type, Fabric_id, Shabag_Fabric_id,
          Waar_Used, Shabag_Waar_Used, O_color, O_quantity, O_price, O_Discount, O_Subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newOrderId,
          it.P_id,
          it.Item_Type,
          it.Fabric_id,
          it.Shabag_Fabric_id,
          it.Waar_Used,
          it.Shabag_Waar_Used,
          it.O_color,
          it.O_quantity,
          it.O_price,
          it.O_Discount,
          it.O_Subtotal,
        ]
      );
    }

    for (const P_id of Object.keys(requestedQtyByProduct)) {
      const newQty = stockByProduct[P_id].P_quantity - requestedQtyByProduct[P_id];
      await connection.query(
        'UPDATE Product SET P_quantity = ?, P_total = ? * P_price WHERE P_id = ?',
        [newQty, newQty, P_id]
      );
    }

    for (const it of preparedItems) {
      try {
        if (it.Fabric_id && it.Waar_Used > 0) {
          await deductFabricInventory(connection, it.Fabric_id, it.Waar_Used);
        }
        if (it.Shabag_Fabric_id && it.Shabag_Waar_Used > 0) {
          await deductFabricInventory(
            connection,
            it.Shabag_Fabric_id,
            it.Shabag_Waar_Used
          );
        }
      } catch (e) {
        await connection.rollback();
        return res.status(e.status || 400).json({ message: e.message });
      }
    }

    await connection.query(
      'INSERT INTO Order_State (Order_id, state_name, state_date) VALUES (?, ?, ?)',
      [newOrderId, 'Pending', orderDate]
    );

    await connection.commit();
    res.status(201).json({ message: 'Order created successfully', id: newOrderId });
  } catch (error) {
    await connection.rollback();
    console.error('Create Order Error:', error);
    res.status(500).json({ message: error.message || 'Error creating order' });
  } finally {
    connection.release();
  }
};

// =====================================================
// UPDATE
// =====================================================
exports.updateOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { C_id, E_id, O_date, O_AppointmentDate, items } = req.body;

    if (!C_id) return res.status(400).json({ message: 'Customer is required' });
    if (!E_id) return res.status(400).json({ message: 'Employee is required' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one order item is required' });
    }

    const requestedQtyByProduct = {};
    for (const it of items) {
      if (!it.P_id) {
        return res.status(400).json({ message: 'Each item must have a product selected' });
      }
      const qty = parseInt(it.O_quantity, 10) || 0;
      if (qty <= 0) {
        return res.status(400).json({ message: 'Quantity must be greater than 0' });
      }
      requestedQtyByProduct[it.P_id] = (requestedQtyByProduct[it.P_id] || 0) + qty;
    }

    await connection.beginTransaction();

    const [oldItems] = await connection.query(
      `SELECT P_id, O_quantity, Fabric_id, Waar_Used,
              Shabag_Fabric_id, Shabag_Waar_Used
       FROM Order_Items WHERE O_id = ?`,
      [req.params.id]
    );

    for (const oldItem of oldItems) {
      await connection.query(
        'UPDATE Product SET P_quantity = P_quantity + ? WHERE P_id = ?',
        [oldItem.O_quantity, oldItem.P_id]
      );
      await restoreFabricInventory(
        connection,
        oldItem.Fabric_id,
        Number(oldItem.Waar_Used) || 0
      );
      await restoreFabricInventory(
        connection,
        oldItem.Shabag_Fabric_id,
        Number(oldItem.Shabag_Waar_Used) || 0
      );
    }

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
          message: `Not enough stock for "${product.P_item}"`,
        });
      }
      stockByProduct[P_id] = product;
    }

    let preparedItems;
    try {
      preparedItems = await prepareOrderItems(connection, items);
    } catch (e) {
      await connection.rollback();
      return res.status(e.status || 400).json({ message: e.message });
    }

    const grandTotal = preparedItems.reduce((sum, it) => sum + it.O_Subtotal, 0);

    const [result] = await connection.query(
      `UPDATE Orders
       SET C_id = ?, E_id = ?, O_date = ?, O_AppointmentDate = ?, O_Total = ?
       WHERE O_id = ?`,
      [C_id, E_id, O_date, O_AppointmentDate || null, grandTotal, req.params.id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    await connection.query('DELETE FROM Order_Items WHERE O_id = ?', [req.params.id]);

    for (const it of preparedItems) {
      await connection.query(
        `INSERT INTO Order_Items
         (O_id, P_id, Item_Type, Fabric_id, Shabag_Fabric_id,
          Waar_Used, Shabag_Waar_Used, O_color, O_quantity, O_price, O_Discount, O_Subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.params.id,
          it.P_id,
          it.Item_Type,
          it.Fabric_id,
          it.Shabag_Fabric_id,
          it.Waar_Used,
          it.Shabag_Waar_Used,
          it.O_color,
          it.O_quantity,
          it.O_price,
          it.O_Discount,
          it.O_Subtotal,
        ]
      );
    }

    for (const P_id of Object.keys(requestedQtyByProduct)) {
      const newQty = stockByProduct[P_id].P_quantity - requestedQtyByProduct[P_id];
      await connection.query(
        'UPDATE Product SET P_quantity = ?, P_total = ? * P_price WHERE P_id = ?',
        [newQty, newQty, P_id]
      );
    }

    for (const it of preparedItems) {
      try {
        if (it.Fabric_id && it.Waar_Used > 0) {
          await deductFabricInventory(connection, it.Fabric_id, it.Waar_Used);
        }
        if (it.Shabag_Fabric_id && it.Shabag_Waar_Used > 0) {
          await deductFabricInventory(
            connection,
            it.Shabag_Fabric_id,
            it.Shabag_Waar_Used
          );
        }
      } catch (e) {
        await connection.rollback();
        return res.status(e.status || 400).json({ message: e.message });
      }
    }

    await connection.commit();
    res.json({ message: 'Order updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Update Order Error:', error);
    res.status(500).json({ message: error.message || 'Error updating order' });
  } finally {
    connection.release();
  }
};

// =====================================================
// DELETE
// =====================================================
exports.deleteOrder = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [items] = await connection.query(
      `SELECT P_id, O_quantity, Fabric_id, Waar_Used,
              Shabag_Fabric_id, Shabag_Waar_Used
       FROM Order_Items WHERE O_id = ?`,
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
      await restoreFabricInventory(
        connection,
        item.Fabric_id,
        Number(item.Waar_Used) || 0
      );
      await restoreFabricInventory(
        connection,
        item.Shabag_Fabric_id,
        Number(item.Shabag_Waar_Used) || 0
      );
    }

    const [result] = await connection.query(
      'DELETE FROM Orders WHERE O_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    await connection.commit();
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Delete Order Error:', error);
    res.status(500).json({ message: error.message || 'Error deleting order' });
  } finally {
    connection.release();
  }
};