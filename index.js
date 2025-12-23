// ✅ บังคับให้ใช้ .env.local
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const { swaggerUi, specs } = require("./swagger");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// Routes
// ==========================
app.use('/api/users', require('./routes/users'));      // Register / Login / Logout
app.use('/api/products', require('./routes/products'));

// ==========================
// Swagger
// ==========================
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    swaggerOptions: {
      supportedSubmitMethods: ["get", "post", "put", "delete"]
    }
  })
);

// JWT Secret (optional check)
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  console.warn('⚠️ JWT_SECRET is not defined in .env.local');
}

// === Export app สำหรับ test ===
module.exports = app;

// === Start server ===
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🗄️ DB_NAME = ${process.env.DB_NAME}`);
  });
}
