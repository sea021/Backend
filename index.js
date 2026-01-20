if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env' });
}

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger'); // ดึง specs มาจาก swagger.js
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Middleware CSP (แก้ปัญหาจอขาว) ---
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com; " +
    "img-src 'self' data: validator.swagger.io; " +
    // ✅ เพิ่มตรงนี้: อนุญาตให้ connect ไปที่ domain ของตัวเองและทั้งหมด
    "connect-src 'self' https://*.vercel.app *;" 
  );
  next();
});

// --- Swagger UI Setup (ประกาศตัวแปรที่นี่ที่เดียว) ---
const uiOptions = { // เปลี่ยนชื่อเป็น uiOptions เพื่อเลี่ยงการซ้ำซ้อน
  swaggerOptions: {
    persistAuthorization: true,
  },
  customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js"
  ]
};



app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, uiOptions));

// --- Routes ---
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => {
  res.json({ status: 'Server is running', documentation: '/api-docs' });
});

const PORT = process.env.PORT || 3000;
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/api-docs`);
  });
}