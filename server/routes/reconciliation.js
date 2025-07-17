const express = require('express');
const { pool } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get reconciliation records
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
      whereClause += ` AND rr.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    const result = await client.query(`
      SELECT 
        rr.*,
        c.collection_reference,
        p.policy_number,
        p.client_name,
        cc.name as cell_captive_name,
        u.first_name || ' ' || u.last_name as reconciled_by_name
      FROM reconciliation_records rr
      JOIN collections c ON rr.collection_id = c.id
      JOIN policies p ON c.policy_id = p.id
      JOIN cell_captives cc ON c.cell_captive_id = cc.id
      LEFT JOIN users u ON rr.reconciled_by = u.id
      WHERE ${whereClause}
      ORDER BY rr.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);
    
    res.json({
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching reconciliation records:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch reconciliation records' }
    });
  } finally {
    client.release();
  }
});

module.exports = router;