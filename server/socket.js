const WebSocket = require('ws');
const { queries } = require('./database/db');

const connectedUsers = new Map();
const lastActiveMap = new Map();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', ws => {
    ws.on('message', message => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'register' && data.user) {
          connectedUsers.set(data.user, ws);
          lastActiveMap.set(data.user, new Date().toISOString());
          broadcastUserStatus(wss);
        }

        if (data.type === 'message') {
          lastActiveMap.set(data.sender, new Date().toISOString());
          broadcast(wss, data);
          if (data.receiver) {
            queries.insertMessage.run(data.sender, data.receiver, data.content);
          } else {
            queries.insertMessage.run(data.sender, null, data.content);
          }
        }

        if (data.type === 'typing') {
          broadcastTyping(wss, data);
        }
      } catch (err) {
        console.error('خطأ في رسالة WebSocket:', err);
      }
    });

    ws.on('close', () => {
      connectedUsers.forEach((value, key) => {
        if (value === ws) {
          connectedUsers.delete(key);
          lastActiveMap.set(key, new Date().toISOString());
          broadcastUserStatus(wss);
        }
      });
    });
  });
}

function broadcast(wss, data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function broadcastTyping(wss, data) {
  const recipientSocket = connectedUsers.get(data.recipient);
  if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
    recipientSocket.send(JSON.stringify(data));
  }
}

function broadcastUserStatus(wss) {
  const statusData = {
    type: 'userStatus',
    onlineUsers: Array.from(connectedUsers.keys()),
  };
  broadcast(wss, statusData);
}

function getUserStatus(username) {
  return {
    status: connectedUsers.has(username) ? 'online' : 'offline',
    lastActive: lastActiveMap.get(username) || null,
  };
}

module.exports = { setupWebSocket, getUserStatus };
