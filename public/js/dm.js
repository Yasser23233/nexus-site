import { 
  API, 
  fetchData, 
  user, 
  formatDateTime, 
  initUserSidebar,
  setupLogout,
  createUserElement,
  showError,
  checkUserStatus,
  connectWebSocket,
  sendSocketMessage,
  sendTypingStatus,
  setupSidebarToggle,
  setupThemeToggle,
  uploadImage
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
const dmImageInput = document.getElementById('dmImageInput');
const attachmentIcon = document.querySelector('.attachment-icon');
const emojiIcon = document.querySelector('.emoji-icon');
const emojiPicker = document.getElementById('emojiPicker');

let currentReceiver = '';
let allUsers = [];
let isTyping = false;
let typingTimeout;

// تحميل المستخدمين
const loadUsers = async () => {
  try {
    allUsers = await fetchData(API.users);
    const otherUsers = allUsers.filter(u => u !== user);
    
    renderContacts(otherUsers);
    
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
    
    const newMsgBadge = document.createElement('div');
    newMsgBadge.className = 'new-message-badge';
    newMsgBadge.textContent = '0';
    newMsgBadge.style.display = 'none';
    contactEl.appendChild(newMsgBadge);
    
    const statusElement = document.createElement('span');
    statusElement.className = 'user-status-indicator status-offline';
    statusElement.title = 'غير متصل';
    contactEl.querySelector('.username').appendChild(statusElement);
    
    dmContactsList.appendChild(contactEl);
  });
};

// اختيار جهة اتصال
const selectContact = (username) => {
  currentReceiver = username;
  sessionStorage.setItem('last_receiver', username);
  
  document.querySelectorAll('.user-item').forEach(item => {
    item.classList.remove('active');
    
    const badge = item.querySelector('.new-message-badge');
    if (badge) badge.style.display = 'none';
  });
  
  const selectedContact = document.querySelector(`.user-item[data-username="${username}"]`);
  if (selectedContact) selectedContact.classList.add('active');
  
  recipientName.textContent = username;
  recipientAvatar.textContent = username.charAt(0);
  
  dmInput.disabled = false;
  dmSendBtn.disabled = false;
  
  loadDMs();
};

// تحميل الرسائل الخاصة
const loadDMs = async () => {
  if (!currentReceiver) return;
  
  try {
    const dms = await fetchData(API.dm(user, currentReceiver));
    renderDMs(dms);
  } catch (error) {
    showError('فشل تحميل الرسائل الخاصة: ' + error.message);
  }
};

// عرض الرسائل الخاصة
const renderDMs = (messages) => {
  const emptyMsg = document.querySelector('.empty-dm');
  if (emptyMsg) emptyMsg.remove();
  
  dmBox.innerHTML = '';
  
  if (messages.length === 0) {
    const noMessages = document.createElement('div');
    noMessages.className = 'system-message';
    noMessages.textContent = 'لا توجد رسائل بعد، ابدأ المحادثة الآن!';
    dmBox.appendChild(noMessages);
    return;
  }
  
  messages.forEach(dm => {
    dmBox.appendChild(renderMessage(dm));
  });
  
  dmBox.scrollTop = dmBox.scrollHeight;
};

// إرسال رسالة خاصة
const sendDM = async (customContent) => {
  const content = customContent || dmInput.value.trim();
  if (!content || !currentReceiver) return;

  let tempMessage;
  try {
    tempMessage = renderMessage({
      sender: user,
      content: content,
      timestamp: new Date().toISOString(),
      status: 'sending',
      receiver: currentReceiver
    });
    dmBox.appendChild(tempMessage);
    dmBox.scrollTop = dmBox.scrollHeight;
    
    sendSocketMessage({
      type: 'message',
      sender: user,
      receiver: currentReceiver,
      content: content,
      timestamp: new Date().toISOString()
    });
    
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
  } catch (error) {
    showError('فشل إرسال الرسالة: ' + error.message);
    if (tempMessage) {
      const statusEl = tempMessage.querySelector('.message-status');
      if (statusEl) {
        statusEl.innerHTML = '<i class="fas fa-times"></i> فشل الإرسال';
      }
    }
  }
};

