import { initHeader } from './header.js';
import { initHome } from './home.js';
import { initHero } from './hero.js';
import { updateHeaderAuthUI } from './auth-modal.js';

import {
  hideGlobalLoader,
  initGlobalUi,
  showGlobalLoader,
} from './ui.js';

async function bootstrapPage() {
  initGlobalUi();
  initHeader();
  showGlobalLoader();
  updateHeaderAuthUI();

  try {
    await Promise.allSettled([initHero(), initHome()]);
  } finally {
    hideGlobalLoader();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapPage, { once: true });
} else {
  bootstrapPage();
}