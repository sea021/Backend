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
  // ดึงเฉพาะไฟล์ใน routes มาแสดงผล เพื่อลดโอกาสเกิด Error คีย์ซ้ำจาก index.js
  apis: [path.join(__dirname, './routes/*.js')],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ==========================
// 3. Middleware & Security (CSP Fix)
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * แก้ปัญหา Content Security Policy (CSP) 
 * ต้องวางไว้ก่อน app.use('/api-docs') เสมอ
 */
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://unpkg.com; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com; " +
    "img-src 'self' data: validator.swagger.io; " +
    "connect-src 'self' *;"
  );
  next();
});

// ==========================
// 4. Routes & Swagger UI Fix
// ==========================

// ใช้ CDN สำหรับ CSS และ JS ของ Swagger UI เพื่อป้องกันไฟล์ในเครื่องโหลดไม่ขึ้นบน Hosting/Vercel
const swaggerUiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
  // ลบ customCssUrl และ customJs ออกไปก่อนเพื่อทดสอบแบบมาตรฐาน
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// เชื่อมต่อ API Routes
app.use('/api/users', require('./routes/users'));
// app.use('/api/products', require('./routes/products'));

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

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📄 API Docs available at http://localhost:${PORT}/api-docs`);
  });
}