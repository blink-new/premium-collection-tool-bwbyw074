const { pool } = require('../database/init');

async function authenticateApiKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { 
          message: 'API key required. Use Authorization: Bearer <api_key>',
          code: 'MISSING_API_KEY'
        }
      });
    }
    
    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!apiKey.startsWith('pct_')) {
      return res.status(401).json({
        error: { 
          message: 'Invalid API key format',
          code: 'INVALID_API_KEY_FORMAT'
        }
      });
    }
    
    const client = await pool.connect();
    
    try {
      // Find API key and associated cell captive
      const result = await client.query(`
        SELECT 
          ak.id,
          ak.cell_captive_id,
          ak.key_name,
          ak.permissions,
          ak.is_active,
          ak.expires_at,
          cc.id as captive_id,
          cc.name as captive_name,
          cc.code as captive_code,
          cc.is_active as captive_is_active
        FROM api_keys ak
        JOIN cell_captives cc ON ak.cell_captive_id = cc.id
        WHERE ak.api_key = $1
      `, [apiKey]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          error: { 
            message: 'Invalid API key',
            code: 'INVALID_API_KEY'
          }
        });
      }
      
      const keyData = result.rows[0];
      
      // Check if API key is active
      if (!keyData.is_active) {
        return res.status(401).json({
          error: { 
            message: 'API key has been revoked',
            code: 'API_KEY_REVOKED'
          }
        });
      }
      
      // Check if cell captive is active
      if (!keyData.captive_is_active) {
        return res.status(401).json({
          error: { 
            message: 'Cell captive account is inactive',
            code: 'CAPTIVE_INACTIVE'
          }
        });
      }
      
      // Check if API key has expired
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        return res.status(401).json({
          error: { 
            message: 'API key has expired',
            code: 'API_KEY_EXPIRED'
          }
        });
      }
      
      // Update last used timestamp
      await client.query(
        'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
        [keyData.id]
      );
      
      // Attach key and cell captive info to request
      req.apiKey = {
        id: keyData.id,
        name: keyData.key_name,
        permissions: keyData.permissions
      };
      
      req.cellCaptive = {
        id: keyData.captive_id,
        name: keyData.captive_name,
        code: keyData.captive_code
      };
      
      next();
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('API authentication error:', error);
    res.status(500).json({
      error: { 
        message: 'Authentication failed',
        code: 'AUTH_ERROR'
      }
    });
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.apiKey || !req.apiKey.permissions) {
      return res.status(403).json({
        error: { 
          message: 'No permissions found',
          code: 'NO_PERMISSIONS'
        }
      });
    }
    
    const permissions = Array.isArray(req.apiKey.permissions) 
      ? req.apiKey.permissions 
      : JSON.parse(req.apiKey.permissions || '[]');
    
    if (!permissions.includes(permission) && !permissions.includes('*')) {
      return res.status(403).json({
        error: { 
          message: `Permission '${permission}' required`,
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      });
    }
    
    next();
  };
}

module.exports = {
  authenticateApiKey,
  requirePermission
};