// عرض الرسالة
const renderMessage = (msg) => {
  const messageEl = document.createElement('div');
  const isSent = msg.sender === user;
  
  messageEl.className = `message ${isSent ? 'sent' : 'received'}`;
  
  let statusHtml = '';
  if (isSent) {
    if (msg.status === 'sending') {
      statusHtml = '<div class="message-status"><i class="fas fa-sync fa-spin"></i> جاري الإرسال</div>';
    } else {
      statusHtml = '<div class="message-status"><i class="fas fa-check"></i> تم الإرسال</div>';
    }
  }
  
  messageEl.innerHTML = `
    <div class="message-header">
      <span class="sender-name">${msg.sender}</span>
      <span class="message-time">${formatDateTime(msg.timestamp)}</span>
    </div>
    <div class="message-content">${msg.content}</div>
    ${statusHtml}
  `;
  
  return messageEl;
};

// تحديث حالة المستلم
const updateRecipientStatus = (isOnline) => {
  recipientStatus.textContent = isOnline ? 'نشط الآن' : 'غير متصل';
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
    dmBox.innerHTML = '<div class="system-message">جاري مسح المحادثة...</div>';
    
    setTimeout(() => {
      loadDMs();
      showError('تم مسح المحادثة بنجاح');
    }, 1000);
  } catch (error) {
    showError('فشل مسح المحادثة: ' + error.message);
  }
};

// إدارة مؤشر الكتابة
const handleTyping = () => {
  if (!isTyping) {
    isTyping = true;
    sendTypingStatus(true, currentReceiver);
  }
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    isTyping = false;
    sendTypingStatus(false, currentReceiver);
  }, 1000);
};

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
  initUserSidebar();
  setupLogout();
  setupSidebarToggle();
  setupThemeToggle();
  loadUsers();
  
  dmSearchInput.addEventListener('input', searchContacts);
  dmRefreshBtn.addEventListener('click', loadDMs);
  dmClearBtn.addEventListener('click', clearDMChat);
  
  connectWebSocket();
  
  // استقبال الرسائل الجديدة
  window.addEventListener('newMessage', (event) => {
    const message = event.detail;
    
    if ((message.receiver === user && message.sender === currentReceiver) || 
        (message.sender === user && message.receiver === currentReceiver)) {
      const newMessage = renderMessage({
        ...message,
        status: 'delivered'
      });
      dmBox.appendChild(newMessage);
      dmBox.scrollTop = dmBox.scrollHeight;
    }
  });
  
  // تحديث حالة المستخدمين
  window.addEventListener('userStatusUpdate', (event) => {
    const onlineUsers = event.detail;
    
    if (currentReceiver) {
      updateRecipientStatus(onlineUsers.includes(currentReceiver));
    }
    
    document.querySelectorAll('.user-item').forEach(item => {
      const username = item.dataset.username;
      const statusElement = item.querySelector('.user-status-indicator');
      
      if (statusElement) {
        statusElement.className = 'user-status-indicator';
        
        if (onlineUsers.includes(username)) {
          statusElement.classList.add('status-online');
          statusElement.title = 'نشط الآن';
        } else {
          statusElement.classList.add('status-offline');
          statusElement.title = 'غير متصل';
        }
      }
    });
  });
  
  // استقبال إشعارات الكتابة
  window.addEventListener('userTyping', (event) => {
    const typingData = event.detail;
    
    if (typingData.recipient === user && typingData.sender === currentReceiver) {
      const typingIndicator = document.getElementById('typingIndicator');
      
      if (typingData.isTyping) {
        if (!typingIndicator) {
          const indicator = document.createElement('div');
          indicator.id = 'typingIndicator';
          indicator.className = 'typing-indicator';
          indicator.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
            <span>يكتب الآن...</span>
          `;
          dmBox.appendChild(indicator);
          dmBox.scrollTop = dmBox.scrollHeight;
        }
      } else if (typingIndicator) {
        typingIndicator.remove();
      }
    }
  });
  
  // إدارة حالة الكتابة
  dmInput.addEventListener('input', () => {
    if (dmInput.value.trim() !== '' && currentReceiver) {
      handleTyping();
    }
  });

  attachmentIcon.addEventListener('click', () => dmImageInput.click());
  dmImageInput.addEventListener('change', async () => {
    const file = dmImageInput.files[0];
    if (!file) return;
    try {
      const { url } = await uploadImage(file);
      sendDM(`<img src="${url}" class="chat-image">`);
    } catch (err) {
      showError('فشل رفع الصورة');
    }
  });

  emojiIcon.addEventListener('click', () => {
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
  });
  emojiPicker.addEventListener('emoji-click', (e) => {
    dmInput.value += e.detail.unicode;
  });
});

// أحداث الأزرار
dmSendBtn.addEventListener('click', sendDM);
dmInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendDM();
});
