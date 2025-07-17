const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'premium_collection',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database schema
const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cell captives table
CREATE TABLE IF NOT EXISTS cell_captives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API keys for cell captives
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_captive_id UUID REFERENCES cell_captives(id) ON DELETE CASCADE,
  key_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  permissions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAS systems
CREATE TABLE IF NOT EXISTS pas_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'grail', 'root', 'genesys_skyy', 'owl'
  endpoint_url VARCHAR(500),
  auth_config JSONB,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policies
CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_number VARCHAR(100) UNIQUE NOT NULL,
  cell_captive_id UUID REFERENCES cell_captives(id),
  pas_system_id UUID REFERENCES pas_systems(id),
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  premium_amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'quarterly', 'annually'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'lapsed', 'cancelled'
  mandate_reference VARCHAR(100),
  bank_account_number VARCHAR(50),
  bank_branch_code VARCHAR(20),
  bank_account_type VARCHAR(20) DEFAULT 'current',
  next_collection_date DATE,
  grace_period_days INTEGER DEFAULT 7,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_reference VARCHAR(100) UNIQUE NOT NULL,
  policy_id UUID REFERENCES policies(id),
  cell_captive_id UUID REFERENCES cell_captives(id),
  collection_type VARCHAR(20) NOT NULL, -- 'recurring', 'adhoc'
  amount DECIMAL(12,2) NOT NULL,
  collection_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'submitted', 'successful', 'failed', 'cancelled'
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 2,
  investec_reference VARCHAR(100),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Debit order files
CREATE TABLE IF NOT EXISTS debit_order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  file_type VARCHAR(20) DEFAULT 'csv', -- 'csv', 'aba'
  total_amount DECIMAL(12,2),
  total_records INTEGER,
  status VARCHAR(50) DEFAULT 'generated', -- 'generated', 'submitted', 'processed', 'failed'
  submission_reference VARCHAR(100),
  submitted_at TIMESTAMP,
  processed_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Debit order file items
CREATE TABLE IF NOT EXISTS debit_order_file_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES debit_order_files(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id),
  line_number INTEGER,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'successful', 'failed'
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation records
CREATE TABLE IF NOT EXISTS reconciliation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id),
  investec_reference VARCHAR(100),
  bank_reference VARCHAR(100),
  amount DECIMAL(12,2),
  transaction_date DATE,
  status VARCHAR(50), -- 'matched', 'unmatched', 'disputed'
  reconciled_by UUID REFERENCES users(id),
  reconciled_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_captive_id UUID REFERENCES cell_captives(id),
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  headers JSONB,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_policies_cell_captive_id ON policies(cell_captive_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_collections_policy_id ON collections(policy_id);
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_collection_date ON collections(collection_date);
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_cell_captive_id ON api_keys(cell_captive_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_table_record ON audit_trail(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_cell_captive_id ON webhook_logs(cell_captive_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cell_captives_updated_at BEFORE UPDATE ON cell_captives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pas_systems_updated_at BEFORE UPDATE ON pas_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debit_order_files_updated_at BEFORE UPDATE ON debit_order_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debit_order_file_items_updated_at BEFORE UPDATE ON debit_order_file_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reconciliation_records_updated_at BEFORE UPDATE ON reconciliation_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function initializeDatabase() {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('📊 Connected to PostgreSQL database');
    
    // Execute schema
    await client.query(schema);
    console.log('📋 Database schema initialized');
    
    // Insert default data
    await insertDefaultData(client);
    
    client.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function insertDefaultData(client) {
  try {
    // Insert default admin user
    const adminExists = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@premiumcollection.com']
    );
    
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin@premiumcollection.com', hashedPassword, 'System', 'Administrator', 'admin']);
      
      console.log('👤 Default admin user created');
    }
    
    // Insert default PAS systems
    const pasSystemsData = [
      { name: 'Grail PAS', type: 'grail', endpoint_url: 'https://api.grail.com/v1' },
      { name: 'Root PAS', type: 'root', endpoint_url: 'https://api.root.co.za/v1' },
      { name: 'Genesys Skyy', type: 'genesys_skyy', endpoint_url: 'https://api.genesys-skyy.com/v1' },
      { name: 'Owl PAS', type: 'owl', endpoint_url: 'https://api.owl.co.za/v1' }
    ];
    
    for (const pas of pasSystemsData) {
      const exists = await client.query(
        'SELECT id FROM pas_systems WHERE type = $1',
        [pas.type]
      );
      
      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO pas_systems (name, type, endpoint_url, auth_config)
          VALUES ($1, $2, $3, $4)
        `, [pas.name, pas.type, pas.endpoint_url, JSON.stringify({})]);
      }
    }
    
    console.log('🔗 Default PAS systems initialized');
    
    // Insert sample cell captives
    const cellCaptivesData = [
      { name: 'Alpha Insurance Cell', code: 'ALPHA001', contact_email: 'admin@alpha-insurance.com' },
      { name: 'Beta Life Cell', code: 'BETA002', contact_email: 'admin@beta-life.com' },
      { name: 'Gamma Health Cell', code: 'GAMMA003', contact_email: 'admin@gamma-health.com' }
    ];
    
    for (const cell of cellCaptivesData) {
      const exists = await client.query(
        'SELECT id FROM cell_captives WHERE code = $1',
        [cell.code]
      );
      
      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO cell_captives (name, code, contact_email)
          VALUES ($1, $2, $3)
        `, [cell.name, cell.code, cell.contact_email]);
      }
    }
    
    console.log('🏢 Sample cell captives created');
    
  } catch (error) {
    console.error('❌ Failed to insert default data:', error);
    throw error;
  }
}

module.exports = {
  pool,
  initializeDatabase
};