const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
let Database;
if (process.env.NODE_ENV !== 'test') {
  Database = require('better-sqlite3');
}
const fs = require('fs');
const compression = require('compression');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل → http://localhost:${PORT}`);
});

module.exports = { app, server };

// إنشاء خادم WebSocket
const wss = new WebSocket.Server({ server });

// تتبع المستخدمين المتصلين
const connectedUsers = new Map();

wss.on('connection', (ws) => {
  console.log('اتصال جديد بـ WebSocket');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // ربط المستخدم بـ WebSocket
      if (data.type === 'register' && data.user) {
        connectedUsers.set(data.user, ws);
        broadcastUserStatus();
        console.log(`المستخدم ${data.user} متصل الآن`);
      }
      
      // إعادة إرسال الرسالة لجميع العملاء
      if (data.type === 'message') {
        broadcast(data);
      }
      
      // تخزين الرسالة في قاعدة البيانات
      if (data.type === 'message' && !data.receiver) {
        storeMessage(data);
      }
      
      // تخزين الرسائل الخاصة
      if (data.type === 'message' && data.receiver) {
        storePrivateMessage(data);
      }
      
      // تحديث حالة الكتابة
      if (data.type === 'typing') {
        broadcastTyping(data);
      }
    } catch (error) {
      console.error('خطأ في معالجة رسالة WebSocket:', error);
    }
  });

  ws.on('close', () => {
    // إزالة المستخدم عند انقطاع الاتصال
    connectedUsers.forEach((value, key) => {
      if (value === ws) {
        connectedUsers.delete(key);
        broadcastUserStatus();
        console.log(`المستخدم ${key} انقطع عن الاتصال`);
      }
    });
  });
});

// بث الرسائل لجميع المستخدمين
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// بث حالة الكتابة للمستلم فقط
function broadcastTyping(data) {
  const recipientSocket = connectedUsers.get(data.recipient);
  if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
    recipientSocket.send(JSON.stringify(data));
  }
}

// بث حالة المستخدمين لجميع العملاء
function broadcastUserStatus() {
  const onlineUsers = Array.from(connectedUsers.keys());
  const statusData = {
    type: 'userStatus',
    onlineUsers
  };
  broadcast(statusData);
}

// تخزين الرسالة العامة
function storeMessage(data) {
  const dbPath = path.join(__dirname, '..', 'database', 'nexus.db');
  const db = new Database(dbPath);
  
  try {
    db.prepare(`
      INSERT INTO messages (sender, content)
      VALUES (?, ?)
    `).run(data.sender, data.content);
  } catch (error) {
    console.error('فشل تخزين الرسالة العامة:', error);
  }
}

// تخزين الرسالة الخاصة
function storePrivateMessage(data) {
  const dbPath = path.join(__dirname, '..', 'database', 'nexus.db');
  const db = new Database(dbPath);
  
  try {
    db.prepare(`
      INSERT INTO messages (sender, receiver, content)
      VALUES (?, ?, ?)
    `).run(data.sender, data.receiver, data.content);
  } catch (error) {
    console.error('فشل تخزين الرسالة الخاصة:', error);
  }
}

// Middleware
app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// قاعدة البيانات (يتم تخطيها في بيئة الاختبار)
let db;
if (Database) {
  const dbPath = path.join(__dirname, '..', 'database', 'nexus.db');
  db = new Database(dbPath);

  // إنشاء الجداول
  db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      receiver TEXT,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

// جلب المستخدمين من ملف JSON
const getUsers = () => {
  try {
    const usersPath = path.join(__dirname, '..', 'data', 'users.json');
    return JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  } catch (error) {
    console.error('فشل تحميل المستخدمين:', error);
    return [];
  }
};

// مسارات API
app.get('/api/users', (req, res) => {
  res.json(getUsers());
});

app.post('/api/login', (req, res) => {
  const { name } = req.body;
  const users = getUsers();
  res.json({ success: users.includes(name) });
});

app.post('/api/send', (req, res) => {
  const { sender, receiver, content } = req.body;
  
  if (!sender || !content) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }

  try {
    const stmt = db.prepare(`INSERT INTO messages (sender, receiver, content) VALUES (?, ?, ?)`);
    const info = stmt.run(sender, receiver || null, content);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    console.error('فشل إرسال الرسالة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

app.get('/api/messages/public', (req, res) => {
  try {
    const messages = db.prepare(`SELECT * FROM messages WHERE receiver IS NULL ORDER BY timestamp DESC`).all();
    res.json(messages);
  } catch (error) {
    console.error('فشل تحميل الرسائل العامة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

app.get('/api/messages/dm/:user1/:user2', (req, res) => {
  const { user1, user2 } = req.params;
  
  try {
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE (sender = ? AND receiver = ?) 
      OR (sender = ? AND receiver = ?) 
      ORDER BY timestamp
    `).all(user1, user2, user2, user1);
    
    res.json(messages);
  } catch (error) {
    console.error('فشل تحميل الرسائل الخاصة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// مسار جديد لتحقق من حالة المستخدم
app.get('/api/status/:username', (req, res) => {
  const { username } = req.params;
  const isOnline = connectedUsers.has(username);
  
  res.json({ 
    status: isOnline ? 'online' : 'offline',
    lastActive: new Date().toISOString()
  });
});

// الملفات الثابتة
app.use(express.static(path.join(__dirname, '..', 'public')));

// الصفحات غير الموجودة
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
});
