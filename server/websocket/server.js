const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

let wss = null;
const clients = new Map();

function setupWebSocketServer(server) {
  wss = new WebSocket.Server({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    
    // Handle authentication
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth') {
          const token = data.token;
          
          if (!token) {
            ws.send(JSON.stringify({
              type: 'auth_error',
              message: 'Token required'
            }));
            return;
          }
          
          jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
              ws.send(JSON.stringify({
                type: 'auth_error',
                message: 'Invalid token'
              }));
              return;
            }
            
            // Store authenticated client
            clients.set(ws, {
              userId: decoded.userId,
              email: decoded.email,
              role: decoded.role,
              connectedAt: new Date()
            });
            
            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'Authenticated successfully'
            }));
            
            console.log(`User ${decoded.email} connected via WebSocket`);
          });
        } else if (data.type === 'subscribe') {
          const client = clients.get(ws);
          if (!client) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Authentication required'
            }));
            return;
          }
          
          // Handle subscription to specific channels
          client.subscriptions = client.subscriptions || [];
          if (data.channel && !client.subscriptions.includes(data.channel)) {
            client.subscriptions.push(data.channel);
            
            ws.send(JSON.stringify({
              type: 'subscribed',
              channel: data.channel
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        console.log(`User ${client.email} disconnected from WebSocket`);
        clients.delete(ws);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
    
    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connection established'
    }));
  });
  
  console.log('✅ WebSocket server setup complete');
}

function broadcastUpdate(type, data, channel = null) {
  if (!wss) return;
  
  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  });
  
  clients.forEach((client, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      // If channel specified, only send to subscribed clients
      if (channel && client.subscriptions && !client.subscriptions.includes(channel)) {
        return;
      }
      
      try {
        ws.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        clients.delete(ws);
      }
    }
  });
}

function getConnectedClients() {
  return Array.from(clients.values()).map(client => ({
    userId: client.userId,
    email: client.email,
    role: client.role,
    connectedAt: client.connectedAt,
    subscriptions: client.subscriptions || []
  }));
}

module.exports = {
  setupWebSocketServer,
  broadcastUpdate,
  getConnectedClients
};