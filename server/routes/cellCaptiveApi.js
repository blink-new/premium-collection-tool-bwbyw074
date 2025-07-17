const express = require('express');
const { pool } = require('../database/init');
const { authenticateApiKey, requirePermission } = require('../middleware/apiAuth');
const { broadcastToClients } = require('../websocket/server');

const router = express.Router();

// Get cell captive's own information
router.get('/info', authenticateApiKey, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        cc.*,
        COUNT(p.id) as policy_count,
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_policies,
        COUNT(c.id) as total_collections,
        COUNT(CASE WHEN c.status = 'successful' THEN 1 END) as successful_collections,
        COUNT(CASE WHEN c.status = 'failed' THEN 1 END) as failed_collections,
        COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_collections,
        SUM(CASE WHEN c.status = 'successful' THEN c.amount ELSE 0 END) as total_collected,
        AVG(CASE WHEN c.status = 'successful' THEN c.amount END) as avg_collection_amount
      FROM cell_captives cc
      LEFT JOIN policies p ON cc.id = p.cell_captive_id
      LEFT JOIN collections c ON cc.id = c.cell_captive_id
      WHERE cc.id = $1
      GROUP BY cc.id
    `, [req.cellCaptive.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Cell captive not found' }
      });
    }
    
    const cellCaptive = {
      ...result.rows[0],
      total_collected: parseFloat(result.rows[0].total_collected || 0),
      avg_collection_amount: parseFloat(result.rows[0].avg_collection_amount || 0),
      policy_count: parseInt(result.rows[0].policy_count || 0),
      active_policies: parseInt(result.rows[0].active_policies || 0),
      total_collections: parseInt(result.rows[0].total_collections || 0),
      successful_collections: parseInt(result.rows[0].successful_collections || 0),
      failed_collections: parseInt(result.rows[0].failed_collections || 0),
      pending_collections: parseInt(result.rows[0].pending_collections || 0)
    };
    
    res.json({ data: cellCaptive });
    
  } catch (error) {
    console.error('Error fetching cell captive info:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch cell captive information' }
    });
  } finally {
    client.release();
  }
});

// Get cell captive's policies
router.get('/policies', authenticateApiKey, requirePermission('policies:read'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'cell_captive_id = $1';
    const queryParams = [req.cellCaptive.id];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      whereClause += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }
    
    if (search) {
      paramCount++;
      whereClause += ` AND (policy_number ILIKE $${paramCount} OR client_name ILIKE $${paramCount} OR client_email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }
    
    const result = await client.query(`
      SELECT 
        p.*,
        COUNT(c.id) as collection_count,
        COUNT(CASE WHEN c.status = 'successful' THEN 1 END) as successful_collections,
        SUM(CASE WHEN c.status = 'successful' THEN c.amount ELSE 0 END) as total_collected,
        MAX(c.collection_date) as last_collection_date
      FROM policies p
      LEFT JOIN collections c ON p.id = c.policy_id
      WHERE ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);
    
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM policies
      WHERE ${whereClause}
    `, queryParams);
    
    res.json({
      data: result.rows.map(row => ({
        ...row,
        premium_amount: parseFloat(row.premium_amount),
        total_collected: parseFloat(row.total_collected || 0),
        collection_count: parseInt(row.collection_count || 0),
        successful_collections: parseInt(row.successful_collections || 0)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch policies' }
    });
  } finally {
    client.release();
  }
});

// Get cell captive's collections
router.get('/collections', authenticateApiKey, requirePermission('collections:read'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      collection_type,
      date_from,
      date_to,
      policy_number 
    } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'c.cell_captive_id = $1';
    const queryParams = [req.cellCaptive.id];
    let paramCount = 1;
    
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
    
    if (policy_number) {
      paramCount++;
      whereClause += ` AND p.policy_number ILIKE $${paramCount}`;
      queryParams.push(`%${policy_number}%`);
    }
    
    const result = await client.query(`
      SELECT 
        c.*,
        p.policy_number,
        p.client_name,
        p.client_email,
        rr.bank_reference,
        rr.transaction_date as bank_transaction_date,
        rr.status as reconciliation_status
      FROM collections c
      JOIN policies p ON c.policy_id = p.id
      LEFT JOIN reconciliation_records rr ON c.id = rr.collection_id
      WHERE ${whereClause}
      ORDER BY c.collection_date DESC, c.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);
    
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM collections c
      JOIN policies p ON c.policy_id = p.id
      WHERE ${whereClause}
    `, queryParams);
    
    res.json({
      data: result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount)
      })),
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
});

