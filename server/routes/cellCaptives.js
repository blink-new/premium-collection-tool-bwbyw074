const express = require('express');
const { pool } = require('../database/init');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAuditTrail } = require('../utils/audit');

const router = express.Router();

// Get all cell captives
router.get('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { page = 1, limit = 20, search, is_active } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const queryParams = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      whereClause += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount} OR contact_email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }
    
    if (is_active !== undefined) {
      paramCount++;
      whereClause += ` AND is_active = $${paramCount}`;
      queryParams.push(is_active === 'true');
    }
    
    const result = await client.query(`
      SELECT 
        cc.*,
        COUNT(p.id) as policy_count,
        COUNT(ak.id) as api_key_count,
        SUM(CASE WHEN c.status = 'successful' THEN c.amount ELSE 0 END) as total_collected,
        COUNT(c.id) as total_collections
      FROM cell_captives cc
      LEFT JOIN policies p ON cc.id = p.cell_captive_id
      LEFT JOIN api_keys ak ON cc.id = ak.cell_captive_id AND ak.is_active = true
      LEFT JOIN collections c ON cc.id = c.cell_captive_id
      WHERE ${whereClause}
      GROUP BY cc.id
      ORDER BY cc.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);
    
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM cell_captives
      WHERE ${whereClause}
    `, queryParams);
    
    res.json({
      data: result.rows.map(row => ({
        ...row,
        total_collected: parseFloat(row.total_collected || 0),
        policy_count: parseInt(row.policy_count || 0),
        api_key_count: parseInt(row.api_key_count || 0),
        total_collections: parseInt(row.total_collections || 0)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching cell captives:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch cell captives' }
    });
  } finally {
    client.release();
  }
});

// Get single cell captive
router.get('/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    const result = await client.query(`
      SELECT 
        cc.*,
        COUNT(p.id) as policy_count,
        COUNT(ak.id) as api_key_count,
        SUM(CASE WHEN c.status = 'successful' THEN c.amount ELSE 0 END) as total_collected,
        COUNT(c.id) as total_collections,
        COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_collections,
        COUNT(CASE WHEN c.status = 'failed' THEN 1 END) as failed_collections
      FROM cell_captives cc
      LEFT JOIN policies p ON cc.id = p.cell_captive_id
      LEFT JOIN api_keys ak ON cc.id = ak.cell_captive_id AND ak.is_active = true
      LEFT JOIN collections c ON cc.id = c.cell_captive_id
      WHERE cc.id = $1
      GROUP BY cc.id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Cell captive not found' }
      });
    }
    
    const cellCaptive = {
      ...result.rows[0],
      total_collected: parseFloat(result.rows[0].total_collected || 0),
      policy_count: parseInt(result.rows[0].policy_count || 0),
      api_key_count: parseInt(result.rows[0].api_key_count || 0),
      total_collections: parseInt(result.rows[0].total_collections || 0),
      pending_collections: parseInt(result.rows[0].pending_collections || 0),
      failed_collections: parseInt(result.rows[0].failed_collections || 0)
    };
    
    res.json({ data: cellCaptive });
    
  } catch (error) {
    console.error('Error fetching cell captive:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch cell captive' }
    });
  } finally {
    client.release();
  }
});

