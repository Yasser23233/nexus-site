import {
  user,
  initUserSidebar,
  setupLogout,
  setupSidebarToggle,
  setupThemeToggle,
  setupFullscreenToggle
} from './utils.js';

if (!user) window.location.href = 'index.html';

document.addEventListener('DOMContentLoaded', () => {
  initUserSidebar();
  setupLogout();
  setupSidebarToggle();
  setupThemeToggle();
  setupFullscreenToggle();
});
