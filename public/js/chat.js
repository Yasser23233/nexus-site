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
  uploadImage
} from './utils.js';

// التحقق من تسجيل الدخول
if (!user) window.location.href = 'index.html';

// العناصر
const chatBox = document.getElementById('chatBox');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const allUsersList = document.getElementById('allUsersList');
const clearBtn = document.getElementById('clearBtn');
if (user !== 'ياسر' && clearBtn) {
  clearBtn.style.display = 'none';
}
const messageCount = document.getElementById('messageCount');
const imageInput = document.getElementById('imageInput');
const attachmentIcon = document.querySelector('.attachment-icon');
const emojiIcon = document.querySelector('.emoji-icon');
const emojiPicker = document.getElementById('emojiPicker');

let pendingMessage = null;
let allUsers = [];
let onlineUsersCurrent = [];

// تحميل الرسائل العامة
const loadMessages = async () => {
  try {
    const messages = await fetchData(API.public);
    renderMessages(messages);
  } catch (error) {
    showError('فشل تحميل الرسائل: ' + error.message);
  }
};

// عرض الرسائل
const renderMessages = (messages) => {
  const welcomeMsg = document.querySelector('.welcome-message');
  if (welcomeMsg) welcomeMsg.remove();
  
  chatBox.innerHTML = '';
  
  if (messages.length === 0) {
    const noMessages = document.createElement('div');
    noMessages.className = 'system-message';
    noMessages.textContent = 'لا توجد رسائل بعد، كن أول من يبدأ المحادثة!';
    chatBox.appendChild(noMessages);
    return;
  }
  
  messages.forEach(msg => {
    chatBox.appendChild(renderMessage(msg));
  });
  
  chatBox.scrollTop = chatBox.scrollHeight;
  messageCount.textContent = `${messages.length} رسالة`;
};

// إرسال رسالة
const sendMessage = async (customContent) => {
  const content = customContent || msgInput.value.trim();
  if (!content) return;

  try {
    const tempMessage = renderMessage({
      sender: user,
      content: content,
      timestamp: new Date().toISOString(),
      status: 'sending'
    });
    pendingMessage = tempMessage;
    chatBox.appendChild(tempMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    sendSocketMessage({
      type: 'message',
      sender: user,
      content: content,
      timestamp: new Date().toISOString()
    });
    
    msgInput.value = '';
    msgInput.focus();
  } catch (error) {
    showError('فشل إرسال الرسالة: ' + error.message);
    if (pendingMessage) {
      const statusEl = pendingMessage.querySelector('.message-status');
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
    <div class="message-content">${
      typeof msg.content === 'object' ? JSON.stringify(msg.content) : msg.content
    }</div>
    ${statusHtml}
  `;
  
  return messageEl;
};

// تحديث حالة المستخدمين
const renderOnlineUsers = () => {
  allUsersList.innerHTML = '';
  onlineUsersCurrent
    .filter(username => username !== user)
    .forEach(username => {
      const userElement = createUserElement(username);
      const statusElement = document.createElement('span');
      statusElement.className = 'user-status-indicator status-online';
      statusElement.title = 'نشط الآن';
      userElement.querySelector('.username').appendChild(statusElement);
      allUsersList.appendChild(userElement);
    });
};

const updateUserStatuses = (onlineUsers) => {
  onlineUsersCurrent = allUsers.filter(u => onlineUsers.includes(u) && u !== user);
  renderOnlineUsers();
};

const playNotification = async () => {
  const settings = JSON.parse(localStorage.getItem('nexus_settings') || '{}');
  if (settings.sound === false) return;

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume();
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 440;
    oscillator.connect(ctx.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      ctx.close();
    }, 150);
  } catch (e) {
    console.error('Failed to play sound', e);
  }
};

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
  initUserSidebar();
  setupLogout();
  setupSidebarToggle();
  loadMessages();
  loadUsers();

  setInterval(() => {
    loadMessages();
  }, 15000);

  clearBtn.addEventListener('click', clearChat);
  
  connectWebSocket();
  
  // استقبال الرسائل الجديدة
  window.addEventListener('newMessage', (event) => {
    const message = event.detail;
    if (message.receiver) return;

    const newMessage = renderMessage({
      ...message,
      status: 'delivered'
    });
    if (document.hidden) {
      newMessage.classList.add('new-message');
    }
    if (pendingMessage) {
      pendingMessage.remove();
      pendingMessage = null;
    }
    playNotification();
    chatBox.appendChild(newMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    const currentCount = parseInt(messageCount.textContent) || 0;
    messageCount.textContent = `${currentCount + 1} رسالة`;
  });
  
  // تحديث حالة المستخدمين
  window.addEventListener('userStatusUpdate', (event) => {
    updateUserStatuses(event.detail);
  });
  
  // إدارة حالة الكتابة
  msgInput.addEventListener('input', () => {
    if (msgInput.value.trim() !== '') {
      sendTypingStatus(true, 'public');
    } else {
      sendTypingStatus(false, 'public');
    }
  });

  attachmentIcon.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (!file) return;
    try {
      const { url } = await uploadImage(file);
      sendMessage(`<img src="${url}" class="chat-image">`);
    } catch (err) {
      showError('فشل رفع الصورة');
    }
  });

  emojiIcon.addEventListener('click', () => {
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
  });
  emojiPicker.addEventListener('emoji-click', (e) => {
    msgInput.value += e.detail.unicode;
  });
});

// تحميل المستخدمين
const loadUsers = async () => {
  try {
    allUsers = await fetchData(API.users);
    updateUserStatuses(onlineUsersCurrent);
  } catch (error) {
    showError('فشل تحميل المستخدمين: ' + error.message);
  }
};

// مسح المحادثة
const clearChat = async () => {
  if (!confirm('هل تريد مسح جميع الرسائل في الشات العام؟ لا يمكن التراجع عن هذا الإجراء.')) return;
  
  try {
    chatBox.innerHTML = '<div class="system-message">جاري مسح المحادثة...</div>';
    
    setTimeout(() => {
      loadMessages();
      showError('تم مسح المحادثة بنجاح');
    }, 1000);
  } catch (error) {
    showError('فشل مسح المحادثة: ' + error.message);
  }
};

// أحداث الأزرار
sendBtn.addEventListener('click', sendMessage);
msgInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
