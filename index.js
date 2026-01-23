if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env' });
}

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

// ✅ แก้ตรงนี้ (สำคัญที่สุด)
// swagger.js อยู่ระดับเดียวกับ package.json
// index.js อยู่ใน api → ต้องถอยออก 1 ชั้น
const specs = require('./swagger');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   CSP Middleware (กันจอขาว Swagger)
========================= */
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com; " +
    "img-src 'self' data: validator.swagger.io; " +
    "connect-src 'self' https://*.vercel.app *;"
  );
  next();
});

/* =========================
   Swagger UI
========================= */
const uiOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customCssUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
  ],
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, uiOptions));

/* =========================
   Routes
========================= */
app.use('/api/users', require('./routes/users'));

/* =========================
   Root
========================= */
app.get('/', (req, res) => {
  res.json({
    status: 'Server is running',
    documentation: '/api-docs',
  });
});

const PORT = process.env.PORT || 5000;
module.exports = app;

/* =========================
   Run local only
========================= */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/api-docs`);
  });
}
