const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ไม่มี Authorization header
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // ต้องเป็น Bearer <token>
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Token format invalid' });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
