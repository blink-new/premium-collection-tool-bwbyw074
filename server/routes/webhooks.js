const express = require('express');
const { pool } = require('../database/init');
const { authenticateApiKey, requirePermission } = require('../middleware/apiAuth');
const { logAuditTrail } = require('../utils/audit');
const { broadcastToClients } = require('../websocket/server');

const router = express.Router();

// Middleware to track request start time
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Webhook endpoint for cell captives to update collection files
router.post('/collections/update', authenticateApiKey, requirePermission('collections:write'), async (req, res) => {
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
      bank_reference,
      transaction_date
    } = req.body;
    
    // Validate required fields
    if (!collection_reference && !policy_number) {
      return res.status(400).json({
        error: { 
          message: 'Either collection_reference or policy_number is required',
          code: 'MISSING_IDENTIFIER'
        }
      });
    }
    
    if (!status) {
      return res.status(400).json({
        error: { 
          message: 'Status is required',
          code: 'MISSING_STATUS'
        }
      });
    }
    
    // Valid statuses
    const validStatuses = ['pending', 'submitted', 'successful', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: { 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS'
        }
      });
    }
    
    let collection;
    
    // Find collection by reference or policy number
    if (collection_reference) {
      const result = await client.query(`
        SELECT c.*, p.policy_number, p.client_name
        FROM collections c
        JOIN policies p ON c.policy_id = p.id
        WHERE c.collection_reference = $1 AND c.cell_captive_id = $2
      `, [collection_reference, req.cellCaptive.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: { 
            message: 'Collection not found',
            code: 'COLLECTION_NOT_FOUND'
          }
        });
      }
      
      collection = result.rows[0];
    } else {
      // Find by policy number and create collection if needed
      const policyResult = await client.query(`
        SELECT id, policy_number, client_name, premium_amount
        FROM policies
        WHERE policy_number = $1 AND cell_captive_id = $2
      `, [policy_number, req.cellCaptive.id]);
      
      if (policyResult.rows.length === 0) {
        return res.status(404).json({
          error: { 
            message: 'Policy not found',
            code: 'POLICY_NOT_FOUND'
          }
        });
      }
      
      const policy = policyResult.rows[0];
      
      // Check if collection already exists for this policy and date
      const existingResult = await client.query(`
        SELECT c.*, p.policy_number, p.client_name
        FROM collections c
        JOIN policies p ON c.policy_id = p.id
        WHERE c.policy_id = $1 AND c.collection_date = $2
        ORDER BY c.created_at DESC
        LIMIT 1
      `, [policy.id, collection_date || new Date().toISOString().split('T')[0]]);
      
      if (existingResult.rows.length > 0) {
        collection = existingResult.rows[0];
      } else {
        // Create new collection
        const newCollectionResult = await client.query(`
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
          `COL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          policy.id,
          req.cellCaptive.id,
          'adhoc', // Default to adhoc for webhook-created collections
          amount || policy.premium_amount,
          collection_date || new Date().toISOString().split('T')[0],
          status
        ]);
        
        collection = {
          ...newCollectionResult.rows[0],
          policy_number: policy.policy_number,
          client_name: policy.client_name
        };
      }
    }
    
    // Store old values for audit
    const oldValues = { ...collection };
    
    // Update collection
    const updateFields = [];
    const updateParams = [];
    let paramCount = 0;
    
    if (status !== collection.status) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      updateParams.push(status);
    }
    
    if (amount && parseFloat(amount) !== parseFloat(collection.amount)) {
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
    
    // Set processed timestamp for successful/failed status
    if (['successful', 'failed'].includes(status) && !collection.processed_at) {
      paramCount++;
      updateFields.push(`processed_at = $${paramCount}`);
      updateParams.push(new Date());
    }
    
    let updatedCollection = collection;
    
    if (updateFields.length > 0) {
      const updateResult = await client.query(`
        UPDATE collections 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount + 1}
        RETURNING *
      `, [...updateParams, collection.id]);
      
      updatedCollection = {
        ...updateResult.rows[0],
        policy_number: collection.policy_number,
        client_name: collection.client_name
      };
    }
    
    // Create reconciliation record if successful and bank details provided
    if (status === 'successful' && (bank_reference || transaction_date)) {
      await client.query(`
        INSERT INTO reconciliation_records (
          collection_id,
          investec_reference,
          bank_reference,
          amount,
          transaction_date,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (collection_id) DO UPDATE SET
          bank_reference = EXCLUDED.bank_reference,
          transaction_date = EXCLUDED.transaction_date,
          updated_at = CURRENT_TIMESTAMP
      `, [
        collection.id,
        investec_reference,
        bank_reference,
        updatedCollection.amount,
        transaction_date || new Date().toISOString().split('T')[0],
        'matched'
      ]);
    }
    
    // Log webhook activity
    await client.query(`
      INSERT INTO webhook_logs (
        cell_captive_id,
        endpoint,
        method,
        headers,
        payload,
        response_status,
        processing_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      req.cellCaptive.id,
      req.originalUrl,
      req.method,
      JSON.stringify(req.headers),
      JSON.stringify(req.body),
      200,
      Date.now() - req.startTime
    ]);
    
    // Log audit trail
    await logAuditTrail(client, {
      table_name: 'collections',
      record_id: collection.id,
      action: 'UPDATE',
      old_values: oldValues,
      new_values: updatedCollection,
      changed_by: null, // API key update
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    // Broadcast update via WebSocket
    broadcastToClients('collection_updated', {
      collection: updatedCollection,
      cell_captive: req.cellCaptive,
      updated_by: 'webhook'
    });
    
    res.json({
      data: {
        collection: updatedCollection,
        message: 'Collection updated successfully'
      }
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    
    // Log failed webhook
    try {
      await client.query(`
        INSERT INTO webhook_logs (
          cell_captive_id,
          endpoint,
          method,
          headers,
          payload,
          response_status,
          response_body,
          processing_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        req.cellCaptive?.id,
        req.originalUrl,
        req.method,
        JSON.stringify(req.headers),
        JSON.stringify(req.body),
        500,
        error.message,
        Date.now() - req.startTime
      ]);
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }
    
    res.status(500).json({
      error: { 
        message: 'Failed to process webhook',
        code: 'WEBHOOK_ERROR'
      }
    });
  } finally {
    client.release();
  }
});

