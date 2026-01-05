// ==========================
// Load ENV (local เท่านั้น)
// ==========================
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

const express = require('express');
const cors = require('cors');

const app = express();

// ==========================
// Middleware
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// Routes
// ==========================
app.use('/api/users', require('../routes/users'));
app.use('/api/products', require('../routes/products'));

// ==========================
// Root
// ==========================
app.get('/', (req, res) => {
  res.json({ status: 'OK' });
});

// ==========================
// Export (สำคัญมาก)
// ==========================
module.exports = app;

// ==========================
// Local only
// ==========================
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
