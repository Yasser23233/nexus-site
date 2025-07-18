// روابط API
const API_BASE = '/api';
export const API = {
  users: `${API_BASE}/users`,
  login: `${API_BASE}/login`,
  send: `${API_BASE}/send`,
  public: `${API_BASE}/messages/public`,
  dm: (u1, u2) => `${API_BASE}/messages/dm/${encodeURIComponent(u1)}/${encodeURIComponent(u2)}`,
  status: (username) => `${API_BASE}/status/${username}`
};

// دالة الجلب العامة
export const fetchData = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'فشل في الاستجابة من الخادم');
    }
    
    return await response.json();
  } catch (error) {
    console.error('خطأ في الشبكة:', error);
    throw new Error('خطأ في الاتصال بالخادم');
  }
};

// التحقق من المستخدم المسجل
export const user = sessionStorage.getItem('nexus_user');

// إعادة توجيه إذا لم يكن مسجلاً
export const requireAuth = () => {
  if (!user) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
};

// تنسيق التاريخ والوقت
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.round(diffMs / 60000);
  
  // إذا كانت الرسالة حديثة (أقل من 24 ساعة)
  if (diffMins < 1440) {
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMins / 60);
    return `منذ ${diffHours} ساعة`;
  }
  
  // إذا كانت قديمة (أكثر من 24 ساعة)
  return date.toLocaleDateString('ar-EG', {
    day: '2-digit',
    month: 'short'
  });
};

// إنشاء عنصر المستخدم
export const createUserElement = (username) => {
  const userEl = document.createElement('div');
  userEl.className = 'user-item';
  userEl.dataset.username = username;

  const badge = username === 'ياسر' ? '👑' : '⭐';

  userEl.innerHTML = `
    <div class="avatar">${username.charAt(0)}</div>
    <div class="contact-info">
      <span class="username">${username} <span class="user-badge">${badge}</span></span>
      <div class="dm-message-time">آخر نشاط: غير معروف</div>
    </div>
  `;
  
  return userEl;
};

// تهيئة معلومات المستخدم في الشريط الجانبي
export const initUserSidebar = () => {
  if (!user) return;
  
  const usernameElements = document.querySelectorAll('#usernameDisplay');
  const avatarElements = document.querySelectorAll('#userAvatar');
  
  usernameElements.forEach(el => el.textContent = user);
  avatarElements.forEach(el => el.textContent = user.charAt(0));
};

// إضافة حدث تسجيل الخروج
export const setupLogout = () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('nexus_user');
      window.location.href = 'index.html';
    });
  }
};

// تهيئة زر طي الشريط الجانبي
export const setupSidebarToggle = () => {
  const toggleBtn = document.getElementById('toggleSidebar');
  const sidebar = document.querySelector('.sidebar');
  if (!toggleBtn || !sidebar) return;
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });
};

// تهيئة زر تبديل المظهر
export const setupThemeToggle = () => {
  const toggleBtn = document.getElementById('themeToggle');
  if (!toggleBtn) return;
  const body = document.body;
  if (localStorage.getItem('theme') === 'light') {
    body.classList.add('light-theme');
  }
  toggleBtn.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    localStorage.setItem('theme', body.classList.contains('light-theme') ? 'light' : 'dark');
  });
};

// إدارة الحالة الكاملة للشاشة
export const setupFullscreenToggle = () => {
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  if (!fullscreenBtn) return;
  
  fullscreenBtn.addEventListener('click', toggleFullscreen);
};

// تبديل الحالة الكاملة للشاشة
export const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`فشل الدخول للحالة الكاملة: ${err}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// دالة جديدة للتحقق من اتصال المستخدم
export const checkUserStatus = async (username) => {
  try {
    const response = await fetch(API.status(username));
    if (!response.ok) throw new Error('فشل التحقق من الحالة');
    return await response.json();
  } catch (error) {
    console.error('خطأ في التحقق من حالة المستخدم:', error);
    return { status: 'offline', lastActive: null };
  }
};

// تحسين دالة عرض الخطأ
export const showError = (elOrMsg, maybeMsg, duration = 5000) => {
  let el, msg;

  if (typeof elOrMsg === 'string') {
    msg = elOrMsg;
    el  = document.createElement('div');
    el.className = 'error-message';
    document.body.appendChild(el);
  } else {
    el  = elOrMsg;
    msg = maybeMsg;
  }

  if (!el) return;

  el.textContent = msg;
  el.style.display = 'block';
  el.style.animation = 'shake 0.5s';

  if (duration > 0) {
    setTimeout(() => {
      el.remove();
    }, duration);
  }
};

// دالة جديدة لتأخير الطلبات
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// إدارة اتصال WebSocket
let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

export const connectWebSocket = () => {
  if (socket && socket.readyState === WebSocket.OPEN) return;
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  socket = new WebSocket(`${protocol}//${host}`);

  socket.addEventListener('open', () => {
    console.log('اتصال WebSocket مفتوح');
    reconnectAttempts = 0;
    updateConnectionStatus('online');
    
    // تسجيل المستخدم بعد الاتصال
    if (user) {
      socket.send(JSON.stringify({
        type: 'register',
        user: user
      }));
    }
  });

  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        window.dispatchEvent(new CustomEvent('newMessage', { detail: data }));
      }
      
      if (data.type === 'userStatus') {
        window.dispatchEvent(new CustomEvent('userStatusUpdate', { 
          detail: data.onlineUsers 
        }));
      }
      
      if (data.type === 'typing') {
        window.dispatchEvent(new CustomEvent('userTyping', { 
          detail: data 
        }));
      }
    } catch (error) {
      console.error('خطأ في معالجة رسالة WebSocket:', error);
    }
  });

  socket.addEventListener('close', () => {
    console.log('اتصال WebSocket مغلق');
    updateConnectionStatus('offline');
    
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        reconnectAttempts++;
        connectWebSocket();
      }, 3000);
    }
  });

  socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
    updateConnectionStatus('offline');
  });
};

// إرسال رسالة عبر WebSocket
export const sendSocketMessage = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
};

// إرسال حالة الكتابة
export const sendTypingStatus = (isTyping, recipient) => {
  if (socket && socket.readyState === WebSocket.OPEN && user) {
    socket.send(JSON.stringify({
      type: 'typing',
      sender: user,
      recipient: recipient,
      isTyping: isTyping
    }));
  }
};

// تحويل ملف إلى Base64
const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// رفع صورة وإرجاع الرابط
export const uploadImage = async (file) => {
  const dataUrl = await fileToDataUrl(file);
  return fetchData('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ data: dataUrl })
  });
};

// تحديث حالة الاتصال في الواجهة
const updateConnectionStatus = (status) => {
  const connectionStatus = document.getElementById('connectionStatus');
  if (!connectionStatus) return;
  
  connectionStatus.className = `connection-status status-${status}`;
  connectionStatus.querySelector('.status-indicator').className = 'status-indicator';
  
  if (status === 'online') {
    connectionStatus.innerHTML = '<div class="status-indicator"></div><span>متصل بالخادم</span>';
  } else {
    connectionStatus.innerHTML = '<div class="status-indicator"></div><span>جاري إعادة الاتصال...</span>';
  }
};

// تهيئة حالة الاتصال عند التحميل
window.addEventListener('load', () => {
  const statusEl = document.createElement('div');
  statusEl.id = 'connectionStatus';
  statusEl.className = 'connection-status status-offline';
  statusEl.innerHTML = '<div class="status-indicator"></div><span>جاري الاتصال...</span>';
  document.body.appendChild(statusEl);
  
  // البدء في الاتصال
  connectWebSocket();
});
