# Nexus Site

This project includes a small test suite using Jest.

## Features

The `/api/features` endpoint returns more than ten built‑in features of the site:

- تسجيل الدخول الآمن
- الدردشة العامة
- الرسائل الخاصة
- إرسال الصور
- تحديث حالة المستخدم
- دعم الإيموجي
- اختيار السمة
- اتصال فوري عبر WebSocket
- إدارة جهات الاتصال
- بحث في الرسائل
- الحظر والإبلاغ
- الإشعارات الفورية

## Running tests

Install dependencies with `npm install` and run `npm test` to execute the Jest tests. These tests start the Express app from `server/app.js` using SuperTest.
