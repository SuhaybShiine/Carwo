const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'carwo_furniture_secret_key_2026';

// REGISTER (public) — Username, Email, Password, Account Type
exports.register = async (req, res) => {
  try {
    const { Username, Email, Password, Role, Full_Name } = req.body;

    if (!Username || !Password) {
      return res.status(400).json({ message: 'Username and Password are required' });
    }
    if (Password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const role = String(Role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user';
    const hash = await bcrypt.hash(Password, 10);

    const [result] = await db.query(
      `INSERT INTO Users (Username, Email, Password, Full_Name, Role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        Username.trim(),
        Email ? Email.trim() : null,
        hash,
        Full_Name || Username.trim(),
        role,
      ]
    );

    res.status(201).json({
      message: 'Registered successfully. Please login.',
      id: result.insertId,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username already exists' });
    }
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// LOGIN — Username + Password
exports.login = async (req, res) => {
  try {
    const { Username, Password } = req.body;

    if (!Username || !Password) {
      return res.status(400).json({ message: 'Username and Password are required' });
    }

    const [rows] = await db.query(
      'SELECT * FROM Users WHERE Username = ?',
      [Username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(Password, user.Password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        User_id: user.User_id,
        Username: user.Username,
        Role: user.Role,
        Full_Name: user.Full_Name,
        Email: user.Email,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        User_id: user.User_id,
        Username: user.Username,
        Email: user.Email,
        Full_Name: user.Full_Name,
        Role: user.Role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT User_id, Username, Email, Full_Name, Role, Created_At
       FROM Users WHERE User_id = ?`,
      [req.user.User_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT User_id, Username, Email, Full_Name, Role, Created_At
       FROM Users ORDER BY User_id DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: reset / change any user password
exports.adminSetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    const [result] = await db.query(
      'UPDATE Users SET Password = ? WHERE User_id = ?',
      [hash, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User/Admin: change own password
exports.changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const [rows] = await db.query('SELECT * FROM Users WHERE User_id = ?', [
      req.user.User_id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ok = await bcrypt.compare(currentPassword, rows[0].Password);
    if (!ok) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE Users SET Password = ? WHERE User_id = ?', [
      hash,
      req.user.User_id,
    ]);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.user.User_id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    const [result] = await db.query('DELETE FROM Users WHERE User_id = ?', [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};