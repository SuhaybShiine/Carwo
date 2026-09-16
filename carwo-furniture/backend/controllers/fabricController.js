const db = require('../config/db');

// ========== STOCK ==========

// GET all stock
exports.getAllStock = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Fabric_Stock ORDER BY Stock_id ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE stock (manual adjust)
exports.updateStock = async (req, res) => {
  try {
    const { Available_Waar } = req.body;
    const amount = Number(Available_Waar);

    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({ message: 'Invalid waar amount' });
    }

    const [result] = await db.query(
      'UPDATE Fabric_Stock SET Available_Waar = ? WHERE Stock_id = ?',
      [amount, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== FORMULAS ==========

// GET all formulas
exports.getAllFormulas = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM Fabric_Formula
       ORDER BY Category, Item_Type, Material`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET distinct Item_Types (dropdown)
exports.getItemTypes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT Category, Item_Type
       FROM Fabric_Formula
       GROUP BY Category, Item_Type
       ORDER BY Category, Item_Type`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// CREATE formula
exports.createFormula = async (req, res) => {
  try {
    const { Category, Item_Type, Material, Waar_Per_Unit, Notes } = req.body;

    if (!Category || !Item_Type || !Material || Waar_Per_Unit === undefined) {
      return res.status(400).json({
        message: 'Category, Item_Type, Material and Waar_Per_Unit are required',
      });
    }

    const waar = Number(Waar_Per_Unit);
    if (isNaN(waar) || waar < 0) {
      return res.status(400).json({ message: 'Invalid Waar_Per_Unit' });
    }

    const [result] = await db.query(
      `INSERT INTO Fabric_Formula
       (Category, Item_Type, Material, Waar_Per_Unit, Notes)
       VALUES (?, ?, ?, ?, ?)`,
      [Category, Item_Type, Material, waar, Notes || null]
    );

    res.status(201).json({
      message: 'Formula created successfully',
      id: result.insertId,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'This Item_Type + Material already exists',
      });
    }
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE formula
exports.updateFormula = async (req, res) => {
  try {
    const { Category, Item_Type, Material, Waar_Per_Unit, Notes } = req.body;
    const waar = Number(Waar_Per_Unit);

    if (isNaN(waar) || waar < 0) {
      return res.status(400).json({ message: 'Invalid Waar_Per_Unit' });
    }

    const [result] = await db.query(
      `UPDATE Fabric_Formula SET
        Category = ?, Item_Type = ?, Material = ?,
        Waar_Per_Unit = ?, Notes = ?
       WHERE Formula_id = ?`,
      [Category, Item_Type, Material, waar, Notes || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Formula not found' });
    }

    res.json({ message: 'Formula updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE formula
exports.deleteFormula = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM Fabric_Formula WHERE Formula_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Formula not found' });
    }

    res.json({ message: 'Formula deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ========== CALCULATE (muhiim — OrderAdd isticmaali doonaa) ==========
// Body: { Item_Type: 'Fadhi taaga', quantity: 2 }
exports.calculateWaar = async (req, res) => {
  try {
    const { Item_Type, quantity } = req.body;
    const qty = parseInt(quantity, 10) || 0;

    if (!Item_Type) {
      return res.status(400).json({ message: 'Item_Type is required' });
    }
    if (qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    const [formulas] = await db.query(
      `SELECT f.*, s.Available_Waar, s.Material_So
       FROM Fabric_Formula f
       LEFT JOIN Fabric_Stock s ON s.Material = f.Material
       WHERE f.Item_Type = ?`,
      [Item_Type]
    );

    if (formulas.length === 0) {
      return res.status(404).json({
        message: `No formula found for "${Item_Type}"`,
      });
    }

    const lines = formulas.map((f) => {
      const needed = Number(f.Waar_Per_Unit) * qty;
      const available = Number(f.Available_Waar) || 0;
      return {
        Material: f.Material,
        Material_So: f.Material_So || f.Material,
        Waar_Per_Unit: Number(f.Waar_Per_Unit),
        Quantity: qty,
        Needed: Number(needed.toFixed(2)),
        Available: available,
        Enough: available >= needed,
      };
    });

    const allEnough = lines.every((l) => l.Enough);
    const totalNeeded = lines.reduce((sum, l) => sum + l.Needed, 0);

    res.json({
      Item_Type,
      Quantity: qty,
      lines,
      totalNeeded: Number(totalNeeded.toFixed(2)),
      allEnough,
      message: allEnough
        ? 'Stock is enough'
        : 'Some materials do not have enough stock',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};