// ==========================
// Load ENV (local เท่านั้น)
// ==========================
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path'); // เพิ่ม path เพื่อความแม่นยำในการดึงไฟล์

const app = express();

// ==========================
// Swagger Configuration
// ==========================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API Documentation',
      version: '1.0.0',
      description: 'เอกสารประกอบ API (Login -> Copy Token -> กดปุ่ม Authorize บนขวา)',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local Server'
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    // กำหนดให้ทุก API ที่ไม่ได้ระบุ security เป็นอย่างอื่น ต้องใช้ Bearer Auth เป็นค่าเริ่มต้น (เลือกได้)
    // security: [{ bearerAuth: [] }], 
  },
  // ใช้ path.join เพื่อให้ระบบหาไฟล์ route เจอแน่นอนไม่ว่าจะรันจากโฟลเดอร์ไหน
  apis: [
    path.join(__dirname, './index.js'),
    path.join(__dirname, './routes/*.js')
  ], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ==========================
// Middleware & CSP Fix
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// แก้ปัญหาหน้าขาว/บล็อกสคริปต์ (CSP)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: validator.swagger.io;"
  );
  next();
});

// ==========================
// Routes
// ==========================

// 1. Route สำหรับ Swagger (ย้ายมาไว้ก่อน route อื่นๆ)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true, // ช่วยให้ Token ไม่หายเวลา Refresh หน้าเว็บ
  }
}));

// 2. เชื่อมต่อ Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));

// Root Path
app.get('/', (req, res) => {
  res.json({ status: 'OK', swagger: '/api-docs' });
});

// ==========================
// Export & Server Start
// ==========================
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`📄 Docs: http://localhost:${PORT}/api-docs`);
  });
}