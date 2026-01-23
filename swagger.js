const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// รองรับ Local + Vercel (ไม่ fix domain)
const serverUrl = process.env.NODE_ENV === 'production'
  ? '/'  // ใช้ relative path เพื่อให้ Swagger ใช้ domain ปัจจุบันอัตโนมัติ
  : `http://localhost:${process.env.PORT || 3000}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BackEnd API',
      version: '1.0.0',
      description: 'API documentation: Login → Copy Token → กด Authorize',
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

  // ⭐ สำคัญ: routes อยู่ที่ root
  apis: [path.join(process.cwd(), 'routes', '*.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
