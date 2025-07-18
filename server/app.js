const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const initDatabase = require('./database/init');
const { setupWebSocket, getUserStatus } = require('./socket');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const messagesRoutes = require('./routes/messages');
const uploadsRoutes = require('./routes/uploads');
const statusRoutes = require('./routes/status');
const featuresRoutes = require('./routes/features');

const app = express();
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل → http://localhost:${PORT}`);
});
module.exports = { app, server };

if (process.env.NODE_ENV !== 'test') {
  initDatabase();
}

app.use(cors());
app.use(compression());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/upload', uploadsRoutes);
statusRoutes.setStatusFn(getUserStatus);
app.use('/api/status', statusRoutes);
app.use('/api/features', featuresRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
});

setupWebSocket(server);
