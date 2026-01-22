const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const verifyToken = require('../middleware/auth');

/* =========================
    1. DATABASE PING
   ========================= */
router.get('/ping', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT NOW() AS now');
        res.json({ status: 'ok', time: rows[0].now });
    } catch (err) {
        res.status(500).json({ error: 'Database connection failed' });
    }
});

/* =========================
    2. USERS MANAGEMENT (GET / POST)
   ========================= */

/**
 * @openapi
 * /api/users:
 * get:
 * tags: [Users]
 * summary: Get all users or single user by query ?id=
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: id
 * schema:
 * type: integer
 * description: User ID (Optional)
 * post:
 * tags: [Users]
 * summary: Register new user
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { id } = req.query; // ✅ แก้ไข: รับ ID จาก Query Parameter (?id=...)
        
        if (id) {
            const [rows] = await db.query(
                'SELECT id, firstname, fullname, lastname, username, status, email FROM tbl_users WHERE id=?',
                [id]
            );
            if (!rows.length) return res.status(404).json({ error: 'User not found' });
            return res.json(rows[0]);
        }

        const [rows] = await db.query(
            'SELECT id, firstname, fullname, lastname, username, status, email FROM tbl_users'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', async (req, res) => {
    const { firstname, fullname, lastname, username, password, status, email } = req.body;
    try {
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const [exists] = await db.query('SELECT id FROM tbl_users WHERE username=?', [username]);
        if (exists.length) return res.status(409).json({ error: 'Username already exists' });

        const hash = await bcrypt.hash(password, 10);
        const userStatus = status || 'user';

        // ✅ แก้ไข: เพิ่มคอลัมน์ email เข้าไปในการ INSERT
        const [result] = await db.query(
            `INSERT INTO tbl_users 
            (firstname, fullname, lastname, email, username, password, status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [firstname, fullname, lastname, email || null, username, hash, userStatus]
        );
        res.status(201).json({ message: 'User created', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Register failed', details: err.message });
    }
});

/* =========================
    3. AUTHENTICATION (LOGIN / LOGOUT / FORGOT)
   ========================= */

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM tbl_users WHERE username=?', [username]);
        if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username, status: user.status },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ message: 'Login success', token });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// ✅ แก้ไข: ดึงเฉพาะอีเมลมาตรวจสอบ
router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.query('SELECT id FROM tbl_users WHERE email = ?', [email]);
        if (rows.length > 0) return res.json({ found: true, message: 'Email found' });
        res.status(404).json({ found: false, error: 'ไม่พบอีเมลนี้ในระบบ' });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ✅ แก้ไข: เปลี่ยนรหัสผ่านโดยใช้อีเมลอ้างอิง
router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ error: 'Data required' });
    try {
        const hash = await bcrypt.hash(newPassword, 10);
        const [result] = await db.query('UPDATE tbl_users SET password = ? WHERE email = ?', [hash, email]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

router.post('/logout', verifyToken, (req, res) => {
    res.json({ message: 'Logout success' });
});

/* =========================
    4. PROFILE / UPDATE / DELETE
   ========================= */

router.get('/profile', verifyToken, async (req, res) => {
    const [rows] = await db.query(
        'SELECT id, firstname, fullname, lastname, username, status, email FROM tbl_users WHERE id=?',
        [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
});

router.put('/', verifyToken, async (req, res) => {
    const id = req.query.id || req.body.id; // ✅ แก้ไข: รับ ID จาก Query หรือ Body
    if (!id) return res.status(400).json({ error: 'User ID is required' });
    const { firstname, fullname, lastname, username, password, status } = req.body;

    try {
        const [exists] = await db.query('SELECT id FROM tbl_users WHERE username=? AND id!=?', [username, id]);
        if (exists.length) return res.status(409).json({ error: 'Username already exists' });

        let sql = 'UPDATE tbl_users SET firstname=?, fullname=?, lastname=?, username=?, status=?';
        const params = [firstname, fullname, lastname, username, status];

        if (password && password.trim() !== "") {
            const hash = await bcrypt.hash(password, 10);
            sql += ', password=?';
            params.push(hash);
        }
        sql += ' WHERE id=?';
        params.push(id);

        await db.query(sql, params);
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

router.delete('/', verifyToken, async (req, res) => {
    const id = req.query.id || req.body.id; // ✅ แก้ไข: รับ ID จาก Query
    if (!id) return res.status(400).json({ error: 'User ID is required' });
    try {
        const [result] = await db.query('DELETE FROM tbl_users WHERE id=?', [id]);
        if (!result.affectedRows) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

module.exports = router;