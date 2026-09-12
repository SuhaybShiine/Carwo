const db = require('../config/db');
const EXCHANGE_RATE = 11500;

// 1. GET ALL PAYMENTS
exports.getAllPayments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*,
        c.C_Name,
        e.E_Name,
        o.O_AppointmentDate,
        o.O_Total,
        (SELECT GROUP_CONCAT(CONCAT(pr.P_item, ' x', oi.O_quantity) SEPARATOR ', ') 
         FROM Order_Items oi 
         JOIN Product pr ON oi.P_id = pr.P_id 
         WHERE oi.O_id = o.O_id) AS items_with_qty
      FROM Payments p
      LEFT JOIN Orders o ON p.order_id = o.O_id
      LEFT JOIN Customer c ON o.C_id = c.C_id
      LEFT JOIN Employee e ON o.E_id = e.E_id
      ORDER BY p.payment_id DESC
    `);

    const result = rows.map((row) => ({
      ...row,
      amount_sos: (Number(row.amount || 0) * EXCHANGE_RATE).toLocaleString(),
      balance_sos: (Number(row.payment_balance || 0) * EXCHANGE_RATE).toLocaleString(),
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 2. GET ONE PAYMENT (Receipt)
exports.getPaymentById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        p.*,
        c.C_Name,
        e.E_Name,
        o.O_AppointmentDate,
        o.O_Total,
        o.O_id,
        (SELECT GROUP_CONCAT(
           CONCAT(pr.P_item, ':', oi.O_quantity, ':', oi.O_price)
           SEPARATOR ';'
         )
         FROM Order_Items oi
         JOIN Product pr ON oi.P_id = pr.P_id
         WHERE oi.O_id = o.O_id
        ) AS items_raw,
        (SELECT GROUP_CONCAT(CONCAT(pr.P_item, ' x', oi.O_quantity) SEPARATOR ', ')
         FROM Order_Items oi
         JOIN Product pr ON oi.P_id = pr.P_id
         WHERE oi.O_id = o.O_id
        ) AS items_with_qty
      FROM Payments p
      LEFT JOIN Orders o ON p.order_id = o.O_id
      LEFT JOIN Customer c ON o.C_id = c.C_id
      LEFT JOIN Employee e ON o.E_id = e.E_id
      WHERE p.payment_id = ?
      `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const row = rows[0];
    res.json({
      ...row,
      amount_sos: (Number(row.amount || 0) * EXCHANGE_RATE).toLocaleString(),
      balance_sos: (Number(row.payment_balance || 0) * EXCHANGE_RATE).toLocaleString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 3. GET ORDERS FOR DROPDOWN (remaining > 0 only)
exports.getOrdersForPayment = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        o.O_id,
        o.O_Total,
        o.O_AppointmentDate,
        c.C_Name,
        e.E_Name,
        (SELECT GROUP_CONCAT(pr.P_item SEPARATOR ', ') 
         FROM Order_Items oi 
         JOIN Product pr ON oi.P_id = pr.P_id 
         WHERE oi.O_id = o.O_id) AS O_item
      FROM Orders o
      LEFT JOIN Customer c ON o.C_id = c.C_id
      LEFT JOIN Employee e ON o.E_id = e.E_id
      ORDER BY o.O_id DESC
    `);

    const result = [];

    for (const o of orders) {
      const [paidRows] = await db.query(
        'SELECT COALESCE(SUM(amount), 0) AS total_paid FROM Payments WHERE order_id = ?',
        [o.O_id]
      );

      const totalPaid = Number(paidRows[0].total_paid) || 0;
      const orderTotal = Number(o.O_Total) || 0;
      const remaining = orderTotal - totalPaid;

      if (remaining <= 0.01) continue;

      result.push({
        O_id: o.O_id,
        O_item: o.O_item || 'No Item',
        C_Name: o.C_Name || 'No Name',
        E_Name: o.E_Name || null,
        O_Total: orderTotal,
        O_AppointmentDate: o.O_AppointmentDate,
        total_paid: totalPaid,
        remaining: remaining,
      });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 4. GET SALES REPORT
exports.getSalesReport = async (req, res) => {
  try {
    const { filterType } = req.query;
    let condition = 'WHERE 1=1';

    if (filterType === 'daily') {
      condition = 'WHERE DATE(p.payment_date) = CURDATE()';
    } else if (filterType === 'weekly') {
      condition = 'WHERE YEARWEEK(p.payment_date, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (filterType === 'monthly') {
      condition =
        'WHERE YEAR(p.payment_date) = YEAR(CURDATE()) AND MONTH(p.payment_date) = MONTH(CURDATE())';
    } else if (filterType === 'yearly') {
      condition = 'WHERE YEAR(p.payment_date) = YEAR(CURDATE())';
    }

    const [rows] = await db.query(`
      SELECT p.*, c.C_Name, e.E_Name, o.O_Total
      FROM Payments p
      LEFT JOIN Orders o ON p.order_id = o.O_id
      LEFT JOIN Customer c ON o.C_id = c.C_id
      LEFT JOIN Employee e ON o.E_id = e.E_id
      ${condition}
      ORDER BY p.payment_date DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 5. CREATE PAYMENT
exports.createPayment = async (req, res) => {
  try {
    const { order_id, amount, payment_method, payment_date } = req.body;

    if (!order_id || amount === undefined || amount === null || !payment_method) {
      return res.status(400).json({
        message: 'order_id, amount and payment_method are required',
      });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const [orderRows] = await db.query(
      'SELECT O_Total FROM Orders WHERE O_id = ?',
      [order_id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderTotal = Number(orderRows[0].O_Total) || 0;

    const [paidRows] = await db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total_paid FROM Payments WHERE order_id = ?',
      [order_id]
    );

    const totalPaid = Number(paidRows[0].total_paid) || 0;
    const remaining = orderTotal - totalPaid;

    if (remaining <= 0.01) {
      return res.status(400).json({
        message: 'Order-kan waa la bixiyey (PAID). Lama qaadan karo lacag kale.',
      });
    }

    if (payAmount > remaining + 0.01) {
      return res.status(400).json({
        message: `Lacagtu way ka badan tahay remaining. Max: $${remaining.toFixed(2)}`,
      });
    }

    const payment_balance = Math.max(0, remaining - payAmount);
    const date = payment_date || new Date().toISOString().slice(0, 10);

    const [result] = await db.query(
      `INSERT INTO Payments (order_id, payment_date, amount, payment_method, payment_balance)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, date, payAmount, payment_method, payment_balance]
    );

    res.status(201).json({
      message: 'Payment recorded successfully',
      id: result.insertId,
      payment_balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 6. UPDATE PAYMENT
exports.updatePayment = async (req, res) => {
  try {
    const { amount, payment_method, payment_date } = req.body;
    const payment_id = req.params.id;

    const [currentRows] = await db.query(
      'SELECT * FROM Payments WHERE payment_id = ?',
      [payment_id]
    );

    if (currentRows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const current = currentRows[0];
    const payAmount =
      amount !== undefined && amount !== null
        ? Number(amount)
        : Number(current.amount);

    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const order_id = current.order_id;

    const [orderRows] = await db.query(
      'SELECT O_Total FROM Orders WHERE O_id = ?',
      [order_id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderTotal = Number(orderRows[0].O_Total) || 0;

    const [paidRows] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM Payments
       WHERE order_id = ? AND payment_id != ?`,
      [order_id, payment_id]
    );

    const totalPaidOthers = Number(paidRows[0].total_paid) || 0;
    const maxAllowed = orderTotal - totalPaidOthers;

    if (payAmount > maxAllowed + 0.01) {
      return res.status(400).json({
        message: `Exceeds remaining. Max: $${maxAllowed.toFixed(2)}`,
      });
    }

    const payment_balance = Math.max(0, orderTotal - (totalPaidOthers + payAmount));

    await db.query(
      `UPDATE Payments SET
        amount = ?,
        payment_method = ?,
        payment_date = ?,
        payment_balance = ?
       WHERE payment_id = ?`,
      [
        payAmount,
        payment_method || current.payment_method,
        payment_date || current.payment_date,
        payment_balance,
        payment_id,
      ]
    );

    res.json({ message: 'Payment updated successfully', payment_balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 7. PAY BALANCE
exports.payBalance = async (req, res) => {
  try {
    const { amount_paid, payment_method } = req.body;
    const payAmount = Number(amount_paid);

    if (!payment_method) {
      return res.status(400).json({ message: 'Payment method is required' });
    }
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const [rows] = await db.query(
      'SELECT * FROM Payments WHERE payment_id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = rows[0];
    const balance = Number(payment.payment_balance) || 0;

    if (balance <= 0.01) {
      return res.status(400).json({
        message: 'Payment-kan waa PAID. Lama qaadan karo baaqi.',
      });
    }

    if (payAmount > balance + 0.01) {
      return res.status(400).json({
        message: `Cannot exceed balance ($${balance.toFixed(2)})`,
      });
    }

    const newAmount = Number(payment.amount) + payAmount;
    const newBalance = Math.max(0, balance - payAmount);

    await db.query(
      `UPDATE Payments SET
        amount = ?,
        payment_balance = ?,
        payment_method = ?,
        payment_date = ?
       WHERE payment_id = ?`,
      [
        newAmount,
        newBalance,
        payment_method,
        new Date().toISOString().slice(0, 10),
        req.params.id,
      ]
    );

    res.json({
      message: 'Balance payment recorded successfully',
      payment_balance: newBalance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 8. DELETE PAYMENT
exports.deletePayment = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM Payments WHERE payment_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};