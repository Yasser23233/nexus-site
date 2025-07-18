const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const FEATURES_PATH = path.resolve(__dirname, '../../data/features.json');

router.get('/', (req, res) => {
  try {
    const features = JSON.parse(fs.readFileSync(FEATURES_PATH, 'utf8'));
    res.json(features);
  } catch (error) {
    console.error('فشل تحميل المزايا:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
