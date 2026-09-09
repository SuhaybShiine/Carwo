const db = require('../config/db');

// GET all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Customer ORDER BY C_id DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET one customer
exports.getCustomerById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Customer WHERE C_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// CREATE customer
exports.createCustomer = async (req, res) => {
  try {
    const { C_Name, C_address, C_phone } = req.body;

    // Hubi in phone-ku uusan horeba u jirin
    if (C_phone) {
      const [existing] = await db.query('SELECT C_id FROM Customer WHERE C_phone = ?', [C_phone]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'This phone number is already registered to another customer' });
      }
    }

    const [result] = await db.query(
      'INSERT INTO Customer (C_Name, C_address, C_phone) VALUES (?, ?, ?)',
      [C_Name || null, C_address || null, C_phone || null]
    );

    res.status(201).json({
      message: 'Customer created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create Customer Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE customer
exports.updateCustomer = async (req, res) => {
  try {
    const { C_Name, C_address, C_phone } = req.body;

    // Hubi in phone-ku uusan la wadaagin customer kale (isaga oo aan ahayn qofkan)
    if (C_phone) {
      const [existing] = await db.query(
        'SELECT C_id FROM Customer WHERE C_phone = ? AND C_id != ?',
        [C_phone, req.params.id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: 'This phone number is already registered to another customer' });
      }
    }

    const [result] = await db.query(
      'UPDATE Customer SET C_Name=?, C_address=?, C_phone=? WHERE C_id=?',
      [C_Name, C_address, C_phone, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE customer
exports.deleteCustomer = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Customer WHERE C_id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};