require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('./middleware/auth');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createPool({
  host: process.env.DB_HOST,
   port: process.env.DB_PORT, //เพิ่ม port
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const SECRET_KEY = process.env.JWT_SECRET;

// ✅ Test route
app.get('/ping', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() AS now');
    res.json({ status: 'ok', time: rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ✅ Public route: Signup
app.post('/users', async (req, res) => {
  const { firstname, fullname, lastname, username, password, status } = req.body;
  try {
    if (!password) return res.status(400).json({ error: 'Password is required' });
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO tbl_users (firstname, fullname, lastname, username, password, status) VALUES (?, ?, ?, ?, ?, ?)',
      [firstname, fullname, lastname, username, hashedPassword, status || 'user']
    );

    res.json({
      message: 'User created successfully',
      id: result.insertId,
      firstname,
      fullname,
      lastname,
      username,
      status: status || 'user',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Insert failed' });
  }
});

// ✅ Public route: Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM tbl_users WHERE username = ?', [username]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid username or password' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid username or password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, status: user.status },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        status: user.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ✅ Protected route: Profile
app.get('/profile', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, fullname, username, status FROM tbl_users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Cannot fetch profile' });
  }
});

// ✅ Protected route: Get all users
app.get('/users', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, firstname, fullname, lastname, username, status FROM tbl_users'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Query failed' });
  }
});

// ✅ Protected route: Get user by ID
app.get('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id, firstname, fullname, lastname, username, status FROM tbl_users WHERE id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Query failed' });
  }
});

// ✅ Protected route: Update user
app.put('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { firstname, fullname, lastname, username, password, status } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM tbl_users WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'User not found' });

    let query = 'UPDATE tbl_users SET firstname = ?, fullname = ?, lastname = ?, username = ?, status = ?';
    const params = [firstname, fullname, lastname, username, status];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ✅ Protected route: Delete user
app.delete('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM tbl_users WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
