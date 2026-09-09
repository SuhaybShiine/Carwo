const db = require('../config/db');

exports.getSystemReport = async (req, res) => {
  try {
    let startDate = req.query.start_date;
    let endDate = req.query.end_date;

    const today = new Date();
    const toISO = (d) => d.toISOString().slice(0, 10);

    if (!startDate || !endDate) {
      endDate = toISO(today);
      const start = new Date(today);
      start.setMonth(start.getMonth() - 1);
      start.setDate(start.getDate() + 1);
      startDate = toISO(start);
    }

    // 1) Payments collected (period)
    const [paySum] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
       FROM Payments
       WHERE payment_date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    // 2) Expenses (period)
    const [expSum] = await db.query(
      `SELECT COALESCE(SUM(Ex_amount), 0) AS total, COUNT(*) AS count
       FROM Expenses
       WHERE Ex_Date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    // 3) Total Salary (all employees — current payroll)
    const [salSum] = await db.query(
      `SELECT COALESCE(SUM(E_Salary), 0) AS total, COUNT(*) AS count
       FROM Employee`
    );

    // 4) Breakdown payments by method
    const [byMethod] = await db.query(
      `SELECT payment_method AS method,
              COUNT(*) AS count,
              COALESCE(SUM(amount), 0) AS total
       FROM Payments
       WHERE payment_date BETWEEN ? AND ?
       GROUP BY payment_method
       ORDER BY total DESC`,
      [startDate, endDate]
    );

    // 5) Breakdown expenses by type
    const [byExpense] = await db.query(
      `SELECT Ex_Type AS type,
              COUNT(*) AS count,
              COALESCE(SUM(Ex_amount), 0) AS total
       FROM Expenses
       WHERE Ex_Date BETWEEN ? AND ?
       GROUP BY Ex_Type
       ORDER BY total DESC`,
      [startDate, endDate]
    );

    // 6) Orders count in period (optional)
    const [orderSum] = await db.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(O_Total), 0) AS total
       FROM Orders
       WHERE O_AppointmentDate BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const grandTotal = Number(paySum[0].total) || 0; // Payments GRAND TOTAL
    const totalExpenses = Number(expSum[0].total) || 0;
    const totalSalary = Number(salSum[0].total) || 0;

    // Net = Grand Totals - Expenses - Salary
    const netProfit = grandTotal - totalExpenses - totalSalary;

    res.json({
      start_date: startDate,
      end_date: endDate,
      grand_total: grandTotal, // Payments collected
      payment_count: Number(paySum[0].count) || 0,
      total_expenses: totalExpenses,
      expense_count: Number(expSum[0].count) || 0,
      total_salary: totalSalary,
      employee_count: Number(salSum[0].count) || 0,
      order_count: Number(orderSum[0].count) || 0,
      order_total: Number(orderSum[0].total) || 0,
      net_profit: netProfit,
      by_method: byMethod.map((r) => ({
        method: r.method || 'Unknown',
        count: Number(r.count),
        total: Number(r.total) || 0,
      })),
      by_expense: byExpense.map((r) => ({
        type: r.type,
        count: Number(r.count),
        total: Number(r.total) || 0,
      })),
    });
  } catch (error) {
    console.error('SYSTEM REPORT ERROR:', error.message);
    res.status(500).json({ message: error.message });
  }
};