// ==========================
// 1. Load Environment Variables
// ==========================
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const app = express();

// ==========================
// 2. Swagger Configuration
// ==========================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API Documentation',
      version: '1.0.0',
      description: 'คู่มือการใช้งาน API: Login -> Copy Token -> กด Authorize (วางเฉพาะรหัส)',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local Development Server',
      },
      // เพิ่ม URL ของ Vercel หรือ Production Server ตรงนี้ได้
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
  },
  // ระบุ Path เพื่อดึง Comment จากทุกไฟล์ในโฟลเดอร์ routes มาแสดงผล
  apis: [
    path.join(__dirname, './index.js'),
    path.join(__dirname, './routes/*.js'),
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ==========================
// 3. Middleware & Security (CSP Fix)
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * แก้ปัญหา Content Security Policy (CSP) เพื่อให้ Swagger UI โหลดได้บน Vercel/Production
 * ช่วยแก้ปัญหา Error "SwaggerUIBundle is not defined"
 */
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://unpkg.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; " +
    "img-src 'self' data: validator.swagger.io; " +
    "connect-src 'self' *;" // อนุญาตให้เชื่อมต่อ API
  );
  next();
});

// ==========================
// 4. Routes
// ==========================

// หน้าแสดงเอกสาร API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true, // ทำให้ Token ไม่หายเมื่อ Refresh หน้าเว็บ
  }
}));

// เชื่อมต่อ API Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    documentation: '/api-docs' 
  });
});

// ==========================
// 5. Start Server
// ==========================
const PORT = process.env.PORT || 3000;

// รองรับการ Export สำหรับ Vercel
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📄 API Docs available at http://localhost:${PORT}/api-docs`);
  });
}