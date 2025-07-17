const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { pool } = require('../database/init');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { logAuditTrail } = require('../utils/audit');

const router = express.Router();

// Generate API key for cell captive
router.post('/generate', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { cell_captive_id, key_name, permissions, expires_in_days } = req.body;
    
    if (!cell_captive_id || !key_name) {
      return res.status(400).json({
        error: { message: 'Cell captive ID and key name are required' }
      });
    }
    
    // Verify cell captive exists
    const cellCaptiveResult = await client.query(
      'SELECT id, name FROM cell_captives WHERE id = $1 AND is_active = true',
      [cell_captive_id]
    );
    
    if (cellCaptiveResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Cell captive not found' }
      });
    }
    
    // Generate secure API key
    const apiKey = `pct_${crypto.randomBytes(32).toString('hex')}`;
    
    // Calculate expiration date
    let expiresAt = null;
    if (expires_in_days) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);
    }
    
    // Insert API key
    const result = await client.query(`
      INSERT INTO api_keys (
        cell_captive_id, key_name, api_key, permissions, 
        expires_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, key_name, api_key, permissions, expires_at, created_at
    `, [
      cell_captive_id,
      key_name,
      apiKey,
      JSON.stringify(permissions || ['collections:read', 'collections:write']),
      expiresAt,
      req.user.id
    ]);
    
    const newApiKey = result.rows[0];
    
    // Log audit trail
    await logAuditTrail(client, {
      table_name: 'api_keys',
      record_id: newApiKey.id,
      action: 'INSERT',
      new_values: { ...newApiKey, api_key: '[REDACTED]' },
      changed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    res.status(201).json({
      data: {
        id: newApiKey.id,
        key_name: newApiKey.key_name,
        api_key: newApiKey.api_key, // Only shown once
        permissions: newApiKey.permissions,
        expires_at: newApiKey.expires_at,
        created_at: newApiKey.created_at,
        cell_captive: cellCaptiveResult.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      error: { message: 'Failed to generate API key' }
    });
  } finally {
    client.release();
  }
});

// List API keys for a cell captive
router.get('/cell-captive/:id', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    const result = await client.query(`
      SELECT 
        ak.id,
        ak.key_name,
        LEFT(ak.api_key, 12) || '...' as api_key_preview,
        ak.permissions,
        ak.is_active,
        ak.last_used_at,
        ak.expires_at,
        ak.created_at,
        cc.name as cell_captive_name,
        cc.code as cell_captive_code
      FROM api_keys ak
      JOIN cell_captives cc ON ak.cell_captive_id = cc.id
      WHERE ak.cell_captive_id = $1
      ORDER BY ak.created_at DESC
    `, [id]);
    
    res.json({
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch API keys' }
    });
  } finally {
    client.release();
  }
});

// List all API keys (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { page = 1, limit = 20, search, cell_captive_id, is_active } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const queryParams = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      whereClause += ` AND (ak.key_name ILIKE $${paramCount} OR cc.name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }
    
    if (cell_captive_id) {
      paramCount++;
      whereClause += ` AND ak.cell_captive_id = $${paramCount}`;
      queryParams.push(cell_captive_id);
    }
    
    if (is_active !== undefined) {
      paramCount++;
      whereClause += ` AND ak.is_active = $${paramCount}`;
      queryParams.push(is_active === 'true');
    }
    
    const result = await client.query(`
      SELECT 
        ak.id,
        ak.key_name,
        LEFT(ak.api_key, 12) || '...' as api_key_preview,
        ak.permissions,
        ak.is_active,
        ak.last_used_at,
        ak.expires_at,
        ak.created_at,
        cc.name as cell_captive_name,
        cc.code as cell_captive_code,
        u.first_name || ' ' || u.last_name as created_by_name
      FROM api_keys ak
      JOIN cell_captives cc ON ak.cell_captive_id = cc.id
      LEFT JOIN users u ON ak.created_by = u.id
      WHERE ${whereClause}
      ORDER BY ak.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, [...queryParams, limit, offset]);
    
    // Get total count
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM api_keys ak
      JOIN cell_captives cc ON ak.cell_captive_id = cc.id
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
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch API keys' }
    });
  } finally {
    client.release();
  }
});

// Revoke API key
router.patch('/:id/revoke', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    const result = await client.query(`
      UPDATE api_keys 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, key_name, is_active
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'API key not found' }
      });
    }
    
    const updatedKey = result.rows[0];
    
    // Log audit trail
    await logAuditTrail(client, {
      table_name: 'api_keys',
      record_id: id,
      action: 'UPDATE',
      old_values: { is_active: true },
      new_values: { is_active: false },
      changed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    res.json({
      data: updatedKey,
      message: 'API key revoked successfully'
    });
    
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      error: { message: 'Failed to revoke API key' }
    });
  } finally {
    client.release();
  }
});

// Delete API key
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Get key details before deletion
    const keyResult = await client.query(
      'SELECT * FROM api_keys WHERE id = $1',
      [id]
    );
    
    if (keyResult.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'API key not found' }
      });
    }
    
    const keyData = keyResult.rows[0];
    
    // Delete the key
    await client.query('DELETE FROM api_keys WHERE id = $1', [id]);
    
    // Log audit trail
    await logAuditTrail(client, {
      table_name: 'api_keys',
      record_id: id,
      action: 'DELETE',
      old_values: { ...keyData, api_key: '[REDACTED]' },
      changed_by: req.user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });
    
    res.json({
      message: 'API key deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      error: { message: 'Failed to delete API key' }
    });
  } finally {
    client.release();
  }
});

module.exports = router;