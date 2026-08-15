import { updateHeaderAuthUI } from './auth-modal.js';
export function initHeader() {
  setActiveLink();
  initMenuToggle();
  initThemeToggle();
  updateHeaderAuthUI();
}

const THEME_STORAGE_KEY = 'cinemania-theme';

function setActiveLink() {
  const currentPath = window.location.pathname;
  let page = 'home';

  if (currentPath.includes('catalog')) {
    page = 'catalog';
  } else if (currentPath.includes('library')) {
    page = 'library';
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });

  document.querySelectorAll(`[data-page="${page}"]`).forEach(link => {
    link.classList.add('active');
  });
}

function initMenuToggle() {
  const menuBtn = document.getElementById('menuToggle');
  const nav = document.querySelector('.mobile-nav');

  if (!menuBtn || !nav) return;

  menuBtn.addEventListener('click', () => {
    nav.classList.toggle('open');
    document.body.classList.toggle('nav-open');
  });

  document.addEventListener('click', event => {
    if (
      nav.classList.contains('open') &&
      !nav.contains(event.target) &&
      event.target !== menuBtn
    ) {
      nav.classList.remove('open');
      document.body.classList.remove('nav-open');
    }
  });
}

function initThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');

  if (!toggle) return;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const shouldUseLightTheme = savedTheme === 'light';

  document.body.classList.toggle('light-theme', shouldUseLightTheme);
  toggle.classList.toggle('active', shouldUseLightTheme);

  toggle.addEventListener('click', () => {
    const willUseLightTheme = !document.body.classList.contains('light-theme');

    document.body.classList.toggle('light-theme', willUseLightTheme);
    toggle.classList.toggle('active', willUseLightTheme);
    localStorage.setItem(THEME_STORAGE_KEY, willUseLightTheme ? 'light' : 'dark');
  });
}
