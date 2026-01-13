const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const verifyToken = require('../middleware/auth');

/* =========================
   PING DB
========================= */
router.get('/ping', async (req, res) => {
  const [rows] = await db.query('SELECT NOW() AS now');
  res.json({ status: 'ok', time: rows[0].now });
});

/* =========================
   REGISTER + GET ALL USERS
========================= */
/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Register new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               firstname:
 *                 type: string
 *               fullname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Username or password missing
 *       409:
 *         description: Username already exists
 *       500:
 *         description: Internal server error
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const { firstname, fullname, lastname, username, password, status } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const [exists] = await db.query(
      'SELECT id FROM tbl_users WHERE username=?',
      [username]
    );

    if (exists.length) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO tbl_users
       (firstname, fullname, lastname, username, password, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [firstname, fullname, lastname, username, hash, status || 'user']
    );

    res.status(201).json({
      message: 'User created',
      id: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: 'Register failed' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, firstname, fullname, lastname, username, status FROM tbl_users'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* =========================
   LOGIN
========================= */
/**
 * @openapi
 * /api/users/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid username or password
 *       500:
 *         description: Internal server error
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM tbl_users WHERE username=?',
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, status: user.status },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login success', token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message});
  }
});

/* =========================
   LOGOUT
========================= */
/**
 * @openapi
 * /api/users/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logout success (please delete token on client)' });
});

/* =========================
   PROFILE
========================= */
/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', verifyToken, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, firstname, fullname, lastname, username, status FROM tbl_users WHERE id=?',
    [req.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(rows[0]);
});

/* =========================
   UPDATE + DELETE USER
========================= */
/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */


/* =========================
   GET SINGLE USER (เพิ่มส่วนนี้เข้าไป)
========================= */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      'SELECT id, firstname, fullname, lastname, username, status FROM tbl_users WHERE id=?',
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { firstname, fullname, lastname, username, password, status } = req.body;

  const [exists] = await db.query(
    'SELECT id FROM tbl_users WHERE username=? AND id!=?',
    [username, id]
  );

  if (exists.length) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  let sql = `
    UPDATE tbl_users
    SET firstname=?, fullname=?, lastname=?, username=?, status=?
  `;
  const params = [firstname, fullname, lastname, username, status];

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    sql += ', password=?';
    params.push(hash);
  }

  sql += ' WHERE id=?';
  params.push(id);

  const [result] = await db.query(sql, params);

  if (!result.affectedRows) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ message: 'User updated' });
});

router.delete('/:id', verifyToken, async (req, res) => {
  const [result] = await db.query(
    'DELETE FROM tbl_users WHERE id=?',
    [req.params.id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ message: 'User deleted' });
});

module.exports = router;
