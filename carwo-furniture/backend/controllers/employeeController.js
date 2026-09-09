const db = require('../config/db');

// GET all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Employee ORDER BY E_id DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET one employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Employee WHERE E_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// CREATE new employee
exports.createEmployee = async (req, res) => {
  try {
    const {
      E_Name, E_address, E_phone, E_Position,
      E_Shift, E_STime, E_ETime, E_Salary
    } = req.body;

    // Hubi in phone-ku uusan horeba u jirin
    if (E_phone) {
      const [existing] = await db.query('SELECT E_id FROM Employee WHERE E_phone = ?', [E_phone]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'This phone number is already registered to another employee' });
      }
    }

    const [result] = await db.query(
      `INSERT INTO Employee 
      (E_Name, E_address, E_phone, E_Position, E_Shift, E_STime, E_ETime, E_Salary) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        E_Name || null,
        E_address || null,
        E_phone || null,
        E_Position || null,
        E_Shift || null,
        E_STime || null,
        E_ETime || null,
        E_Salary || 0
      ]
    );

    res.status(201).json({
      message: 'Employee created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create Employee Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE employee
exports.updateEmployee = async (req, res) => {
  try {
    const {
      E_Name, E_address, E_phone, E_Position,
      E_Shift, E_STime, E_ETime, E_Salary
    } = req.body;

    // Hubi in phone-ku uusan la wadaagin employee kale (isaga oo aan ahayn qofkan)
    if (E_phone) {
      const [existing] = await db.query(
        'SELECT E_id FROM Employee WHERE E_phone = ? AND E_id != ?',
        [E_phone, req.params.id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: 'This phone number is already registered to another employee' });
      }
    }

    const [result] = await db.query(
      `UPDATE Employee SET 
      E_Name=?, E_address=?, E_phone=?, E_Position=?, 
      E_Shift=?, E_STime=?, E_ETime=?, E_Salary=? 
      WHERE E_id=?`,
      [
        E_Name, E_address, E_phone, E_Position,
        E_Shift, E_STime, E_ETime, E_Salary,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE employee
exports.deleteEmployee = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Employee WHERE E_id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};