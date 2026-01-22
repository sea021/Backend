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
 *               email:
 *                 type: string
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
  // ⚠️ เพิ่ม email เข้ามาใน destruct process
  const { firstname, fullname, lastname, username, password, status, email } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const userStatus = (status && status.trim() !== "") ? status : 'user';

    const [exists] = await db.query(
      'SELECT id FROM tbl_users WHERE username=?',
      [username]
    );

    if (exists.length) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    // ⚠️ ตรวจสอบว่าใน Database ของคุณมี column 'email' หรือยัง ถ้าไม่มีต้องไปสร้างก่อนนะครับ
      const [result] = await db.query(
          `INSERT INTO tbl_users 
          (firstname, fullname, lastname, email, username, password, status, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            firstname, 
            fullname, 
            lastname, 
            email || null, 
            username, 
            hash, 
            userStatus // ✅ ใช้ตัวแปรที่เราดักค่าไว้ตรงนี้
          ]
        );

    res.status(201).json({ message: 'User created', id: result.insertId });

  } catch (err) {
    console.error(err); // แนะนำให้ log error เพื่อดูสาเหตุเวลาพัง
    res.status(500).json({ error: 'Register failed', details: err.message });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, firstname, fullname, lastname, username, status, email FROM tbl_users'
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
   FORGOT PASSWORD (NEW SECTIONS) ✅ เพิ่มใหม่ตรงนี้
========================= */
/**
 * @swagger
 * /api/users/check-email:
 *   post:
 *     summary: ตรวจสอบว่าอีเมลมีอยู่ในระบบหรือไม่
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: พบอีเมลในระบบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 found:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Email found
 *       404:
 *         description: ไม่พบอีเมลในระบบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 found:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: ไม่พบอีเมลนี้ในระบบ
 *       500:
 *         description: Database error
 */
// 1. ตรวจสอบว่ามีอีเมลนี้ในระบบหรือไม่
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  try {
    // ⚠️ ต้องมั่นใจว่า Database มี column ชื่อ 'email'
    const [rows] = await db.query('SELECT id FROM tbl_users WHERE email = ?', [email]);
    
    if (rows.length > 0) {
      return res.status(200).json({ found: true, message: 'Email found' });
    } else {
      return res.status(404).json({ found: false, error: 'ไม่พบอีเมลนี้ในระบบ' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});


/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: เปลี่ยนรหัสผ่านใหม่โดยใช้อีเมล (Direct Reset)
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               newPassword:
 *                 type: string
 *                 example: newStrongPassword123
 *     responses:
 *       200:
 *         description: เปลี่ยนรหัสผ่านสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: เปลี่ยนรหัสผ่านสำเร็จ
 *       400:
 *         description: ส่งข้อมูลไม่ครบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email and new password required
 *       404:
 *         description: ไม่พบผู้ใช้งาน
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ไม่พบผู้ใช้งานหรืออีเมลไม่ถูกต้อง
 *       500:
 *         description: Update failed
 */
// 2. เปลี่ยนรหัสผ่านใหม่ทันที (Direct Reset)
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password required' });
  }

  try {
    // Hash รหัสผ่านใหม่
    const hash = await bcrypt.hash(newPassword, 10);

    // อัปเดตลง Database
    const [result] = await db.query(
      'UPDATE tbl_users SET password = ? WHERE email = ?', 
      [hash, email]
    );

    if (result.affectedRows === 0) {
       return res.status(404).json({ error: 'ไม่พบผู้ใช้งานหรืออีเมลไม่ถูกต้อง' });
    }

    return res.status(200).json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Update failed', details: err.message });
  }
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


/* =========================
   GET USERS (รวมทั้ง ดึงทั้งหมด และ ดึงคนเดียว)
   👉 แก้ไข: รวม logic ไว้ใน route '/' ตัวเดียว แล้วเช็ค req.query.id เอา
========================= */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { id } = req.query; // รับค่า ?id=... จาก URL

    // 1. กรณีมี ID ส่งมา (เช่น ?id=5) -> ดึงแค่คนเดียว
    if (id) {
        const [rows] = await db.query(
            'SELECT id, firstname, fullname, lastname, username, status, email FROM tbl_users WHERE id=?',
            [id]
        );
        if (!rows.length) return res.status(404).json({ error: 'User not found' });
        return res.json(rows[0]);
    }

    // 2. กรณีไม่มี ID (ดึงทั้งหมด)
    const [rows] = await db.query(
      'SELECT id, firstname, fullname, lastname, username, status, email FROM tbl_users'
    );
    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* =========================
   UPDATE USER
   👉 แก้ไข: เปลี่ยนจาก '/:id' เป็น '/' และรับ id จาก query หรือ body
========================= */
router.put('/', verifyToken, async (req, res) => {
  // รับ ID
  const id = req.query.id || req.body.id; 
  
  if (!id) return res.status(400).json({ error: 'User ID is required' });

  const { firstname, fullname, lastname, username, password, status } = req.body;

  try {
      // เช็ค Username ซ้ำ (ต้องไม่ซ้ำกับคนอื่น ยกเว้นตัวเอง)
      const [exists] = await db.query(
        'SELECT id FROM tbl_users WHERE username=? AND id!=?',
        [username, id]
      );
      if (exists.length) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      let sql = 'UPDATE tbl_users SET firstname=?, fullname=?, lastname=?, username=?, status=?';
      const params = [firstname, fullname, lastname, username, status];

      if (password && password.trim() !== "") {
        const hash = await bcrypt.hash(password, 10);
        sql += ', password=?';
        params.push(hash);
      }

      sql += ' WHERE id=?';
      params.push(id);

      const [result] = await db.query(sql, params);

      if (!result.affectedRows) {
        return res.status(404).json({ error: 'User not found or no changes made' });
      }

      res.json({ message: 'User updated successfully' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

/* =========================
   DELETE USER
   👉 แก้ไข: เปลี่ยนจาก '/:id' เป็น '/' และรับ id จาก query
========================= */
router.delete('/', verifyToken, async (req, res) => {
  const id = req.query.id || req.body.id;

  if (!id) return res.status(400).json({ error: 'User ID is required' });

  try {
      const [result] = await db.query('DELETE FROM tbl_users WHERE id=?', [id]);
      if (!result.affectedRows) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'User deleted successfully' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;