const express = require('express');
const { pool } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get PAS systems
router.get('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        id, name, type, endpoint_url, is_active, last_sync_at, created_at, updated_at
      FROM pas_systems
      ORDER BY name
    `);
    
    res.json({
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching PAS systems:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch PAS systems' }
    });
  } finally {
    client.release();
  }
});

module.exports = router;