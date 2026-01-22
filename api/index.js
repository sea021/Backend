if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env' });
}

const express = require('express');
const cors = require('cors');
const path = require('path'); // เพิ่มเพื่อจัดการ path ให้แม่นยำ
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger'); // ✅ ดึงจาก api/swagger.js
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Middleware CSP (แก้ปัญหาหน้าจอขาวบน Vercel) ---
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com; " +
    "img-src 'self' data: validator.swagger.io; " +
    "connect-src 'self' https://*.vercel.app *;" 
  );
  next();
});

// --- Swagger UI Setup ---
const uiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"
  ]
};

// จัดการเส้นทางสำหรับ API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, uiOptions));

// --- Routes ---
// ✅ ปรับเป็น path.join(process.cwd()) เพื่อให้หาโฟลเดอร์ routes ที่อยู่นอกสุดเจอ
app.use('/api/users', require(path.join(process.cwd(), 'routes', 'users')));

app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    documentation: '/api-docs',
    environment: process.env.NODE_ENV 
  });
});

// สำหรับการรันบน Serverless Environment (Vercel)
const PORT = process.env.PORT || 5000;
module.exports = app;

// สำหรับการรันแบบ Local (npm start / node api/index.js)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/api-docs`);
  });
}