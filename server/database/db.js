import { 
  API, 
  fetchData, 
  user, 
  formatDateTime, 
  initUserSidebar,
  setupLogout,
  createUserElement,
  showError
} from './utils.js';

// التحقق من تسجيل الدخول
if (!user) window.location.href = 'index.html';

// العناصر
const dmBox = document.getElementById('dmBox');
const dmInput = document.getElementById('dmInput');
const dmSendBtn = document.getElementById('dmSendBtn');
const dmContactsList = document.getElementById('dmContactsList');
const recipientName = document.getElementById('recipientName');
const recipientAvatar = document.getElementById('recipientAvatar');
const recipientStatus = document.getElementById('recipientStatus');
const dmSearchInput = document.getElementById('dmSearchInput');
const addContactBtn = document.getElementById('addContactBtn');
const dmRefreshBtn = document.getElementById('dmRefreshBtn');
const dmClearBtn = document.getElementById('dmClearBtn');

let currentReceiver = '';
let allUsers = [];

// تحميل المستخدمين
const loadUsers = async () => {
  try {
    allUsers = await fetchData(API.users);
    const otherUsers = allUsers.filter(u => u !== user);
    
    // تعبئة قائمة جهات الاتصال
    renderContacts(otherUsers);
    
    // إذا كان هناك مستخدم محدد مسبقًا
    const savedReceiver = sessionStorage.getItem('last_receiver');
    if (savedReceiver && otherUsers.includes(savedReceiver)) {
      selectContact(savedReceiver);
    } else if (otherUsers.length > 0) {
      selectContact(otherUsers[0]);
    }
  } catch (error) {
    showError('فشل تحميل المستخدمين: ' + error.message);
  }
};

// عرض جهات الاتصال
const renderContacts = (users) => {
  dmContactsList.innerHTML = '';
  
  users.forEach(username => {
    const contactEl = createUserElement(username);
    contactEl.addEventListener('click', () => {
      selectContact(username);
    });
    
    // إضافة مؤشر الرسائل الجديدة
    const newMsgBadge = document.createElement('div');
    newMsgBadge.className = 'new-message-badge';
    newMsgBadge.textContent = '0';
    newMsgBadge.style.display = 'none';
    contactEl.appendChild(newMsgBadge);
    
    dmContactsList.appendChild(contactEl);
  });
};

// اختيار جهة اتصال
const selectContact = (username) => {
  currentReceiver = username;
  sessionStorage.setItem('last_receiver', username);
  
  // تحديث حالة العنصر النشط
  document.querySelectorAll('.user-item').forEach(item => {
    item.classList.remove('active');
    
    // إخفاء مؤشر الرسائل الجديدة
    const badge = item.querySelector('.new-message-badge');
    if (badge) badge.style.display = 'none';
  });
  
  // تحديد العنصر المحدد
  const selectedContact = document.querySelector(`.user-item[data-username="${username}"]`);
  if (selectedContact) selectedContact.classList.add('active');
  
  // تحديث معلومات المستلم
  recipientName.textContent = username;
  recipientAvatar.textContent = username.charAt(0);
  recipientStatus.textContent = `آخر نشاط: ${new Date().toLocaleDateString('ar-EG')}`;
  
  // تمكين الإدخال
  dmInput.disabled = false;
  dmSendBtn.disabled = false;
  
  // تحميل الرسائل
  loadDMs();
};

// تحميل الرسائل الخاصة
const loadDMs = async () => {
  if (!currentReceiver) return;
  
  try {
    const dms = await fetchData(API.dm(user, currentReceiver));
    
    // إزالة الرسالة الافتراضية إذا كانت موجودة
    const emptyMsg = document.querySelector('.empty-dm');
    if (emptyMsg) emptyMsg.remove();
    
    dmBox.innerHTML = '';
    
    if (dms.length === 0) {
      const noMessages = document.createElement('div');
      noMessages.className = 'system-message';
      noMessages.textContent = 'لا توجد رسائل بعد، ابدأ المحادثة الآن!';
      dmBox.appendChild(noMessages);
      return;
    }
    
    dms.forEach(dm => {
      dmBox.appendChild(renderMessage(dm));
    });
    
    // التمرير لآخر رسالة
    dmBox.scrollTop = dmBox.scrollHeight;
  } catch (error) {
    showError('فشل تحميل الرسائل الخاصة: ' + error.message);
  }
};

// عرض الرسالة
const renderMessage = (msg) => {
  const messageEl = document.createElement('div');
  const isSent = msg.sender === user;
  
  messageEl.className = `message ${isSent ? 'sent' : 'received'}`;
  
  messageEl.innerHTML = `
    <div class="message-header">
      <span class="sender-name">${msg.sender}</span>
      <span class="message-time">${formatDateTime(msg.timestamp)}</span>
    </div>
    <div class="message-content">${msg.content}</div>
  `;
  
  return messageEl;
};

// إرسال رسالة خاصة
const sendDM = async () => {
  const content = dmInput.value.trim();
  if (!content || !currentReceiver) return;
  
  try {
    // إظهار رسالة مؤقتة
    const tempMessage = document.createElement('div');
    tempMessage.className = 'message sent';
    tempMessage.innerHTML = `
      <div class="message-header">
        <span class="sender-name">${user}</span>
        <span class="message-time">الآن</span>
      </div>
      <div class="message-content">${content}</div>
    `;
    dmBox.appendChild(tempMessage);
    dmBox.scrollTop = dmBox.scrollHeight;
    
    // إرسال الرسالة فعلياً
    await fetchData(API.send, {
      method: 'POST',
      body: JSON.stringify({ 
        sender: user, 
        receiver: currentReceiver, 
        content 
      })
    });
    
    dmInput.value = '';
    dmInput.focus();
    
    // إزالة الرسالة المؤقتة وتحميل الرسائل الحقيقية
    tempMessage.remove();
    loadDMs();
  } catch (error) {
    showError('فشل إرسال الرسالة: ' + error.message);
  }
};

// البحث في جهات الاتصال
const searchContacts = () => {
  const searchTerm = dmSearchInput.value.toLowerCase();
  
  document.querySelectorAll('.user-item').forEach(item => {
    const username = item.dataset.username.toLowerCase();
    if (username.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
};

// مسح المحادثة
const clearDMChat = async () => {
  if (!currentReceiver || !confirm('هل تريد مسح جميع الرسائل في هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.')) return;
  
  try {
    // إظهار رسالة تحميل
    dmBox.innerHTML = '<div class="system-message">جاري مسح المحادثة...</div>';
    
    // هنا يجب إضافة دالة في الخادم لمسح الرسائل
    // await fetchData(`/api/clear-dm/${user}/${currentReceiver}`, { method: 'POST' });
    
    // إعادة تحميل الرسائل
    setTimeout(() => {
      loadDMs();
      showError('تم مسح المحادثة بنجاح');
    }, 1000);
  } catch (error) {
    showError('فشل مسح المحادثة: ' + error.message);
  }
};

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
  // تعبئة معلومات المستخدم
  initUserSidebar();
  
  // إعداد تسجيل الخروج
  setupLogout();
  
  // تحميل المستخدمين
  loadUsers();
  
  // أحداث البحث
  dmSearchInput.addEventListener('input', searchContacts);
  
  // أحداث الأزرار
  dmRefreshBtn.addEventListener('click', loadDMs);
  dmClearBtn.addEventListener('click', clearDMChat);
});

// أحداث الأزرار
dmSendBtn.addEventListener('click', sendDM);
dmInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendDM();
});

