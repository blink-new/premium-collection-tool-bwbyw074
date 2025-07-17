const express = require('express');
const { pool } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { authenticateApiKey, requirePermission } = require('../middleware/apiAuth');
const { logAuditTrail } = require('../utils/audit');
const { broadcastUpdate } = require('../websocket/server');

const router = express.Router();

// Get collections (supports both user auth and API key auth)
router.get('/', async (req, res) => {
  // Try API key auth first, then user auth
  if (req.headers.authorization?.startsWith('Bearer pct_')) {
    return authenticateApiKey(req, res, () => getCollectionsHandler(req, res));
  } else {
    return authenticateToken(req, res, () => getCollectionsHandler(req, res));
  }
});

async function getCollectionsHandler(req, res) {
  const client = await pool.connect();
  
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      collection_type, 
      policy_number,
      client_name,
      date_from,
      date_to,
      cell_captive_id
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const queryParams = [];
    let paramCount = 0;
    
    // Filter by cell captive if using API key
    if (req.cellCaptive) {
      paramCount++;
      whereClause += ` AND c.cell_captive_id = $${paramCount}`;
      queryParams.push(req.cellCaptive.id);
    } else if (cell_captive_id) {
      paramCount++;
      whereClause += ` AND c.cell_captive_id = $${paramCount}`;
      queryParams.push(cell_captive_id);
    }
    
    if (status) {
      paramCount++;
      whereClause += ` AND c.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    if (collection_type) {
      paramCount++;
      whereClause += ` AND c.collection_type = $${paramCount}`;
      queryParams.push(collection_type);
    }
    
    if (policy_number) {
      paramCount++;
      whereClause += ` AND p.policy_number ILIKE $${paramCount}`;
      queryParams.push(`%${policy_number}%`);
    }
    
    if (client_name) {
      paramCount++;
      whereClause += ` AND p.client_name ILIKE $${paramCount}`;
      queryParams.push(`%${client_name}%`);
    }
    
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
    
    const result = await client.query(`
      SELECT 
        c.id,
        c.collection_reference,
        c.collection_type,
        c.amount,
        c.collection_date,
        c.status,
        c.failure_reason,
        c.retry_count,
        c.investec_reference,
        c.created_at,
        c.updated_at,
        p.policy_number,
        p.client_name,
        p.client_email,
        cc.name as cell_captive_name,
        cc.code as cell_captive_code,
        u1.first_name || ' ' || u1.last_name as created_by_name,
        u2.first_name || ' ' || u2.last_name as approved_by_name,
        c.approved_at
      FROM collections c
      JOIN policies p ON c.policy_id = p.id
      JOIN cell_captives cc ON c.cell_captive_id = cc.id
      LEFT JOIN users u1 ON c.created_by = u1.id
      LEFT JOIN users u2 ON c.approved_by = u2.id
      WHERE ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);
    
    // Get total count
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM collections c
      JOIN policies p ON c.policy_id = p.id
      JOIN cell_captives cc ON c.cell_captive_id = cc.id
      WHERE ${whereClause}
    `, queryParams);
    
    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch collections' }
    });
  } finally {
    client.release();
  }
}

// Create new collection
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      policy_id,
      collection_type,
      amount,
      collection_date,
      cell_captive_id
    } = req.body;
    
    if (!policy_id || !collection_type || !amount || !collection_date) {
      return res.status(400).json({
        error: { message: 'Policy ID, collection type, amount, and collection date are required' }
      });
    }
    
    // Verify policy exists and get details
    const policyResult = await client.query(`
      SELECT p.*, cc.name as cell_captive_name
      FROM policies p
      JOIN cell_captives cc ON p.cell_captive_id = cc.id
      WHERE p.id = $1 AND p.status = 'active'
    `, [policy_id]);
    
    if (policyResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Active policy not found' }
      });
    }
    
    const policy = policyResult.rows[0];
    
    // Generate collection reference
    const collectionReference = `COL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Create collection
    const result = await client.query(`
      INSERT INTO collections (
        collection_reference, policy_id, cell_captive_id, collection_type,
        amount, collection_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      collectionReference,
      policy_id,
      cell_captive_id || policy.cell_captive_id,
      collection_type,
      amount,
      collection_date,
      req.user.id
    ]);
    
    const newCollection = result.rows[0];
    
    // Log audit trail
    await logAuditTrail(client, {
      table_name: 'collections',
      record_id: newCollection.id,
      action: 'INSERT',
      new_values: newCollection,
      changed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    // Broadcast update
    broadcastUpdate('collection_created', {
      collection_id: newCollection.id,
      collection_reference: newCollection.collection_reference,
      policy_number: policy.policy_number,
      client_name: policy.client_name,
      amount: newCollection.amount,
      collection_type: newCollection.collection_type,
      cell_captive: policy.cell_captive_name
    });
    
    res.status(201).json({
      data: {
        ...newCollection,
        policy_number: policy.policy_number,
        client_name: policy.client_name,
        cell_captive_name: policy.cell_captive_name
      },
      message: 'Collection created successfully'
    });
    
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({
      error: { message: 'Failed to create collection' }
    });
  } finally {
    client.release();
  }
});

// Update collection status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { status, failure_reason, investec_reference } = req.body;
    
    if (!status) {
      return res.status(400).json({
        error: { message: 'Status is required' }
      });
    }
    
    // Get current collection
    const currentResult = await client.query(
      'SELECT * FROM collections WHERE id = $1',
      [id]
    );
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Collection not found' }
      });
    }
    
    const currentCollection = currentResult.rows[0];
    
    // Update collection
    const updateFields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    const updateParams = [id, status];
    let paramCount = 2;
    
    if (failure_reason) {
      paramCount++;
      updateFields.push(`failure_reason = $${paramCount}`);
      updateParams.push(failure_reason);
    }
    
    if (investec_reference) {
      paramCount++;
      updateFields.push(`investec_reference = $${paramCount}`);
      updateParams.push(investec_reference);
    }
    
    if (['successful', 'failed'].includes(status)) {
      updateFields.push('processed_at = CURRENT_TIMESTAMP');
    }
    
    const result = await client.query(`
      UPDATE collections 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `, updateParams);
    
    const updatedCollection = result.rows[0];
    
    // Log audit trail
    await logAuditTrail(client, {
      table_name: 'collections',
      record_id: id,
      action: 'UPDATE',
      old_values: { status: currentCollection.status },
      new_values: { status: updatedCollection.status },
      changed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    // Broadcast update
    broadcastUpdate('collection_status_updated', {
      collection_id: id,
      collection_reference: updatedCollection.collection_reference,
      old_status: currentCollection.status,
      new_status: updatedCollection.status,
      updated_at: updatedCollection.updated_at
    });
    
    res.json({
      data: updatedCollection,
      message: 'Collection status updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating collection status:', error);
    res.status(500).json({
      error: { message: 'Failed to update collection status' }
    });
  } finally {
    client.release();
  }
});

// Get collection statistics
router.get('/stats', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { cell_captive_id, date_from, date_to } = req.query;
    
    let whereClause = '1=1';
    const queryParams = [];
    let paramCount = 0;
    
    if (cell_captive_id) {
      paramCount++;
      whereClause += ` AND c.cell_captive_id = $${paramCount}`;
      queryParams.push(cell_captive_id);
    }
    
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
        COUNT(CASE WHEN status = 'successful' THEN 1 END) as successful_collections,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_collections,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_collections,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'successful' THEN amount ELSE 0 END) as successful_amount,
        AVG(CASE WHEN status = 'successful' THEN amount END) as avg_successful_amount,
        COUNT(CASE WHEN collection_type = 'recurring' THEN 1 END) as recurring_collections,
        COUNT(CASE WHEN collection_type = 'adhoc' THEN 1 END) as adhoc_collections
      FROM collections c
      WHERE ${whereClause}
    `, queryParams);
    
    const stats = statsResult.rows[0];
    
    // Calculate success rate
    const successRate = stats.total_collections > 0 
      ? (stats.successful_collections / stats.total_collections * 100).toFixed(2)
      : 0;
    
    res.json({
      data: {
        ...stats,
        success_rate: parseFloat(successRate),
        total_amount: parseFloat(stats.total_amount || 0),
        successful_amount: parseFloat(stats.successful_amount || 0),
        avg_successful_amount: parseFloat(stats.avg_successful_amount || 0)
      }
    });
    
  } catch (error) {
    console.error('Error fetching collection stats:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch collection statistics' }
    });
  } finally {
    client.release();
  }
});

module.exports = router;