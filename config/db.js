const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,          // ✅ เพิ่ม port
  user: process.env.DB_USER,
  password: process.env.DB_PASS,      // ✅ แก้ชื่อตัวแปร
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = db;
