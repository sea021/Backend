const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const serverUrl =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BackEnd API",
      version: "1.0.0",
      description: "API documentation"
    },
    servers: [
      {
        url: serverUrl,
        description: process.env.VERCEL_URL
          ? "Vercel server"
          : "Local server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: [path.join(__dirname, "/routes/*.js")]
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
