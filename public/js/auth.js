import { API, fetchData, showError } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const select = document.getElementById('username');
  const btn = document.getElementById('loginBtn');
  const error = document.getElementById('error');
  const spinner = document.getElementById('loginSpinner');
  
  try {
    // جلب المستخدمين
    const users = await fetchData(API.users);
    
    // تعبئة القائمة المنسدلة
    select.innerHTML = `
      <option disabled selected value="">-- اختر اسمك --</option>
      ${users.map(user => `<option value="${user}">${user}</option>`).join('')}
    `;
  } catch (error) {
    showError(error, 'فشل تحميل الأعضاء');
  }
  
  // حدث الضغط على زر الدخول
  btn.addEventListener('click', async () => {
    const name = select.value;
    if (!name) {
      showError(error, 'يرجى اختيار اسمك');
      return;
    }
    
    try {
      // إظهار مؤشر التحميل
      spinner.style.display = 'block';
      btn.disabled = true;
      
      // محاولة تسجيل الدخول
      const response = await fetchData(API.login, {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      
      if (response.success) {
        // تخزين اسم المستخدم والانتقال للشات
        sessionStorage.setItem('nexus_user', name);
        
        // تأثير الانتقال
        document.querySelector('.login-box').style.animation = 'fadeOut 0.5s forwards';
        setTimeout(() => {
          window.location.href = 'chat.html';
        }, 500);
      } else {
        showError(error, 'الاسم غير مسموح');
      }
    } catch (error) {
      showError(error, 'خطأ في الاتصال بالخادم');
    } finally {
      // إخفاء مؤشر التحميل
      spinner.style.display = 'none';
      btn.disabled = false;
    }
  });
  
  // تأثير كتابة المحاكاة في الخلفية
  simulateTerminalEffect();
});

// تأثير محاكاة طرفية الكتابة
function simulateTerminalEffect() {
  const texts = [
    "جاري تهيئة النظام...",
    "تحميل وحدات الأمان...",
    "ربط بخوادم Nexus...",
    "تهيئة واجهة المستخدم..."
  ];
  
  const effectEl = document.querySelector('.terminal-effect');
  if (!effectEl) return;
  let currentTextIndex = 0;
  let currentCharIndex = 0;
  let isDeleting = false;
  
  function type() {
    const currentText = texts[currentTextIndex];
    
    if (isDeleting) {
      // حالة الحذف
      effectEl.textContent = currentText.substring(0, currentCharIndex - 1);
      currentCharIndex--;
      
      if (currentCharIndex === 0) {
        isDeleting = false;
        currentTextIndex = (currentTextIndex + 1) % texts.length;
      }
    } else {
      // حالة الكتابة
      effectEl.textContent = currentText.substring(0, currentCharIndex + 1);
      currentCharIndex++;
      
      if (currentCharIndex === currentText.length) {
        isDeleting = true;
      }
    }
    
    setTimeout(type, isDeleting ? 50 : 100);
  }
  
  // بدء تأثير الكتابة
  setTimeout(type, 1000);
}

// تأثير توهج عند تحميل الصفحة
window.addEventListener('load', () => {
  const loginBox = document.querySelector('.login-box');
  loginBox.style.animation = 'glowEntry 1.5s forwards';
  
  // إضافة رسوم متحركة جديدة
  const style = document.createElement('style');
  style.textContent = `
    @keyframes glowEntry {
      0% {
        opacity: 0;
        transform: translateY(20px);
        box-shadow: 0 0 0 rgba(79, 195, 247, 0);
      }
      50% {
        box-shadow: 0 0 30px rgba(79, 195, 247, 0.5);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      }
    }
    
    @keyframes fadeOut {
      to {
        opacity: 0;
        transform: translateY(-20px);
      }
    }
  `;
  document.head.appendChild(style);
});
