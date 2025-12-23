const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/auth');

// ==========================
// Admin middleware (optional)
// ==========================
function isAdmin(req, res, next) {
  if (req.user.status !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

// ==========================
// GET all products
// GET /api/products
// ==========================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tbl_products');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Query failed' });
  }
});

// ==========================
// GET product by id
// GET /api/products/:id
// ==========================
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM tbl_products WHERE id=?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Query failed' });
  }
});

// ==========================
// CREATE product (admin only)
// POST /api/products
// ==========================
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { name, description, price, stock } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO tbl_products (name, description, price, stock) VALUES (?,?,?,?)',
      [name, description, price, stock]
    );
    res.status(201).json({ message: 'Product created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Insert failed' });
  }
});

// ==========================
// UPDATE product (admin only)
// PUT /api/products/:id
// ==========================
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE tbl_products SET name=?, description=?, price=?, stock=? WHERE id=?',
      [name, description, price, stock, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ==========================
// DELETE product (admin only)
// DELETE /api/products/:id
// ==========================
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM tbl_products WHERE id=?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
