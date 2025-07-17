const express = require('express');
const { pool } = require('../database/init');
const { authenticateApiKey } = require('../middleware/apiAuth');
const { logWebhookCall } = require('../utils/webhook');
const { broadcastUpdate } = require('../websocket/server');

const router = express.Router();

// Webhook endpoint for collection file updates
router.post('/collections/update', authenticateApiKey, async (req, res) => {
  const startTime = Date.now();
  const client = await pool.connect();
  
  try {
    const { 
      collection_reference,
      policy_number,
      status,
      amount,
      collection_date,
      failure_reason,
      investec_reference,
      metadata 
    } = req.body;
    
    if (!collection_reference && !policy_number) {
      return res.status(400).json({
        error: { 
          message: 'Either collection_reference or policy_number is required',
          code: 'MISSING_IDENTIFIER'
        }
      });
    }
    
    // Find the collection
    let collection;
    if (collection_reference) {
      const result = await client.query(`
        SELECT c.*, p.policy_number, p.client_name
        FROM collections c
        JOIN policies p ON c.policy_id = p.id
        WHERE c.collection_reference = $1 AND c.cell_captive_id = $2
      `, [collection_reference, req.cellCaptive.id]);
      collection = result.rows[0];
    } else {
      const result = await client.query(`
        SELECT c.*, p.policy_number, p.client_name
        FROM collections c
        JOIN policies p ON c.policy_id = p.id
        WHERE p.policy_number = $1 AND c.cell_captive_id = $2
        ORDER BY c.created_at DESC
        LIMIT 1
      `, [policy_number, req.cellCaptive.id]);
      collection = result.rows[0];
    }
    
    if (!collection) {
      await logWebhookCall(client, {
        cell_captive_id: req.cellCaptive.id,
        endpoint: req.originalUrl,
        method: req.method,
        headers: req.headers,
        payload: req.body,
        response_status: 404,
        response_body: 'Collection not found',
        processing_time_ms: Date.now() - startTime
      });
      
      return res.status(404).json({
        error: { 
          message: 'Collection not found',
          code: 'COLLECTION_NOT_FOUND'
        }
      });
    }
    
    // Prepare update data
    const updateData = {};
    const updateParams = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      updateData.status = status;
      updateParams.push(status);
    }
    
    if (amount) {
      paramCount++;
      updateData.amount = amount;
      updateParams.push(amount);
    }
    
    if (collection_date) {
      paramCount++;
      updateData.collection_date = collection_date;
      updateParams.push(collection_date);
    }
    
    if (failure_reason) {
      paramCount++;
      updateData.failure_reason = failure_reason;
      updateParams.push(failure_reason);
    }
    
    if (investec_reference) {
      paramCount++;
      updateData.investec_reference = investec_reference;
      updateParams.push(investec_reference);
    }
    
    // Add processed timestamp if status indicates completion
    if (status && ['successful', 'failed'].includes(status)) {
      paramCount++;
      updateData.processed_at = 'CURRENT_TIMESTAMP';
      updateParams.push('CURRENT_TIMESTAMP');
    }
    
    if (paramCount === 0) {
      return res.status(400).json({
        error: { 
          message: 'No valid update fields provided',
          code: 'NO_UPDATE_FIELDS'
        }
      });
    }
    
    // Build update query
    const setClause = Object.keys(updateData).map((key, index) => {
      if (key === 'processed_at' && updateData[key] === 'CURRENT_TIMESTAMP') {
        return `${key} = CURRENT_TIMESTAMP`;
      }
      return `${key} = $${index + 1}`;
    }).join(', ');
    
    // Remove CURRENT_TIMESTAMP from params if present
    const finalParams = updateParams.filter(param => param !== 'CURRENT_TIMESTAMP');
    
    // Update collection
    const updateResult = await client.query(`
      UPDATE collections 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${finalParams.length + 1}
      RETURNING *
    `, [...finalParams, collection.id]);
    
    const updatedCollection = updateResult.rows[0];
    
    // Create reconciliation record if successful
    if (status === 'successful' && investec_reference) {
      await client.query(`
        INSERT INTO reconciliation_records (
          collection_id, investec_reference, amount, 
          transaction_date, status
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        collection.id,
        investec_reference,
        amount || collection.amount,
        collection_date || new Date().toISOString().split('T')[0],
        'matched'
      ]);
    }
    
    // Log successful webhook call
    await logWebhookCall(client, {
      cell_captive_id: req.cellCaptive.id,
      endpoint: req.originalUrl,
      method: req.method,
      headers: req.headers,
      payload: req.body,
      response_status: 200,
      response_body: JSON.stringify({ success: true }),
      processing_time_ms: Date.now() - startTime
    });
    
    // Broadcast update via WebSocket
    broadcastUpdate('collection_updated', {
      collection_id: collection.id,
      collection_reference: collection.collection_reference,
      policy_number: collection.policy_number,
      client_name: collection.client_name,
      status: updatedCollection.status,
      amount: updatedCollection.amount,
      cell_captive: req.cellCaptive.name,
      updated_at: updatedCollection.updated_at
    });
    
    res.json({
      success: true,
      data: {
        collection_id: collection.id,
        collection_reference: collection.collection_reference,
        policy_number: collection.policy_number,
        previous_status: collection.status,
        new_status: updatedCollection.status,
        updated_at: updatedCollection.updated_at
      },
      message: 'Collection updated successfully'
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    
    // Log failed webhook call
    await logWebhookCall(client, {
      cell_captive_id: req.cellCaptive?.id,
      endpoint: req.originalUrl,
      method: req.method,
      headers: req.headers,
      payload: req.body,
      response_status: 500,
      response_body: error.message,
      processing_time_ms: Date.now() - startTime
    });
    
    res.status(500).json({
      error: { 
        message: 'Failed to update collection',
        code: 'UPDATE_FAILED'
      }
    });
  } finally {
    client.release();
  }
});

// Webhook endpoint for bulk collection updates
router.post('/collections/bulk-update', authenticateApiKey, async (req, res) => {
  const startTime = Date.now();
  const client = await pool.connect();
  
  try {
    const { collections } = req.body;
    
    if (!Array.isArray(collections) || collections.length === 0) {
      return res.status(400).json({
        error: { 
          message: 'Collections array is required and must not be empty',
          code: 'INVALID_COLLECTIONS_ARRAY'
        }
      });
    }
    
    if (collections.length > 100) {
      return res.status(400).json({
        error: { 
          message: 'Maximum 100 collections can be updated at once',
          code: 'BATCH_SIZE_EXCEEDED'
        }
      });
    }
    
    await client.query('BEGIN');
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < collections.length; i++) {
      const collectionUpdate = collections[i];
      
      try {
        const { 
          collection_reference,
          policy_number,
          status,
          amount,
          failure_reason,
          investec_reference 
        } = collectionUpdate;
        
        if (!collection_reference && !policy_number) {
          errors.push({
            index: i,
            error: 'Either collection_reference or policy_number is required'
          });
          continue;
        }
        
        // Find the collection
        let collection;
        if (collection_reference) {
          const result = await client.query(`
            SELECT c.*, p.policy_number
            FROM collections c
            JOIN policies p ON c.policy_id = p.id
            WHERE c.collection_reference = $1 AND c.cell_captive_id = $2
          `, [collection_reference, req.cellCaptive.id]);
          collection = result.rows[0];
        } else {
          const result = await client.query(`
            SELECT c.*, p.policy_number
            FROM collections c
            JOIN policies p ON c.policy_id = p.id
            WHERE p.policy_number = $1 AND c.cell_captive_id = $2
            ORDER BY c.created_at DESC
            LIMIT 1
          `, [policy_number, req.cellCaptive.id]);
          collection = result.rows[0];
        }
        
        if (!collection) {
          errors.push({
            index: i,
            collection_reference: collection_reference || policy_number,
            error: 'Collection not found'
          });
          continue;
        }
        
        // Update collection
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
        
        if (status && ['successful', 'failed'].includes(status)) {
          updateFields.push('processed_at = CURRENT_TIMESTAMP');
        }
        
        if (updateFields.length > 0) {
          const updateResult = await client.query(`
            UPDATE collections 
            SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramCount + 1}
            RETURNING *
          `, [...updateParams, collection.id]);
          
          results.push({
            index: i,
            collection_id: collection.id,
            collection_reference: collection.collection_reference,
            policy_number: collection.policy_number,
            status: updateResult.rows[0].status,
            updated: true
          });
        } else {
          results.push({
            index: i,
            collection_id: collection.id,
            collection_reference: collection.collection_reference,
            policy_number: collection.policy_number,
            updated: false,
            message: 'No valid update fields provided'
          });
        }
        
      } catch (error) {
        errors.push({
          index: i,
          collection_reference: collectionUpdate.collection_reference || collectionUpdate.policy_number,
          error: error.message
        });
      }
    }
    
    await client.query('COMMIT');
    
    // Log webhook call
    await logWebhookCall(client, {
      cell_captive_id: req.cellCaptive.id,
      endpoint: req.originalUrl,
      method: req.method,
      headers: req.headers,
      payload: req.body,
      response_status: 200,
      response_body: JSON.stringify({ 
        success: true, 
        processed: results.length, 
        errors: errors.length 
      }),
      processing_time_ms: Date.now() - startTime
    });
    
    // Broadcast bulk update
    if (results.length > 0) {
      broadcastUpdate('collections_bulk_updated', {
        cell_captive: req.cellCaptive.name,
        updated_count: results.filter(r => r.updated).length,
        total_count: collections.length,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      data: {
        processed: results.length,
        errors: errors.length,
        results: results,
        errors: errors
      },
      message: `Bulk update completed. ${results.length} processed, ${errors.length} errors.`
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk webhook error:', error);
    
    await logWebhookCall(client, {
      cell_captive_id: req.cellCaptive?.id,
      endpoint: req.originalUrl,
      method: req.method,
      headers: req.headers,
      payload: req.body,
      response_status: 500,
      response_body: error.message,
      processing_time_ms: Date.now() - startTime
    });
    
    res.status(500).json({
      error: { 
        message: 'Failed to process bulk update',
        code: 'BULK_UPDATE_FAILED'
      }
    });
  } finally {
    client.release();
  }
});

// Get webhook logs for a cell captive
router.get('/logs', authenticateApiKey, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { page = 1, limit = 50, status, endpoint } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'cell_captive_id = $1';
    const queryParams = [req.cellCaptive.id];
    let paramCount = 1;
    
    if (status) {
      paramCount++;
      if (status === 'success') {
        whereClause += ` AND response_status >= 200 AND response_status < 300`;
      } else if (status === 'error') {
        whereClause += ` AND (response_status < 200 OR response_status >= 300)`;
      }
    }
    
    if (endpoint) {
      paramCount++;
      whereClause += ` AND endpoint ILIKE $${paramCount}`;
      queryParams.push(`%${endpoint}%`);
    }
    
    const result = await client.query(`
      SELECT 
        id, endpoint, method, response_status, 
        processing_time_ms, created_at,
        CASE 
          WHEN response_status >= 200 AND response_status < 300 THEN 'success'
          ELSE 'error'
        END as status
      FROM webhook_logs
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);
    
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM webhook_logs
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
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch webhook logs' }
    });
  } finally {
    client.release();
  }
});

module.exports = router;