import {
  user,
  initUserSidebar,
  setupLogout,
  setupSidebarToggle,
  setupFullscreenToggle,
  connectWebSocket,
  sendSocketMessage
} from './utils.js';

if (!user) window.location.href = 'index.html';

document.addEventListener('DOMContentLoaded', () => {
  initUserSidebar();
  setupLogout();
  setupSidebarToggle();
  setupFullscreenToggle();

  connectWebSocket();

  const changeBtn = document.getElementById('changeUsernameBtn');
  const input = document.getElementById('usernameInput');
  if (changeBtn && input) {
    changeBtn.addEventListener('click', () => {
      const newName = input.value.trim();
      if (newName && newName !== user) {
        sessionStorage.setItem('nexus_user', newName);
        // Notify server and all clients
        sendSocketMessage({
          type: 'changeUsername',
          oldName: user,
          newName: newName
        });
        location.reload();
      }
    });
  }

  // Add after DOMContentLoaded
  const fontSizeSelect = document.getElementById('fontSizeSelect');
  const soundToggle = document.getElementById('soundToggle');
  const profileAvatar = document.getElementById('profileAvatar');
  const profileUsername = document.getElementById('profileUsername');

  // Load settings from localStorage
  const settings = JSON.parse(localStorage.getItem('nexus_settings') || '{}');
  if (settings.fontSize) fontSizeSelect.value = settings.fontSize;
  if (settings.sound === false) soundToggle.checked = false;

  // Apply font size globally
  const applyFontSize = size => {
    document.documentElement.style.fontSize =
      size === 'large' ? '18px' : size === 'small' ? '14px' : '16px';
  };
  applyFontSize(fontSizeSelect.value);

  fontSizeSelect.addEventListener('change', () => {
    settings.fontSize = fontSizeSelect.value;
    localStorage.setItem('nexus_settings', JSON.stringify(settings));
    applyFontSize(fontSizeSelect.value);
  });

  soundToggle.addEventListener('change', () => {
    settings.sound = soundToggle.checked;
    localStorage.setItem('nexus_settings', JSON.stringify(settings));
  });

  // Profile info
  profileAvatar.textContent = user ? user.charAt(0) : '?';
  profileUsername.textContent = user || 'مستخدم';
});
