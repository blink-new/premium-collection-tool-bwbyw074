const jwt = require('jsonwebtoken');
const { pool } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: { message: 'Access token required' }
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({
        error: { message: 'Invalid or expired token' }
      });
    }

    try {
      const client = await pool.connect();
      const result = await client.query(
        'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );
      client.release();

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(403).json({
          error: { message: 'User not found or inactive' }
        });
      }

      req.user = result.rows[0];
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(500).json({
        error: { message: 'Authentication failed' }
      });
    }
  });
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: 'Authentication required' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: { message: 'Insufficient permissions' }
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};