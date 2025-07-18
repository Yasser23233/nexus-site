const Database = require('better-sqlite3');
const path = require('path');

// initialize database connection
const dbPath = path.resolve(__dirname, '../../database/nexus.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// ensure table exists
const init = db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    receiver TEXT,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
init.run();

// prepared statements used throughout the application
const queries = {
  insertMessage: db.prepare(
    'INSERT INTO messages (sender, receiver, content) VALUES (?, ?, ?)'
  ),
  getPublicMessages: {
    all: db.prepare(
      'SELECT * FROM messages WHERE receiver IS NULL ORDER BY timestamp'
    ),
    get: db.prepare(
      'SELECT * FROM messages WHERE receiver IS NULL ORDER BY timestamp DESC LIMIT 1'
    ),
  },
  getPrivateMessages: {
    all: db.prepare(
      `SELECT * FROM messages
       WHERE (sender = ? AND receiver = ?)
          OR (sender = ? AND receiver = ?)
       ORDER BY timestamp`
    ),
    get: db.prepare(
      `SELECT * FROM messages
       WHERE (sender = ? AND receiver = ?)
          OR (sender = ? AND receiver = ?)
       ORDER BY timestamp DESC LIMIT 1`
    ),
  },
};

module.exports = { db, queries };
