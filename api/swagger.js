const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// กำหนด Base URL ตามสภาพแวดล้อมที่รัน
const serverUrl = process.env.NODE_ENV === 'production'
  ? `https://backend-mauve-iota-64.vercel.app/`
  : `http://localhost:${process.env.PORT || 5000}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BackEnd API',
      version: '1.0.0',
      description: 'API documentation: Login -> Copy Token -> กด Authorize',
    },
    servers: [
      {
        url: serverUrl,
        description: process.env.NODE_ENV === 'production' ? 'Vercel Server' : 'Local Server',
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
    security: [{ bearerAuth: [] }],
  },
  // ✅ แก้ไข: ใช้ path.join และ process.cwd() เพื่อชี้ไปที่โฟลเดอร์ routes ที่อยู่นอกสุด
  // Vercel จะเริ่มนับจาก Root Project ทำให้หาไฟล์ .js ในโฟลเดอร์ routes เจอแน่นอน
  apis: [path.join(process.cwd(), 'routes', '*.js')],
};

// สร้างและส่งเฉพาะ specs ออกไป
const specs = swaggerJsdoc(options);
module.exports = specs;