require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// สร้าง connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// ✅ Route ทดสอบ
app.get('/ping', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT NOW() AS now');
    res.json({ status: 'ok', time: rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ✅ GET: ดึงผู้ใช้ทั้งหมด
app.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tbl_users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Query failed' });
  }
});

// ✅ GET: ดึงผู้ใช้ตาม ID
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM tbl_users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Query failed' });
  }
});


// ตัวอย่าง POST ข้อมูล
app.post('/users', async (req, res) => {
  const {firstname, fullname, lastname, username, password, status} = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO tbl_users (firstname, fullname, lastname, username, password, status) VALUES (?, ?, ?, ?, ?, ?)',
        [firstname, fullname, lastname, username, password, status]
    );
    res.json({
      id: result.insertId,
      firstname,
      fullname,
      lastname,
      username,
      password,
      status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Insert failed' });
  }
});

// ✅ PUT: อัปเดตผู้ใช้ตาม ID
app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { firstname, fullname, lastname, username, password, status } = req.body;

  try {
    // ตรวจสอบก่อนว่าผู้ใช้มีอยู่จริง
    const [existing] = await db.query('SELECT * FROM tbl_users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // อัปเดตข้อมูล
    const [result] = await db.query(
      'UPDATE tbl_users SET firstname = ?, fullname = ?, lastname = ?, username = ?, password = ?, status = ? WHERE id = ?',
      [firstname, fullname, lastname, username, password, status, id]
    );

    res.json({
      message: 'User updated successfully',
      id: id,
      firstname,
      fullname,
      lastname,
      username,
      password,
      status
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});



// ✅ DELETE: ลบผู้ใช้ตาม ID
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM tbl_users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});


// ✅ เริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
