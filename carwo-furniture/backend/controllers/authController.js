const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'carwo_furniture_secret_key_2026';

// ============================================================
// ADMIN SECRET CODE — BEDDEL
// ============================================================
const ADMIN_SECRET_CODE = 'CARWO2026';

// ============================================================
// REGISTER
// ============================================================
exports.register = async (req, res) => {
  try {
    const { Username, Email, Password, Role, Full_Name, Admin_Code } = req.body;

    if (!Username || !Password) {
      return res.status(400).json({ message: 'Username and Password are required' });
    }
    if (Password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const role = String(Role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user';

    // Hubi Admin Code haddii Role === 'admin'
    if (role === 'admin') {
      if (!Admin_Code || String(Admin_Code).trim() !== ADMIN_SECRET_CODE) {
        return res.status(400).json({ message: 'Admin Code-ka waa khalad!' });
      }
    }

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

// ============================================================
// LOGIN
// ============================================================
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

// ============================================================
// 1. FORGOT PASSWORD — OFFLINE MODE (KALIYA ADMIN)
// ============================================================
exports.forgotPassword = async (req, res) => {
  try {
    const { Email } = req.body;

    if (!Email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [rows] = await db.query(
      'SELECT * FROM Users WHERE Email = ?',
      [Email.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Email-kan lama helin. Fadlan hubi email-kaaga.',
      });
    }

    const user = rows[0];

    // ============================================================
    // ⭐ CHECK: KALIYA ADMIN AYAA SAMEYN KARA FORGOT PASSWORD
    // ============================================================
    if (user.Role !== 'admin') {
      return res.status(403).json({
        message:
          'Forgot Password kaliya Admin ayaa isticmaali kara. Fadlan la xiriir maamulka (Admin) si uu password-kaaga kuu beddelo.',
      });
    }

    // Abuur 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 daqiiqo

    await db.query(
      'UPDATE Users SET Reset_Code = ?, Reset_Code_Expire = ? WHERE User_id = ?',
      [hashedCode, expireAt, user.User_id]
    );

    // Soo bandhig console-ka (offline mode)
    await sendEmail({
      to: user.Email,
      subject: 'Verification Code — Carwo Furniture',
      html: '',
      code: code,
    });

    // ⭐ OFFLINE: Code-ka sidoo kale wuxuu u soo celinayaa FRONTEND-KA
    res.json({
      message: 'Code-ka xaqiijinta waa la abuuray.',
      code: code, // ⚠️ OFFLINE MODE
      offline: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 2. VERIFY CODE — hubi 6-digit code
// ============================================================
exports.verifyCode = async (req, res) => {
  try {
    const { Email, Code } = req.body;

    if (!Email || !Code) {
      return res.status(400).json({ message: 'Email iyo Code waa qasab' });
    }

    const [rows] = await db.query(
      `SELECT * FROM Users 
       WHERE Email = ? 
         AND Reset_Code IS NOT NULL 
         AND Reset_Code_Expire > NOW()`,
      [Email.trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        message: 'Code-ku waa uu dhacay ama lama helin. Codso mid cusub.',
      });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(String(Code).trim(), user.Reset_Code);

    if (!ok) {
      return res.status(400).json({ message: 'Code-ka aad gelisay waa khalad.' });
    }

    // Abuur reset token (JWT, 15 daqiiqo)
    const resetToken = jwt.sign(
      { User_id: user.User_id, purpose: 'reset_password' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      message: 'Code-ka waa sax. Hadda geli password cusub.',
      resetToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// 3. RESET PASSWORD — hubi resetToken, beddel password
// ============================================================
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Token iyo password waa qasab' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password waa in uu 6 xaraf ka badan yahay' });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Link-ka waa uu dhacay. Codso mid cusub.' });
    }

    if (payload.purpose !== 'reset_password') {
      return res.status(400).json({ message: 'Token-ka waa khalad' });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE Users 
       SET Password = ?, Reset_Code = NULL, Reset_Code_Expire = NULL 
       WHERE User_id = ?`,
      [hash, payload.User_id]
    );

    res.json({ message: 'Password-kaaga waa la beddelay. Fadlan gal.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================================
// ME — xogta user-ka hadda
// ============================================================
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

// ============================================================
// GET ALL USERS (Admin)
// ============================================================
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

// ============================================================
// ADMIN — beddel password user kale
// ============================================================
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

// ============================================================
// USER — beddel password-kaaga
// ============================================================
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

// ============================================================
// DELETE USER (Admin)
// ============================================================
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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};