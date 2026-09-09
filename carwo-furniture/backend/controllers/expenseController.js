const db = require('../config/db');

// GET all expenses + total
exports.getAllExpenses = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Expenses ORDER BY Ex_Date DESC, Ex_id DESC'
    );

    const [sumRows] = await db.query(
      'SELECT COALESCE(SUM(Ex_amount), 0) AS total FROM Expenses'
    );

    res.json({
      expenses: rows,
      total: Number(sumRows[0].total) || 0,
    });
  } catch (error) {
    console.error('GET EXPENSES ERROR:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET one expense
exports.getExpenseById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Expenses WHERE Ex_id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// CREATE expense
exports.createExpense = async (req, res) => {
  try {
    const { Ex_Type, Ex_amount, Ex_Date } = req.body;

    if (!Ex_Type || Ex_amount === undefined || Ex_amount === null || !Ex_Date) {
      return res.status(400).json({
        message: 'Ex_Type, Ex_amount and Ex_Date are required',
      });
    }

    const amount = Number(Ex_amount);
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const [result] = await db.query(
      'INSERT INTO Expenses (Ex_Type, Ex_amount, Ex_Date) VALUES (?, ?, ?)',
      [Ex_Type, amount, Ex_Date]
    );

    res.status(201).json({
      message: 'Expense created successfully',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Create Expense Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE expense
exports.updateExpense = async (req, res) => {
  try {
    const { Ex_Type, Ex_amount, Ex_Date } = req.body;
    const amount = Number(Ex_amount);

    if (!Ex_Type || isNaN(amount) || !Ex_Date) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const [result] = await db.query(
      'UPDATE Expenses SET Ex_Type=?, Ex_amount=?, Ex_Date=? WHERE Ex_id=?',
      [Ex_Type, amount, Ex_Date, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE expense
exports.deleteExpense = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM Expenses WHERE Ex_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// REPORT — daily | weekly | monthly | yearly
exports.getExpenseReport = async (req, res) => {
  try {
    const period = (req.query.period || 'monthly').toLowerCase();
    let startDate = req.query.start_date;
    let endDate = req.query.end_date;

    const today = new Date();
    const toISO = (d) => d.toISOString().slice(0, 10);

    if (!startDate || !endDate) {
      endDate = toISO(today);
      const start = new Date(today);

      if (period === 'daily') {
        startDate = endDate;
      } else if (period === 'weekly') {
        start.setDate(start.getDate() - 6);
        startDate = toISO(start);
      } else if (period === 'yearly') {
        start.setFullYear(start.getFullYear() - 1);
        start.setDate(start.getDate() + 1);
        startDate = toISO(start);
      } else {
        // monthly
        start.setMonth(start.getMonth() - 1);
        start.setDate(start.getDate() + 1);
        startDate = toISO(start);
      }
    }

    const [byType] = await db.query(
      `SELECT 
         Ex_Type AS type,
         COUNT(*) AS count,
         SUM(Ex_amount) AS total
       FROM Expenses
       WHERE Ex_Date BETWEEN ? AND ?
       GROUP BY Ex_Type
       ORDER BY total DESC`,
      [startDate, endDate]
    );

    const [byDay] = await db.query(
      `SELECT 
         Ex_Date AS date,
         SUM(Ex_amount) AS total,
         COUNT(*) AS count
       FROM Expenses
       WHERE Ex_Date BETWEEN ? AND ?
       GROUP BY Ex_Date
       ORDER BY Ex_Date ASC`,
      [startDate, endDate]
    );

    const [sumRows] = await db.query(
      `SELECT 
         COALESCE(SUM(Ex_amount), 0) AS grand_total,
         COUNT(*) AS total_count
       FROM Expenses
       WHERE Ex_Date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    res.json({
      period,
      start_date: startDate,
      end_date: endDate,
      grand_total: Number(sumRows[0].grand_total) || 0,
      total_count: Number(sumRows[0].total_count) || 0,
      by_type: byType.map((r) => ({
        type: r.type,
        count: Number(r.count),
        total: Number(r.total) || 0,
      })),
      by_day: byDay.map((r) => ({
        date: r.date,
        total: Number(r.total) || 0,
        count: Number(r.count),
      })),
    });
  } catch (error) {
    console.error('REPORT ERROR:', error.message);
    res.status(500).json({ message: error.message });
  }
};