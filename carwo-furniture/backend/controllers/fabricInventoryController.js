const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Fabric_Inventory ORDER BY Fabric_id DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Fabric_Inventory WHERE Fabric_id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Fabric not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { Fabric_Code, Fabric_Name, Color, Available_Waar, Notes } = req.body;
    if (!Fabric_Code || !Fabric_Name || !Color) {
      return res.status(400).json({
        message: 'Fabric_Code, Fabric_Name and Color are required',
      });
    }
    const waar = Number(Available_Waar);
    if (isNaN(waar) || waar < 0) {
      return res.status(400).json({ message: 'Available_Waar must be 0 or more' });
    }
    const [result] = await db.query(
      `INSERT INTO Fabric_Inventory
       (Fabric_Code, Fabric_Name, Color, Available_Waar, Notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        String(Fabric_Code).trim(),
        String(Fabric_Name).trim(),
        String(Color).trim(),
        waar,
        Notes || null,
      ]
    );
    res.status(201).json({
      message: 'Fabric registered successfully',
      id: result.insertId,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Fabric_Code already exists' });
    }
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { Fabric_Code, Fabric_Name, Color, Available_Waar, Notes } = req.body;
    if (!Fabric_Code || !Fabric_Name || !Color) {
      return res.status(400).json({
        message: 'Fabric_Code, Fabric_Name and Color are required',
      });
    }
    const waar = Number(Available_Waar);
    if (isNaN(waar) || waar < 0) {
      return res.status(400).json({ message: 'Available_Waar must be 0 or more' });
    }
    const [result] = await db.query(
      `UPDATE Fabric_Inventory SET
        Fabric_Code = ?, Fabric_Name = ?, Color = ?,
        Available_Waar = ?, Notes = ?
       WHERE Fabric_id = ?`,
      [
        String(Fabric_Code).trim(),
        String(Fabric_Name).trim(),
        String(Color).trim(),
        waar,
        Notes || null,
        req.params.id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Fabric not found' });
    }
    res.json({ message: 'Fabric updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Fabric_Code already exists' });
    }
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM Fabric_Inventory WHERE Fabric_id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Fabric not found' });
    }
    res.json({ message: 'Fabric deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Calculate — lines KALA GOONI (Gogol vs Shabag)
exports.calculateForFabric = async (req, res) => {
  try {
    const { Item_Type, quantity, Fabric_id, Shabag_Fabric_id } = req.body;
    const qty = parseInt(quantity, 10) || 0;

    if (!Item_Type) {
      return res.status(400).json({ message: 'Item_Type is required' });
    }
    if (qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    const [formulas] = await db.query(
      'SELECT Material, Waar_Per_Unit FROM Fabric_Formula WHERE Item_Type = ?',
      [Item_Type]
    );

    if (formulas.length === 0) {
      return res.status(404).json({ message: `No formula for "${Item_Type}"` });
    }

    const lines = [];

    for (const f of formulas) {
      const mat = f.Material;
      const lineNeeded = Number((Number(f.Waar_Per_Unit) * qty).toFixed(2));
      let fabricId = null;

      // Gogol / Fadhi main
      if (mat === 'Fabric' || mat === 'Shuuliyo') {
        fabricId = Fabric_id ? Number(Fabric_id) : null;
      }
      // Shabag GOONI
      if (mat === 'Shabag') {
        fabricId = Shabag_Fabric_id ? Number(Shabag_Fabric_id) : null;
      }

      let fabricRow = null;
      if (fabricId) {
        const [rows] = await db.query(
          'SELECT * FROM Fabric_Inventory WHERE Fabric_id = ?',
          [fabricId]
        );
        fabricRow = rows[0] || null;
      }

      const available = fabricRow ? Number(fabricRow.Available_Waar) || 0 : null;

      lines.push({
        Material: mat,
        Role:
          mat === 'Shabag'
            ? 'Shabag (lagu daro gogosha)'
            : 'Gogol / Maro (main)',
        Waar_Per_Unit: Number(f.Waar_Per_Unit),
        Needed: lineNeeded,
        Fabric_id: fabricId,
        fabric: fabricRow
          ? {
              Fabric_id: fabricRow.Fabric_id,
              Fabric_Code: fabricRow.Fabric_Code,
              Fabric_Name: fabricRow.Fabric_Name,
              Color: fabricRow.Color,
              Available_Waar: available,
            }
          : null,
        Enough: fabricRow ? available >= lineNeeded : false,
        MissingFabric: !fabricId,
      });
    }

    const allEnough = lines.every((l) => !l.MissingFabric && l.Enough);

    res.json({
      Item_Type,
      Quantity: qty,
      lines,
      totalNeeded: Number(
        lines.reduce((s, l) => s + l.Needed, 0).toFixed(2)
      ),
      allEnough,
      message: allEnough
        ? 'Stock is enough (Gogol + Shabag)'
        : 'Hubi Gogol iyo Shabag si gooni ah',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};