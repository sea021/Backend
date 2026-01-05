const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const serverUrl = process.env.VERCEL_URL
  ? `https://backend-mauve-iota-64.vercel.app/`
  : `http://localhost:${process.env.PORT || 3000}`;

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
        description: process.env.VERCEL_URL ? 'Vercel Server' : 'Local Server',
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
  // ใช้ process.cwd() เพื่อความแม่นยำบน Vercel
  apis: [path.join(process.cwd(), './routes/*.js')],
};

// ส่งเฉพาะ specs ออกไป
module.exports = swaggerJsdoc(options);
