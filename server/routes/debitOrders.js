const express = require('express');
const { pool } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get debit order files
router.get('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const queryParams = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }
    
    const result = await client.query(`
      SELECT 
        dof.*,
        u.first_name || ' ' || u.last_name as created_by_name,
        COUNT(dofi.id) as item_count
      FROM debit_order_files dof
      LEFT JOIN users u ON dof.created_by = u.id
      LEFT JOIN debit_order_file_items dofi ON dof.id = dofi.file_id
      WHERE ${whereClause}
      GROUP BY dof.id, u.first_name, u.last_name
      ORDER BY dof.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);
    
    res.json({
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching debit order files:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch debit order files' }
    });
  } finally {
    client.release();
  }
});

module.exports = router;