const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// ==========================
// Server URL (รองรับ Local + Vercel)
// ==========================
const serverUrl =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

// ==========================
// Swagger options
// ==========================
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BackEnd API',
      version: '1.0.0',
      description: 'API documentation',
    },

    // ✅ สำคัญ: ทำให้ Try it out ยิงไปโดเมนถูก
    servers: [
      {
        url: serverUrl,
        description: process.env.VERCEL_URL
          ? 'Vercel server'
          : 'Local server',
      },
    ],

    // ==========================
    // JWT Auth
    // ==========================
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },

    // ✅ ทำให้ปุ่ม Authorize ใช้ได้ทั้งระบบ
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  // ==========================
  // Path ของไฟล์ route
  // ==========================
  apis: [path.join(__dirname, '/routes/*.js')],
};

// ==========================
// Build specs
// ==========================
const specs = swaggerJsdoc(options);

// ==========================
// Export
// ==========================

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    // เพิ่ม 'unsafe-inline' และตรวจดูว่าอนุญาต CDN ครบถ้วน
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://unpkg.com; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com; " +
    "img-src 'self' data: validator.swagger.io; " +
    "connect-src 'self' *;"
  );
  next();
});

module.exports = {
  swaggerUi,
  specs,
};
