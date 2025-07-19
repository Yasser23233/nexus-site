const express = require('express');
const { queries } = require('../database/db');
const router = express.Router();

// إرسال رسالة
router.post('/send', async (req, res) => {
  const { sender, receiver, content } = req.body;
  
  if (!sender || !content) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }

  try {
    await queries.insertMessage(sender, receiver || null, content);

    // الحصول على الرسالة المضافة حديثاً
    const newMessage = receiver ?
      await queries.getPrivateMessages.get(sender, receiver, receiver, sender) :
      await queries.getPublicMessages.get();
    
    res.json({ 
      success: true,
      message: {
        ...newMessage,
        // إضافة حالة تسليم افتراضية
        status: 'sent'
      }
    });
  } catch (error) {
    console.error('فشل إرسال الرسالة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// جلب الرسائل العامة
router.get('/public', async (req, res) => {
  try {
    const messages = await queries.getPublicMessages.all();
    res.json(messages);
  } catch (error) {
    console.error('فشل تحميل الرسائل العامة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// جلب الرسائل الخاصة
router.get('/dm/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;

  try {
    const messages = await queries.getPrivateMessages.all(user1, user2, user2, user1);
    res.json(messages);
  } catch (error) {
    console.error('فشل تحميل الرسائل الخاصة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// تحديث حالة الرسالة (وصلت/شوهدت)
router.put('/status/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!id || !status) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }
  
  try {
    // في تطبيق حقيقي، سنقوم بتحديث حالة الرسالة في قاعدة البيانات
    // هنا سنقوم بمحاكاة العملية فقط
    res.json({ 
      success: true,
      message: `تم تحديث حالة الرسالة ${id} إلى ${status}`
    });
  } catch (error) {
    console.error('فشل تحديث حالة الرسالة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// مسح الرسائل العامة
router.delete('/public', (req, res) => {
  try {
    // في تطبيق حقيقي، سنقوم بحذف الرسائل
    // هنا سنقوم بمحاكاة العملية فقط
    res.json({ 
      success: true,
      message: 'تم مسح جميع الرسائل العامة'
    });
  } catch (error) {
    console.error('فشل مسح الرسائل العامة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// مسح الرسائل الخاصة
router.delete('/dm/:user1/:user2', (req, res) => {
  const { user1, user2 } = req.params;
  
  try {
    // في تطبيق حقيقي، سنقوم بحذف المحادثة بين المستخدمين
    // هنا سنقوم بمحاكاة العملية فقط
    res.json({ 
      success: true,
      message: `تم مسح محادثة ${user1} و ${user2}`
    });
  } catch (error) {
    console.error('فشل مسح الرسائل الخاصة:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

module.exports = router;
