let sqlite3;
if (process.env.NODE_ENV !== 'test') {
  sqlite3 = require('sqlite3').verbose();
}
const path = require('path');

// initialize database connection
let db;
let queries;
if (sqlite3) {
  const dbPath = path.resolve(__dirname, '../../database/nexus.db');
  db = new sqlite3.Database(dbPath);

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
  });

  queries = {
    insertMessage: (sender, receiver, content) =>
      new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO messages (sender, receiver, content) VALUES (?, ?, ?)',
          [sender, receiver, content],
          function (err) {
            if (err) return reject(err);
            resolve(this.lastID);
          }
        );
      }),
    getPublicMessages: {
      all: () =>
        new Promise((resolve, reject) => {
          db.all(
            'SELECT * FROM messages WHERE receiver IS NULL ORDER BY timestamp',
            (err, rows) => {
              if (err) return reject(err);
              resolve(rows);
            }
          );
        }),
      get: () =>
        new Promise((resolve, reject) => {
          db.get(
            'SELECT * FROM messages WHERE receiver IS NULL ORDER BY timestamp DESC LIMIT 1',
            (err, row) => {
              if (err) return reject(err);
              resolve(row);
            }
          );
        }),
    },
    getPrivateMessages: {
      all: (u1, u2, u3, u4) =>
        new Promise((resolve, reject) => {
          db.all(
            `SELECT * FROM messages
             WHERE (sender = ? AND receiver = ?)
                OR (sender = ? AND receiver = ?)
             ORDER BY timestamp`,
            [u1, u2, u3, u4],
            (err, rows) => {
              if (err) return reject(err);
              resolve(rows);
            }
          );
        }),
      get: (u1, u2, u3, u4) =>
        new Promise((resolve, reject) => {
          db.get(
            `SELECT * FROM messages
             WHERE (sender = ? AND receiver = ?)
                OR (sender = ? AND receiver = ?)
             ORDER BY timestamp DESC LIMIT 1`,
            [u1, u2, u3, u4],
            (err, row) => {
              if (err) return reject(err);
              resolve(row);
            }
          );
        }),
    },
  };
} else {
  queries = {
    insertMessage: async () => {},
    getPublicMessages: { all: async () => [], get: async () => null },
    getPrivateMessages: { all: async () => [], get: async () => null },
  };
}

module.exports = { db, queries };
