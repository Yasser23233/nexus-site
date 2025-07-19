const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const initDatabase = () => {
  const dbPath = path.resolve(__dirname, '../../database/nexus.db');
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT NOT NULL,
        receiver TEXT,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // إنشاء فهارس لتحسين الأداء
    db.run('CREATE INDEX IF NOT EXISTS idx_sender ON messages (sender)');
    db.run('CREATE INDEX IF NOT EXISTS idx_receiver ON messages (receiver)');
  });

  return db;
};

module.exports = initDatabase;

