const db = require('../config/db');

// GET all products (with supplier name and P_total)
exports.getAllProducts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.*, 
        s.Sup_Name,
        (p.P_quantity * p.P_price) AS P_total
      FROM Product p
      LEFT JOIN Supplier s ON p.Sup_id = s.Sup_id
      ORDER BY p.P_id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// GET one product (with supplier name and P_total)
exports.getProductById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        p.*, 
        s.Sup_Name,
        (p.P_quantity * p.P_price) AS P_total
       FROM Product p
       LEFT JOIN Supplier s ON p.Sup_id = s.Sup_id
       WHERE p.P_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
};

// CREATE product (P_total waa la xisaabiyaa)
exports.createProduct = async (req, res) => {
  try {
    const { P_item, P_quantity, P_price, Sup_id } = req.body;

    // Hubi in P_item aanu ahayn number oo kaliya ah
    if (P_item && /^[0-9\s]+$/.test(P_item)) {
      return res.status(400).json({ message: 'Product name cannot be numbers only' });
    }

    // Hubi in product-ku uusan horeba u jirin (case-insensitive)
    if (P_item) {
      const [existing] = await db.query('SELECT P_id FROM Product WHERE LOWER(P_item) = LOWER(?)', [P_item.trim()]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'A product with this name already exists' });
      }
    }

    const quantity = P_quantity ? parseInt(P_quantity) : 0;
    const price = P_price ? parseFloat(P_price) : 0;

    if (!Number.isInteger(Number(P_quantity))) {
      return res.status(400).json({ message: 'Quantity must be a whole number' });
    }
    if (price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const total = quantity * price;
    const supplierId = Sup_id && Sup_id !== '' ? parseInt(Sup_id) : null;

    const [result] = await db.query(
      `INSERT INTO Product (P_item, P_quantity, P_price, P_total, Sup_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [P_item || null, quantity, price, total, supplierId]
    );

    res.status(201).json({
      message: 'Product created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
};

// UPDATE product (P_total waa la xisaabiyaa mar kale)
exports.updateProduct = async (req, res) => {
  try {
    const { P_item, P_quantity, P_price, Sup_id } = req.body;

    if (P_item && /^[0-9\s]+$/.test(P_item)) {
      return res.status(400).json({ message: 'Product name cannot be numbers only' });
    }

    if (P_item) {
      const [existing] = await db.query(
        'SELECT P_id FROM Product WHERE LOWER(P_item) = LOWER(?) AND P_id != ?',
        [P_item.trim(), req.params.id]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: 'A product with this name already exists' });
      }
    }

    const quantity = P_quantity ? parseInt(P_quantity) : 0;
    const price = P_price ? parseFloat(P_price) : 0;

    if (!Number.isInteger(Number(P_quantity))) {
      return res.status(400).json({ message: 'Quantity must be a whole number' });
    }
    if (price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const total = quantity * price;
    const supplierId = Sup_id && Sup_id !== '' ? parseInt(Sup_id) : null;

    const [result] = await db.query(
      `UPDATE Product SET 
       P_item = ?, 
       P_quantity = ?, 
       P_price = ?, 
       P_total = ?, 
       Sup_id = ? 
       WHERE P_id = ?`,
      [P_item || null, quantity, price, total, supplierId, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

// DELETE product (isku mid)
exports.deleteProduct = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM Product WHERE P_id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};