let globalLoaderCount = 0;

function ensureGlobalLoader() {
  let loader = document.getElementById('globalLoader');

  if (loader) return loader;

  loader = document.createElement('div');
  loader.id = 'globalLoader';
  loader.className = 'global-loader hidden';
  loader.innerHTML =
    '<div class="global-loader__spinner" aria-hidden="true"></div>';
  document.body.appendChild(loader);

  return loader;
}

function ensureScrollUpButton() {
  let button = document.getElementById('scrollUpButton');

  if (button) return button;

  button = document.createElement('button');
  button.id = 'scrollUpButton';
  button.className = 'scroll-up hidden';
  button.type = 'button';
  button.setAttribute('aria-label', 'Scroll to top');
  button.textContent = '↑';
  document.body.appendChild(button);

  return button;
}

export function showGlobalLoader() {
  const loader = ensureGlobalLoader();
  globalLoaderCount += 1;
  loader.classList.remove('hidden');
}

export function hideGlobalLoader() {
  const loader = ensureGlobalLoader();
  globalLoaderCount = Math.max(0, globalLoaderCount - 1);

  if (globalLoaderCount === 0) {
    loader.classList.add('hidden');
  }
}

export function initGlobalUi() {
  const scrollUpButton = ensureScrollUpButton();
  ensureGlobalLoader();

  if (scrollUpButton.dataset.bound === 'true') return;

  const toggleScrollButton = () => {
    scrollUpButton.classList.toggle('hidden', window.scrollY < 320);
  };

  window.addEventListener('scroll', toggleScrollButton, { passive: true });
  scrollUpButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  toggleScrollButton();
  scrollUpButton.dataset.bound = 'true';
}