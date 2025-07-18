
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const USERS_PATH = path.resolve(__dirname, '../../data/users.json');

router.post('/login', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'اسم المستخدم مطلوب' });
  }

  try {
    const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    const isValid = users.includes(name);
    
    if (isValid) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'الاسم غير مسموح' });
    }
  } catch (error) {
    console.error('فشل المصادقة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;

