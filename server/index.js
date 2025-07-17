const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const collectionsRoutes = require('./routes/collections');
const debitOrdersRoutes = require('./routes/debitOrders');
const pasIntegrationsRoutes = require('./routes/pasIntegrations');
const reconciliationRoutes = require('./routes/reconciliation');
const apiKeysRoutes = require('./routes/apiKeys');
const cellCaptivesRoutes = require('./routes/cellCaptives');
const cellCaptiveApiRoutes = require('./routes/cellCaptiveApi');
const webhooksRoutes = require('./routes/webhooks');

const { initializeDatabase } = require('./database/init');
const { setupWebSocketServer } = require('./websocket/server');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/debit-orders', debitOrdersRoutes);
app.use('/api/pas-integrations', pasIntegrationsRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/keys', apiKeysRoutes);
app.use('/api/cell-captives', cellCaptivesRoutes);
app.use('/api/captive', cellCaptiveApiRoutes);
app.use('/api/webhooks', webhooksRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database (skip for demo)
    try {
      await initializeDatabase();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.log('⚠️ Database not available, running in demo mode');
    }

    // Setup WebSocket server
    setupWebSocketServer(server);
    console.log('✅ WebSocket server initialized');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 API Documentation: See CELL_CAPTIVE_API.md`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server };