// Create new cell captive
router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { name, code, contact_email, contact_phone } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({
        error: { message: 'Name and code are required' }
      });
    }
    
    // Check if code already exists
    const existingResult = await client.query(
      'SELECT id FROM cell_captives WHERE code = $1',
      [code]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        error: { message: 'Cell captive code already exists' }
      });
    }
    
    const result = await client.query(`
      INSERT INTO cell_captives (name, code, contact_email, contact_phone)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, code, contact_email, contact_phone]);
    
    const newCellCaptive = result.rows[0];
    
    // Log audit trail
    await logAuditTrail(client, {
      table_name: 'cell_captives',
      record_id: newCellCaptive.id,
      action: 'INSERT',
      new_values: newCellCaptive,
      changed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    res.status(201).json({
      data: newCellCaptive,
      message: 'Cell captive created successfully'
    });
    
  } catch (error) {
    console.error('Error creating cell captive:', error);
    res.status(500).json({
      error: { message: 'Failed to create cell captive' }
    });
  } finally {
    client.release();
  }
});

// Update cell captive
router.patch('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { name, contact_email, contact_phone, is_active } = req.body;
    
    // Get current data
    const currentResult = await client.query(
      'SELECT * FROM cell_captives WHERE id = $1',
      [id]
    );
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Cell captive not found' }
      });
    }
    
    const currentData = currentResult.rows[0];
    
    // Build update query
    const updateFields = [];
    const updateParams = [];
    let paramCount = 0;
    
    if (name !== undefined) {
      paramCount++;
      updateFields.push(`name = $${paramCount}`);
      updateParams.push(name);
    }
    
    if (contact_email !== undefined) {
      paramCount++;
      updateFields.push(`contact_email = $${paramCount}`);
      updateParams.push(contact_email);
    }
    
    if (contact_phone !== undefined) {
      paramCount++;
      updateFields.push(`contact_phone = $${paramCount}`);
      updateParams.push(contact_phone);
    }
    
    if (is_active !== undefined) {
      paramCount++;
      updateFields.push(`is_active = $${paramCount}`);
      updateParams.push(is_active);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        error: { message: 'No valid update fields provided' }
      });
    }
    
    const result = await client.query(`
      UPDATE cell_captives 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount + 1}
      RETURNING *
    `, [...updateParams, id]);
    
    const updatedCellCaptive = result.rows[0];
    
    // Log audit trail
    await logAuditTrail(client, {
      table_name: 'cell_captives',
      record_id: id,
      action: 'UPDATE',
      old_values: currentData,
      new_values: updatedCellCaptive,
      changed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    res.json({
      data: updatedCellCaptive,
      message: 'Cell captive updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating cell captive:', error);
    res.status(500).json({
      error: { message: 'Failed to update cell captive' }
    });
  } finally {
    client.release();
  }
});

// Delete cell captive
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Check if cell captive has associated data
    const associatedDataResult = await client.query(`
      SELECT 
        COUNT(p.id) as policy_count,
        COUNT(c.id) as collection_count,
        COUNT(ak.id) as api_key_count
      FROM cell_captives cc
      LEFT JOIN policies p ON cc.id = p.cell_captive_id
      LEFT JOIN collections c ON cc.id = c.cell_captive_id
      LEFT JOIN api_keys ak ON cc.id = ak.cell_captive_id
      WHERE cc.id = $1
      GROUP BY cc.id
    `, [id]);
    
    if (associatedDataResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Cell captive not found' }
      });
    }
    
    const associatedData = associatedDataResult.rows[0];
    const hasAssociatedData = 
      parseInt(associatedData.policy_count) > 0 ||
      parseInt(associatedData.collection_count) > 0 ||
      parseInt(associatedData.api_key_count) > 0;
    
    if (hasAssociatedData) {
      return res.status(409).json({
        error: { 
          message: 'Cannot delete cell captive with associated policies, collections, or API keys',
          details: {
            policies: parseInt(associatedData.policy_count),
            collections: parseInt(associatedData.collection_count),
            api_keys: parseInt(associatedData.api_key_count)
          }
        }
      });
    }
    
    // Get cell captive data before deletion
    const cellCaptiveResult = await client.query(
      'SELECT * FROM cell_captives WHERE id = $1',
      [id]
    );
    
    const cellCaptiveData = cellCaptiveResult.rows[0];
    
    // Delete cell captive
    await client.query('DELETE FROM cell_captives WHERE id = $1', [id]);
    
    // Log audit trail
    await logAuditTrail(client, {
      table_name: 'cell_captives',
      record_id: id,
      action: 'DELETE',
      old_values: cellCaptiveData,
      changed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    res.json({
      message: 'Cell captive deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting cell captive:', error);
    res.status(500).json({
      error: { message: 'Failed to delete cell captive' }
    });
  } finally {
    client.release();
  }
});

// Get cell captive statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { date_from, date_to } = req.query;
    
    let whereClause = 'c.cell_captive_id = $1';
    const queryParams = [id];
    let paramCount = 1;
    
    if (date_from) {
      paramCount++;
      whereClause += ` AND c.collection_date >= $${paramCount}`;
      queryParams.push(date_from);
    }
    
    if (date_to) {
      paramCount++;
      whereClause += ` AND c.collection_date <= $${paramCount}`;
      queryParams.push(date_to);
    }
    
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_collections,
        COUNT(CASE WHEN c.status = 'successful' THEN 1 END) as successful_collections,
        COUNT(CASE WHEN c.status = 'failed' THEN 1 END) as failed_collections,
        COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_collections,
        SUM(c.amount) as total_amount,
        SUM(CASE WHEN c.status = 'successful' THEN c.amount ELSE 0 END) as successful_amount,
        AVG(CASE WHEN c.status = 'successful' THEN c.amount END) as avg_successful_amount,
        COUNT(CASE WHEN c.collection_type = 'recurring' THEN 1 END) as recurring_collections,
        COUNT(CASE WHEN c.collection_type = 'adhoc' THEN 1 END) as adhoc_collections,
        COUNT(DISTINCT p.id) as active_policies
      FROM collections c
      JOIN policies p ON c.policy_id = p.id
      WHERE ${whereClause}
    `, queryParams);
    
    const stats = statsResult.rows[0];
    
    // Get monthly trends
    const trendsResult = await client.query(`
      SELECT 
        DATE_TRUNC('month', c.collection_date) as month,
        COUNT(*) as collections,
        SUM(c.amount) as amount,
        COUNT(CASE WHEN c.status = 'successful' THEN 1 END) as successful
      FROM collections c
      WHERE c.cell_captive_id = $1
        AND c.collection_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', c.collection_date)
      ORDER BY month DESC
      LIMIT 12
    `, [id]);
    
    const successRate = stats.total_collections > 0 
      ? (stats.successful_collections / stats.total_collections * 100).toFixed(2)
      : 0;
    
    res.json({
      data: {
        ...stats,
        success_rate: parseFloat(successRate),
        total_amount: parseFloat(stats.total_amount || 0),
        successful_amount: parseFloat(stats.successful_amount || 0),
        avg_successful_amount: parseFloat(stats.avg_successful_amount || 0),
        active_policies: parseInt(stats.active_policies || 0),
        monthly_trends: trendsResult.rows.map(row => ({
          month: row.month,
          collections: parseInt(row.collections),
          amount: parseFloat(row.amount),
          successful: parseInt(row.successful)
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching cell captive stats:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch cell captive statistics' }
    });
  } finally {
    client.release();
  }
});

module.exports = router;