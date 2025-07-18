const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const uploadsDir = path.resolve(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.post('/', (req, res) => {
  const { data } = req.body;
  if (!data || !data.startsWith('data:image/')) {
    return res.status(400).json({ error: 'تنسيق صورة غير صالح' });
  }

  const matches = data.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ error: 'تنسيق غير صالح' });
  }

  const ext = matches[1].split('/')[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filepath = path.join(uploadsDir, filename);

  fs.writeFile(filepath, buffer, err => {
    if (err) {
      console.error('فشل حفظ الصورة:', err);
      return res.status(500).json({ error: 'خطأ في الخادم' });
    }
    res.json({ url: `/uploads/${filename}` });
  });
});

module.exports = router;
