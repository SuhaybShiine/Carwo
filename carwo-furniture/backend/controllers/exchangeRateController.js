const db = require('../config/db');

// ============================================================
// 1. GET ALL RATES
// ============================================================
exports.getAllRates = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM Exchange_Rates ORDER BY rate_date DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 2. GET TODAY'S RATE (ama kii ugu dambeeyay)
// ============================================================
exports.getTodayRate = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM Exchange_Rates 
       WHERE rate_date <= CURDATE() 
       ORDER BY rate_date DESC 
       LIMIT 1`
    );

    if (rows.length === 0) {
      return res.json({ rate: null, rate_date: null });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 3. GET RATE FOR SPECIFIC DATE
// ============================================================
exports.getRateByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const [rows] = await db.query(
      `SELECT * FROM Exchange_Rates 
       WHERE rate_date <= ? 
       ORDER BY rate_date DESC 
       LIMIT 1`,
      [date]
    );

    if (rows.length === 0) {
      return res.json({ rate: null, rate_date: null });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 4. CREATE OR UPDATE RATE (haddii maanta jiro → update)
// ============================================================
exports.createOrUpdateRate = async (req, res) => {
  try {
    const { rate_date, rate, note } = req.body;

    if (!rate_date || !rate) {
      return res.status(400).json({
        message: 'rate_date iyo rate waa qasab',
      });
    }

    const numRate = Number(rate);
    if (isNaN(numRate) || numRate <= 0) {
      return res.status(400).json({
        message: 'Rate-ku waa in uu ka badan yahay 0',
      });
    }

    // Hubi haddii rate maalintaas jiro
    const [existing] = await db.query(
      'SELECT rate_id FROM Exchange_Rates WHERE rate_date = ?',
      [rate_date]
    );

    if (existing.length > 0) {
      await db.query(
        `UPDATE Exchange_Rates 
         SET rate = ?, note = ? 
         WHERE rate_id = ?`,
        [numRate, note || null, existing[0].rate_id]
      );
      return res.json({
        message: 'Rate-ka waa la cusboonaysiiyay',
        rate_id: existing[0].rate_id,
        updated: true,
      });
    }

    // Abuur mid cusub
    const [result] = await db.query(
      `INSERT INTO Exchange_Rates (rate_date, rate, note)
       VALUES (?, ?, ?)`,
      [rate_date, numRate, note || null]
    );

    res.status(201).json({
      message: 'Rate-ka waa la kaydiyay',
      rate_id: result.insertId,
      created: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 5. DELETE RATE
// ============================================================
exports.deleteRate = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM Exchange_Rates WHERE rate_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Rate lama helin' });
    }

    res.json({ message: 'Rate-ka waa la tirtiray' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};