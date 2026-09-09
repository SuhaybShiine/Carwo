const db = require('../config/db');

// GET all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Supplier ORDER BY Sup_id DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET one supplier
exports.getSupplierById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Supplier WHERE Sup_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// CREATE supplier
exports.createSupplier = async (req, res) => {
  try {
    const { Sup_Name, Sup_address, Sup_phone } = req.body;

    // Hubi in phone-ku uusan horeba u jirin
    if (Sup_phone) {
      const [existing] = await db.query('SELECT Sup_id FROM Supplier WHERE Sup_phone = ?', [Sup_phone]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'This phone number is already registered to another supplier' });
      }
    }

    const [result] = await db.query(
      'INSERT INTO Supplier (Sup_Name, Sup_address, Sup_phone) VALUES (?, ?, ?)',
      [Sup_Name || null, Sup_address || null, Sup_phone || null]
    );

    res.status(201).json({
      message: 'Supplier created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create Supplier Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE supplier
exports.updateSupplier = async (req, res) => {
  try {
    const { Sup_Name, Sup_address, Sup_phone } = req.body;

    // Hubi in phone-ku uusan la wadaagin supplier kale (isaga oo aan ahayn qofkan)
    if (Sup_phone) {
      const [existing] = await db.query(
        'SELECT Sup_id FROM Supplier WHERE Sup_phone = ? AND Sup_id != ?',
        [Sup_phone, req.params.id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: 'This phone number is already registered to another supplier' });
      }
    }

    const [result] = await db.query(
      'UPDATE Supplier SET Sup_Name=?, Sup_address=?, Sup_phone=? WHERE Sup_id=?',
      [Sup_Name, Sup_address, Sup_phone, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Supplier WHERE Sup_id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};