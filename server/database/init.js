const Database = require('better-sqlite3');
const path = require('path');

const initDatabase = () => {
  const dbPath = path.resolve(__dirname, '../../database/nexus.db');
  const db = new Database(dbPath);
  
  db.pragma('journal_mode = WAL');
  
  const createTable = db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      receiver TEXT,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  createTable.run();
  
  // إنشاء فهارس لتحسين الأداء
  db.prepare('CREATE INDEX IF NOT EXISTS idx_sender ON messages (sender)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_receiver ON messages (receiver)').run();
  
  return db;
};

module.exports = initDatabase;

