import { user, initUserSidebar, setupLogout, setupSidebarToggle } from './utils.js';

if (!user) window.location.href = 'index.html';

document.addEventListener('DOMContentLoaded', () => {
  initUserSidebar();
  setupLogout();
  setupSidebarToggle();
});
