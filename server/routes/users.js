const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const USERS_PATH = path.resolve(__dirname, '../../data/users.json');

router.get('/', (req, res) => {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    res.json(users);
  } catch (error) {
    console.error('فشل تحميل المستخدمين:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;



