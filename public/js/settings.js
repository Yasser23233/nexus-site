import {
  user,
  initUserSidebar,
  setupLogout,
  setupSidebarToggle,
  setupFullscreenToggle
} from './utils.js';

if (!user) window.location.href = 'index.html';

document.addEventListener('DOMContentLoaded', () => {
  initUserSidebar();
  setupLogout();
  setupSidebarToggle();
  setupFullscreenToggle();

  const changeBtn = document.getElementById('changeUsernameBtn');
  const input = document.getElementById('usernameInput');
  if (changeBtn && input) {
    changeBtn.addEventListener('click', () => {
      const newName = input.value.trim();
      if (newName) {
        sessionStorage.setItem('nexus_user', newName);
        location.reload();
      }
    });
  }
});
