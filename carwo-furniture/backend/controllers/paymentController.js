const db = require('../config/db');

// ============================================================
// CASH METHODS — CASE-INSENSITIVE
// ============================================================
const CASH_METHODS_LOWER = ['zaad kaash', 'kaash', 'e-dahab kaash'];

const isCashMethod = (method) => {
  if (!method) return false;
  return CASH_METHODS_LOWER.includes(String(method).trim().toLowerCase());
};

// ============================================================
// HELPER — Soo hel rate-ka (fallback maanta)
// ============================================================
async function getExchangeRate(forDate) {
  const [rows] = await db.query(
    `SELECT rate FROM Exchange_Rates 
     WHERE rate_date <= ? 
     ORDER BY rate_date DESC 
     LIMIT 1`,
    [forDate]
  );
  if (rows.length > 0) return Number(rows[0].rate);

  const [latest] = await db.query(
    `SELECT rate FROM Exchange_Rates 
     ORDER BY rate_date DESC 
     LIMIT 1`
  );
  return latest.length > 0 ? Number(latest[0].rate) : null;
}

// ============================================================
// 1. GET ALL PAYMENTS
// ============================================================
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

    const result = rows.map((row) => {
      const paidAmt = Number(row.paid_amount) || 0;
      const isCash = row.paid_currency === 'SLSH';

      return {
        ...row,
        amount_sos: isCash && paidAmt > 0 ? paidAmt.toLocaleString() : null,
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 2. GET ONE PAYMENT
// ============================================================
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

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 3. GET ORDERS FOR DROPDOWN
// ============================================================
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

// ============================================================
// 4. GET SALES REPORT
// ============================================================
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

// ============================================================
// 5. CREATE PAYMENT
// ============================================================
exports.createPayment = async (req, res) => {
  try {
    const { order_id, amount, payment_method, payment_date } = req.body;

    if (!order_id || amount === undefined || amount === null || !payment_method) {
      return res.status(400).json({
        message: 'order_id, amount iyo payment_method waa qasab',
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
        message: 'Order-kan waa la bixiyey (PAID).',
      });
    }

    const date = payment_date || new Date().toISOString().slice(0, 10);

    // SARIF LOGIC
    const isCash = isCashMethod(payment_method);
    let usdAmount;
    let paidCurrency;
    let rateUsed = null;

    if (isCash) {
      const rate = await getExchangeRate(date);
      if (!rate || rate <= 0) {
        return res.status(400).json({
          message: 'Ma jiro sarif. Fadlan marka hore dhigo sarifka.',
        });
      }
      usdAmount = payAmount / rate;
      paidCurrency = 'SLSH';
      rateUsed = rate;
    } else {
      usdAmount = payAmount;
      paidCurrency = 'USD';
    }

    if (usdAmount > remaining + 0.01) {
      const maxMsg =
        isCash && rateUsed
          ? ` | Max SLSH: ${Math.round(remaining * rateUsed).toLocaleString()}`
          : '';
      return res.status(400).json({
        message: `Lacagtu way ka badan tahay remaining. Max: $${remaining.toFixed(2)}${maxMsg}`,
      });
    }

    const payment_balance = Math.max(0, remaining - usdAmount);

    const [result] = await db.query(
      `INSERT INTO Payments 
        (order_id, payment_date, amount, paid_amount, paid_currency, exchange_rate_used, payment_method, payment_balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        date,
        usdAmount,
        payAmount,
        paidCurrency,
        rateUsed,
        payment_method,
        payment_balance,
      ]
    );

    res.status(201).json({
      message: 'Payment recorded successfully',
      id: result.insertId,
      payment_balance,
      exchange_rate_used: rateUsed,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 6. UPDATE PAYMENT
// ============================================================
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
        : Number(current.paid_amount || current.amount);

    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const order_id = current.order_id;
    const method = payment_method || current.payment_method;
    const date = payment_date || current.payment_date;

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

    // SARIF LOGIC — isticmaal rate-kii hore haddii jiro
    const isCash = isCashMethod(method);
    let usdAmount;
    let paidCurrency;
    let rateUsed = null;

    if (isCash) {
      let rate = Number(current.exchange_rate_used) || null;

      if (!rate || rate <= 0) {
        rate = await getExchangeRate(date);
      }

      if (!rate || rate <= 0) {
        rate = await getExchangeRate(new Date().toISOString().slice(0, 10));
      }

      if (!rate || rate <= 0) {
        return res.status(400).json({
          message: 'Ma jiro sarif la heli karo. Fadlan sarifka dhigo.',
        });
      }

      usdAmount = payAmount / rate;
      paidCurrency = 'SLSH';
      rateUsed = rate;
    } else {
      usdAmount = payAmount;
      paidCurrency = 'USD';
    }

    if (usdAmount > maxAllowed + 0.01) {
      const maxMsg =
        isCash && rateUsed
          ? ` | Max SLSH: ${Math.round(maxAllowed * rateUsed).toLocaleString()}`
          : '';
      return res.status(400).json({
        message: `Exceeds remaining. Max: $${maxAllowed.toFixed(2)}${maxMsg}`,
      });
    }

    const payment_balance = Math.max(
      0,
      orderTotal - (totalPaidOthers + usdAmount)
    );

    await db.query(
      `UPDATE Payments SET
        amount = ?,
        paid_amount = ?,
        paid_currency = ?,
        exchange_rate_used = ?,
        payment_method = ?,
        payment_date = ?,
        payment_balance = ?
       WHERE payment_id = ?`,
      [
        usdAmount,
        payAmount,
        paidCurrency,
        rateUsed,
        method,
        date,
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

// ============================================================
// 7. PAY BALANCE — ROBUST (NaN/Null safe)
// ============================================================
exports.payBalance = async (req, res) => {
  try {
    const { amount_paid, payment_method } = req.body;

    if (!amount_paid || !payment_method) {
      return res.status(400).json({
        message: 'amount_paid iyo payment_method waa qasab',
      });
    }

    const payAmount = Number(amount_paid);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({
        message: 'Amount must be greater than 0',
      });
    }

    const [rows] = await db.query(
      'SELECT * FROM Payments WHERE payment_id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = rows[0];

    // SAFE PARSING — NULL/undefined safe
    const balance = parseFloat(payment.payment_balance) || 0;
    const currentAmount = parseFloat(payment.amount) || 0;
    const currentPaidAmount =
      payment.paid_amount !== null && payment.paid_amount !== undefined
        ? parseFloat(payment.paid_amount) || currentAmount
        : currentAmount;

    console.log('💰 payBalance INPUT:', {
      payment_id: req.params.id,
      balance,
      currentAmount,
      currentPaidAmount,
      payAmount,
      payment_method,
    });

    if (balance <= 0.01) {
      return res.status(400).json({
        message: 'Payment-kan waa PAID. Lama qaadan karo baaqi.',
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    // SARIF LOGIC
    const isCash = isCashMethod(payment_method);
    let usdAmount;
    let rateUsed = null;
    let paidCurrency = 'USD';

    if (isCash) {
      const rate = await getExchangeRate(today);
      if (!rate || rate <= 0) {
        return res.status(400).json({
          message: 'Ma jiro sarif maanta. Fadlan sarifka dhigo.',
        });
      }
      usdAmount = payAmount / rate;
      rateUsed = rate;
      paidCurrency = 'SLSH';
    } else {
      usdAmount = payAmount;
    }

    if (usdAmount > balance + 0.01) {
      const maxMsg =
        isCash && rateUsed
          ? ` | Max SLSH: ${Math.round(balance * rateUsed).toLocaleString()}`
          : '';
      return res.status(400).json({
        message: `Cannot exceed balance ($${balance.toFixed(2)})${maxMsg}`,
      });
    }

    const newAmount = currentAmount + usdAmount;
    const newPaidAmount = currentPaidAmount + payAmount;
    const newBalance = Math.max(0, balance - usdAmount);

    console.log('💰 payBalance OUTPUT:', {
      newAmount,
      newPaidAmount,
      newBalance,
      paidCurrency,
      rateUsed,
    });

    await db.query(
      `UPDATE Payments SET
        amount = ?,
        paid_amount = ?,
        paid_currency = ?,
        exchange_rate_used = ?,
        payment_balance = ?,
        payment_method = ?,
        payment_date = ?
       WHERE payment_id = ?`,
      [
        newAmount,
        newPaidAmount,
        paidCurrency,
        rateUsed,
        newBalance,
        payment_method,
        today,
        req.params.id,
      ]
    );

    res.json({
      message: 'Balance payment recorded successfully',
      payment_balance: newBalance,
    });
  } catch (error) {
    console.error('❌ payBalance ERROR:', error);
    res.status(500).json({
      message: error.message || 'Khalad ayaa dhacay backend-ka',
      code: error.code || null,
    });
  }
};

// ============================================================
// 8. DELETE PAYMENT
// ============================================================
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