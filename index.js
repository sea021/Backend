// ==========================
// Load ENV (local เท่านั้น)
// ==========================
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

const express = require('express');
const cors = require('cors');
const { swaggerUi, specs } = require('./swagger');

const app = express();

// ==========================
// Middleware (สำคัญมาก)
// ==========================

// ✅ CORS (แก้ Failed to fetch / preflight error)
app.use(
  cors({
    origin: true, // อนุญาตทุก origin (Swagger อยู่คนละโดเมน)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// Routes
// ==========================
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));

// ==========================
// Swagger (ใช้แค่อันเดียว ❗)
// ==========================
const CSS_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css';

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customCssUrl: CSS_URL,
  })
);

// ==========================
// Root route (กัน Cannot GET /)
// ==========================
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend API is running',
    docs: '/api-docs',
  });
});

// ==========================
// JWT Secret check
// ==========================
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET is not defined');
}

// ==========================
// Export app (สำคัญมากสำหรับ Vercel)
// ==========================
module.exports = app;

// ==========================
// Start server (Local เท่านั้น)
// ==========================
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