// Webhook endpoint for bulk collection updates
router.post('/collections/bulk-update', authenticateApiKey, requirePermission('collections:write'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { collections } = req.body;
    
    if (!Array.isArray(collections) || collections.length === 0) {
      return res.status(400).json({
        error: { 
          message: 'Collections array is required',
          code: 'MISSING_COLLECTIONS'
        }
      });
    }
    
    if (collections.length > 100) {
      return res.status(400).json({
        error: { 
          message: 'Maximum 100 collections allowed per request',
          code: 'TOO_MANY_COLLECTIONS'
        }
      });
    }
    
    const results = [];
    const errors = [];
    
    await client.query('BEGIN');
    
    for (let i = 0; i < collections.length; i++) {
      const collectionData = collections[i];
      
      try {
        const { 
          collection_reference,
          policy_number,
          status,
          amount,
          failure_reason,
          investec_reference
        } = collectionData;
        
        if (!collection_reference && !policy_number) {
          errors.push({
            index: i,
            error: 'Either collection_reference or policy_number is required'
          });
          continue;
        }
        
        if (!status) {
          errors.push({
            index: i,
            error: 'Status is required'
          });
          continue;
        }
        
        // Find and update collection (similar logic to single update)
        let collection;
        
        if (collection_reference) {
          const result = await client.query(`
            SELECT c.*, p.policy_number, p.client_name
            FROM collections c
            JOIN policies p ON c.policy_id = p.id
            WHERE c.collection_reference = $1 AND c.cell_captive_id = $2
          `, [collection_reference, req.cellCaptive.id]);
          
          if (result.rows.length === 0) {
            errors.push({
              index: i,
              error: 'Collection not found',
              collection_reference
            });
            continue;
          }
          
          collection = result.rows[0];
        } else {
          // Find by policy number
          const policyResult = await client.query(`
            SELECT c.*, p.policy_number, p.client_name
            FROM collections c
            JOIN policies p ON c.policy_id = p.id
            WHERE p.policy_number = $1 AND c.cell_captive_id = $2
            ORDER BY c.created_at DESC
            LIMIT 1
          `, [policy_number, req.cellCaptive.id]);
          
          if (policyResult.rows.length === 0) {
            errors.push({
              index: i,
              error: 'Collection not found for policy',
              policy_number
            });
            continue;
          }
          
          collection = policyResult.rows[0];
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
        
        if (['successful', 'failed'].includes(status)) {
          paramCount++;
          updateFields.push(`processed_at = $${paramCount}`);
          updateParams.push(new Date());
        }
        
        const updateResult = await client.query(`
          UPDATE collections 
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramCount + 1}
          RETURNING *
        `, [...updateParams, collection.id]);
        
        const updatedCollection = {
          ...updateResult.rows[0],
          policy_number: collection.policy_number,
          client_name: collection.client_name
        };
        
        results.push({
          index: i,
          collection: updatedCollection,
          status: 'updated'
        });
        
        // Broadcast individual update
        broadcastToClients('collection_updated', {
          collection: updatedCollection,
          cell_captive: req.cellCaptive,
          updated_by: 'webhook_bulk'
        });
        
      } catch (itemError) {
        console.error(`Error processing collection ${i}:`, itemError);
        errors.push({
          index: i,
          error: itemError.message
        });
      }
    }
    
    await client.query('COMMIT');
    
    // Log bulk webhook activity
    await client.query(`
      INSERT INTO webhook_logs (
        cell_captive_id,
        endpoint,
        method,
        headers,
        payload,
        response_status,
        processing_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      req.cellCaptive.id,
      req.originalUrl,
      req.method,
      JSON.stringify(req.headers),
      JSON.stringify({ collections_count: collections.length }),
      200,
      Date.now() - req.startTime
    ]);
    
    res.json({
      data: {
        processed: results.length,
        errors: errors.length,
        results,
        errors
      },
      message: `Processed ${results.length} collections, ${errors.length} errors`
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk webhook error:', error);
    
    res.status(500).json({
      error: { 
        message: 'Failed to process bulk webhook',
        code: 'BULK_WEBHOOK_ERROR'
      }
    });
  } finally {
    client.release();
  }
});

// Webhook endpoint for policy updates
router.post('/policies/update', authenticateApiKey, requirePermission('policies:write'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      policy_number,
      client_name,
      client_email,
      client_phone,
      premium_amount,
      frequency,
      status,
      mandate_reference,
      bank_account_number,
      bank_branch_code,
      next_collection_date
    } = req.body;
    
    if (!policy_number) {
      return res.status(400).json({
        error: { 
          message: 'Policy number is required',
          code: 'MISSING_POLICY_NUMBER'
        }
      });
    }
    
    // Find or create policy
    let policy;
    const existingResult = await client.query(`
      SELECT * FROM policies 
      WHERE policy_number = $1 AND cell_captive_id = $2
    `, [policy_number, req.cellCaptive.id]);
    
    if (existingResult.rows.length > 0) {
      // Update existing policy
      policy = existingResult.rows[0];
      
      const updateFields = [];
      const updateParams = [];
      let paramCount = 0;
      
      const fieldsToUpdate = {
        client_name,
        client_email,
        client_phone,
        premium_amount,
        frequency,
        status,
        mandate_reference,
        bank_account_number,
        bank_branch_code,
        next_collection_date
      };
      
      Object.entries(fieldsToUpdate).forEach(([key, value]) => {
        if (value !== undefined && value !== policy[key]) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          updateParams.push(value);
        }
      });
      
      if (updateFields.length > 0) {
        const updateResult = await client.query(`
          UPDATE policies 
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramCount + 1}
          RETURNING *
        `, [...updateParams, policy.id]);
        
        policy = updateResult.rows[0];
      }
      
    } else {
      // Create new policy
      const createResult = await client.query(`
        INSERT INTO policies (
          policy_number,
          cell_captive_id,
          client_name,
          client_email,
          client_phone,
          premium_amount,
          frequency,
          status,
          mandate_reference,
          bank_account_number,
          bank_branch_code,
          next_collection_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        policy_number,
        req.cellCaptive.id,
        client_name,
        client_email,
        client_phone,
        premium_amount,
        frequency || 'monthly',
        status || 'active',
        mandate_reference,
        bank_account_number,
        bank_branch_code,
        next_collection_date
      ]);
      
      policy = createResult.rows[0];
    }
    
    // Broadcast policy update
    broadcastToClients('policy_updated', {
      policy,
      cell_captive: req.cellCaptive,
      updated_by: 'webhook'
    });
    
    res.json({
      data: {
        policy,
        message: 'Policy updated successfully'
      }
    });
    
  } catch (error) {
    console.error('Policy webhook error:', error);
    res.status(500).json({
      error: { 
        message: 'Failed to process policy webhook',
        code: 'POLICY_WEBHOOK_ERROR'
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
    const { page = 1, limit = 50, status_code } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'cell_captive_id = $1';
    const queryParams = [req.cellCaptive.id];
    let paramCount = 1;
    
    if (status_code) {
      paramCount++;
      whereClause += ` AND response_status = $${paramCount}`;
      queryParams.push(parseInt(status_code));
    }
    
    const result = await client.query(`
      SELECT 
        id,
        endpoint,
        method,
        response_status,
        processing_time_ms,
        created_at
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