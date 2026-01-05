const swaggerJsdoc = require('swagger-jsdoc');

// ==========================
// Server URL (Local + Vercel)
// ==========================
const serverUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BackEnd API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      {
        url: serverUrl,
        description: process.env.VERCEL_URL
          ? 'Vercel server'
          : 'Local server',
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

  // 🔥 สำคัญมาก
  apis: ['./**/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { specs };
