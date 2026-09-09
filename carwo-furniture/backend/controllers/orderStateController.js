const db = require('../config/db');

// GET all states for a specific order (newest first)
exports.getStatesByOrder = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT os.*, o.O_id, c.C_Name
       FROM Order_State os
       JOIN Orders o ON os.Order_id = o.O_id
       LEFT JOIN Customer c ON o.C_id = c.C_id
       WHERE os.Order_id = ?
       ORDER BY os.state_date DESC, os.state_id DESC`,
      [req.params.orderId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching order states:', error);
    res.status(500).json({ message: 'Error fetching order states' });
  }
};

// GET one state
exports.getStateById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Order_State WHERE state_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'State not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching state:', error);
    res.status(500).json({ message: 'Error fetching state' });
  }
};

// ADD a new state entry to an order
exports.addState = async (req, res) => {
  try {
    const { Order_id, state_name, state_date } = req.body;

    if (!Order_id || !state_name) {
      return res.status(400).json({ message: 'Order_id and state_name are required' });
    }

    const [result] = await db.query(
      `INSERT INTO Order_State (Order_id, state_name, state_date) VALUES (?, ?, ?)`,
      [Order_id, state_name, state_date || new Date().toISOString().slice(0, 10)]
    );

    res.status(201).json({
      message: 'State added successfully',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Add State Error:', error);
    res.status(500).json({ message: 'Error adding state' });
  }
};

// UPDATE a state entry
exports.updateState = async (req, res) => {
  try {
    const { state_name, state_date } = req.body;

    const [result] = await db.query(
      `UPDATE Order_State SET state_name = ?, state_date = ? WHERE state_id = ?`,
      [state_name, state_date, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'State not found' });
    }

    res.json({ message: 'State updated successfully' });
  } catch (error) {
    console.error('Update State Error:', error);
    res.status(500).json({ message: 'Error updating state' });
  }
};

// DELETE a state entry
exports.deleteState = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Order_State WHERE state_id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'State not found' });
    }

    res.json({ message: 'State deleted successfully' });
  } catch (error) {
    console.error('Delete State Error:', error);
    res.status(500).json({ message: 'Error deleting state' });
  }
};