// Create a new collection (ad-hoc)
router.post('/collections', authenticateApiKey, requirePermission('collections:write'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      policy_number,
      amount,
      collection_date,
      collection_type = 'adhoc'
    } = req.body;
    
    if (!policy_number) {
      return res.status(400).json({
        error: { message: 'Policy number is required' }
      });
    }
    
    // Find policy
    const policyResult = await client.query(`
      SELECT id, policy_number, client_name, premium_amount, status
      FROM policies
      WHERE policy_number = $1 AND cell_captive_id = $2
    `, [policy_number, req.cellCaptive.id]);
    
    if (policyResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Policy not found' }
      });
    }
    
    const policy = policyResult.rows[0];
    
    if (policy.status !== 'active') {
      return res.status(400).json({
        error: { message: 'Cannot create collection for inactive policy' }
      });
    }
    
    // Generate collection reference
    const collectionReference = `COL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create collection
    const result = await client.query(`
      INSERT INTO collections (
        collection_reference,
        policy_id,
        cell_captive_id,
        collection_type,
        amount,
        collection_date,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      collectionReference,
      policy.id,
      req.cellCaptive.id,
      collection_type,
      amount || policy.premium_amount,
      collection_date || new Date().toISOString().split('T')[0],
      'pending'
    ]);
    
    const newCollection = {
      ...result.rows[0],
      policy_number: policy.policy_number,
      client_name: policy.client_name,
      amount: parseFloat(result.rows[0].amount)
    };
    
    // Broadcast new collection
    broadcastToClients('collection_created', {
      collection: newCollection,
      cell_captive: req.cellCaptive,
      created_by: 'api'
    });
    
    res.status(201).json({
      data: newCollection,
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

// Update a collection
router.patch('/collections/:collection_reference', authenticateApiKey, requirePermission('collections:write'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { collection_reference } = req.params;
    const { status, amount, failure_reason, investec_reference } = req.body;
    
    // Find collection
    const collectionResult = await client.query(`
      SELECT c.*, p.policy_number, p.client_name
      FROM collections c
      JOIN policies p ON c.policy_id = p.id
      WHERE c.collection_reference = $1 AND c.cell_captive_id = $2
    `, [collection_reference, req.cellCaptive.id]);
    
    if (collectionResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Collection not found' }
      });
    }
    
    const collection = collectionResult.rows[0];
    
    // Build update query
    const updateFields = [];
    const updateParams = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      updateParams.push(status);
    }
    
    if (amount) {
      paramCount++;
      updateFields.push(`amount = $${paramCount}`);
      updateParams.push(amount);
    }
    
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
    
    if (['successful', 'failed'].includes(status) && !collection.processed_at) {
      paramCount++;
      updateFields.push(`processed_at = $${paramCount}`);
      updateParams.push(new Date());
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        error: { message: 'No valid update fields provided' }
      });
    }
    
    const result = await client.query(`
      UPDATE collections 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount + 1}
      RETURNING *
    `, [...updateParams, collection.id]);
    
    const updatedCollection = {
      ...result.rows[0],
      policy_number: collection.policy_number,
      client_name: collection.client_name,
      amount: parseFloat(result.rows[0].amount)
    };
    
    // Broadcast update
    broadcastToClients('collection_updated', {
      collection: updatedCollection,
      cell_captive: req.cellCaptive,
      updated_by: 'api'
    });
    
    res.json({
      data: updatedCollection,
      message: 'Collection updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({
      error: { message: 'Failed to update collection' }
    });
  } finally {
    client.release();
  }
});

// Get collection statistics
router.get('/statistics', authenticateApiKey, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { date_from, date_to } = req.query;
    
    let whereClause = 'c.cell_captive_id = $1';
    const queryParams = [req.cellCaptive.id];
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
    
    // Get overall statistics
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
        COUNT(CASE WHEN c.collection_type = 'adhoc' THEN 1 END) as adhoc_collections
      FROM collections c
      WHERE ${whereClause}
    `, queryParams);
    
    // Get monthly trends
    const trendsResult = await client.query(`
      SELECT 
        DATE_TRUNC('month', c.collection_date) as month,
        COUNT(*) as collections,
        SUM(c.amount) as amount,
        COUNT(CASE WHEN c.status = 'successful' THEN 1 END) as successful,
        COUNT(CASE WHEN c.status = 'failed' THEN 1 END) as failed
      FROM collections c
      WHERE c.cell_captive_id = $1
        AND c.collection_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', c.collection_date)
      ORDER BY month DESC
      LIMIT 12
    `, [req.cellCaptive.id]);
    
    // Get policy statistics
    const policyStatsResult = await client.query(`
      SELECT 
        COUNT(*) as total_policies,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_policies,
        COUNT(CASE WHEN status = 'lapsed' THEN 1 END) as lapsed_policies,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_policies,
        AVG(premium_amount) as avg_premium_amount
      FROM policies
      WHERE cell_captive_id = $1
    `, [req.cellCaptive.id]);
    
    const stats = statsResult.rows[0];
    const policyStats = policyStatsResult.rows[0];
    
    const successRate = stats.total_collections > 0 
      ? (stats.successful_collections / stats.total_collections * 100).toFixed(2)
      : 0;
    
    res.json({
      data: {
        collections: {
          ...stats,
          success_rate: parseFloat(successRate),
          total_amount: parseFloat(stats.total_amount || 0),
          successful_amount: parseFloat(stats.successful_amount || 0),
          avg_successful_amount: parseFloat(stats.avg_successful_amount || 0)
        },
        policies: {
          ...policyStats,
          avg_premium_amount: parseFloat(policyStats.avg_premium_amount || 0)
        },
        monthly_trends: trendsResult.rows.map(row => ({
          month: row.month,
          collections: parseInt(row.collections),
          amount: parseFloat(row.amount),
          successful: parseInt(row.successful),
          failed: parseInt(row.failed)
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch statistics' }
    });
  } finally {
    client.release();
  }
});

module.exports = router;