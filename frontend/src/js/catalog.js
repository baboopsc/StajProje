import { initHeader } from './header.js';
import { initHero } from './hero.js';
import { getTrendingPaged, searchMovies, convertGenreIdsToNames } from './api.js';
import { showMovieSpotlight } from './movie-spotlight.js';
import { generateStarIconsMarkup } from './star-icons.js';
import { showGlobalLoader, hideGlobalLoader, initGlobalUi } from './ui.js';

let movieGrid;
let oopsMessage;
let pagination;
let searchForm;
let searchInput;
let clearBtn;
let yearSelect;

let yearSelectCustom;
let yearSelectButton;
let yearSelectLabel;
let yearSelectList;

let currentPage = 1;
let totalPages = 1;
let searchQuery = '';
let searchYear = '';
let isSearching = false;

function showLoader() {
  if (movieGrid) {
    movieGrid.innerHTML = '<li class="global-loader__spinner" style="margin: 40px auto; display: block;"></li>';
  }
  if (oopsMessage) oopsMessage.classList.add('hidden');
}

function showOops(show) {
  if (show) {
    if (oopsMessage) oopsMessage.classList.remove('hidden');
    if (movieGrid) movieGrid.innerHTML = '';
  } else {
    if (oopsMessage) oopsMessage.classList.add('hidden');
  }
}

function buildPagination(current, total) {
  if (!pagination) return;
  pagination.innerHTML = '';

  if (total <= 1) return;

  const maxPage = Math.min(total, 20);

  const prev = document.createElement('button');
  prev.className = 'pagination__btn';
  prev.textContent = '←';
  prev.disabled = current === 1;
  prev.addEventListener('click', () => changePage(current - 1));
  pagination.appendChild(prev);

  const pages = getPageRange(current, maxPage);
  pages.forEach(p => {
    if (p === '...') {
      const dots = document.createElement('span');
      dots.className = 'pagination__dots';
      dots.textContent = '...';
      pagination.appendChild(dots);
      return;
    }

    const btn = document.createElement('button');
    btn.className = 'pagination__btn';
    btn.textContent = p;
    if (p === current) btn.classList.add('active');
    btn.addEventListener('click', () => changePage(p));
    pagination.appendChild(btn);
  });

  const next = document.createElement('button');
  next.className = 'pagination__btn';
  next.textContent = '→';
  next.disabled = current === maxPage;
  next.addEventListener('click', () => changePage(current + 1));
  pagination.appendChild(next);
}

function getPageRange(current, total) {
  if (total <= 7) {
    const all = [];
    for (let i = 1; i <= total; i++) all.push(i);
    return all;
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

function toggleYearSelect(open) {
  if (!yearSelectList || !yearSelectButton) return;
  yearSelectList.classList.toggle('hide', !open);
  yearSelectButton.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function syncYearSelect(value, label) {
  if (yearSelect) yearSelect.value = value;
  if (yearSelectLabel) yearSelectLabel.textContent = label;
  if (yearSelectList) {
    yearSelectList.querySelectorAll('li').forEach(item => {
      item.classList.toggle('selected', item.dataset.value === String(value));
    });
  }
}

function initYearCustomSelect() {
  yearSelectCustom = document.getElementById('yearSelectCustom');
  if (!yearSelectCustom || !yearSelect) return;

  yearSelectButton = yearSelectCustom.querySelector('.custom-select__btn');
  yearSelectLabel = yearSelectCustom.querySelector('.custom-select__label');
  yearSelectList = yearSelectCustom.querySelector('.custom-select__list');

  if (!yearSelectButton || !yearSelectLabel || !yearSelectList) return;

  yearSelectList.innerHTML = '';

  const defaultOption = document.createElement('li');
  defaultOption.dataset.value = '';
  defaultOption.textContent = 'Year';
  yearSelectList.appendChild(defaultOption);

  Array.from(yearSelect.options).forEach(option => {
    if (option.value === '') return;
    const item = document.createElement('li');
    item.dataset.value = option.value;
    item.textContent = option.textContent;
    yearSelectList.appendChild(item);
  });

  syncYearSelect(yearSelect.value, 'Year');
  toggleYearSelect(false);

  yearSelectButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !yearSelectList.classList.contains('hide');
    toggleYearSelect(!isOpen);
  });

  yearSelectList.addEventListener('click', e => {
    const item = e.target.closest('li');
    if (!item) return;
    syncYearSelect(item.dataset.value, item.textContent);
    toggleYearSelect(false);
  });

  document.addEventListener('click', () => {
    toggleYearSelect(false);
  });
}

function changePage(page) {
  if (page < 1 || page > Math.min(totalPages, 20)) return;
  if (isSearching) {
    loadSearch(searchQuery, page, searchYear);
  } else {
    loadTrending(page);
  }
}

function scrollToCatalog() {
  const section = document.querySelector('.catalog-section');
  if (section) {
    const header = document.querySelector('.header');
    const headerHeight = header ? header.offsetHeight : 0;
    const targetTop = Math.max(section.offsetTop - headerHeight - 40, 0);
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  }
}

async function renderMovies(movies) {
  if (!movieGrid) return;
  const markup = await Promise.all(movies.map(async movie => {
    const genres = await convertGenreIdsToNames(movie.genre_ids || []);
    const year = movie.release_date ? movie.release_date.slice(0, 4) : '—';
    const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : './img/oops-logo.png';
    const rating = movie.vote_average || 0;
    const starsHtml = generateStarIconsMarkup(rating, 'movie-card__star');

    return `
      <li class="movie-card" data-id="${movie.id}">
        <img src="${poster}" alt="${movie.title}" class="movie-card__poster" loading="lazy" />
        <div class="movie-card__info">
          <h3 class="movie-card__title">${movie.title}</h3>
          <div class="movie-card__meta">
            <span class="movie-card__text">${genres.slice(0, 2).join(', ')} | ${year}</span>
            <div class="movie-card__stars">${starsHtml}</div>
          </div>
        </div>
      </li>
    `;
  }));

  movieGrid.innerHTML = markup.join('');
}

async function loadTrending(page) {
  showLoader();
  try {
    const data = await getTrendingPaged(page);
    currentPage = page;
    totalPages = data.total_pages;

    if (!data.results || data.results.length === 0) {
      showOops(true);
      if (pagination) pagination.innerHTML = '';
      return;
    }

    showOops(false);
    await renderMovies(data.results);
    buildPagination(currentPage, totalPages);
    scrollToCatalog();
  } catch (err) {
    console.error(err);
    showOops(true);
  }
}

async function loadSearch(query, page, year = '') {
  showLoader();
  try {
    const data = await searchMovies(query, page, year);
    currentPage = page;
    totalPages = data.total_pages;

    if (!data.results || data.results.length === 0) {
      showOops(true);
      if (pagination) pagination.innerHTML = '';
      return;
    }

    showOops(false);
    await renderMovies(data.results);
    buildPagination(currentPage, totalPages);
    scrollToCatalog();
  } catch (err) {
    console.error(err);
    showOops(true);
  }
}

async function bootstrapCatalogPage() {
  initGlobalUi();
  initHeader();

  movieGrid = document.getElementById('movieGrid');
  oopsMessage = document.getElementById('oopsMessage');
  pagination = document.getElementById('pagination');
  searchForm = document.getElementById('searchForm');
  searchInput = document.getElementById('searchInput');
  clearBtn = document.getElementById('clearBtn');
  yearSelect = document.getElementById('yearSelect');

  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1900; y--) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }

  initYearCustomSelect();

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (clearBtn) clearBtn.hidden = searchInput.value.trim() === '';
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      syncYearSelect('', 'Year');
      clearBtn.hidden = true;
      searchInput.focus();
      isSearching = false;
      searchQuery = '';
      searchYear = '';
      loadTrending(1);
    });
  }

  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      const year = yearSelect.value;
      if (!query) return;

      isSearching = true;
      searchQuery = query;
      searchYear = year;
      loadSearch(query, 1, year);
    });
  }

  if (movieGrid) {
    movieGrid.addEventListener('click', e => {
      const card = e.target.closest('.movie-card');
      if (!card) return;
      showMovieSpotlight(card.dataset.id);
    });
  }

  await Promise.allSettled([initHero(), loadTrending(1)]);
}

document.addEventListener('DOMContentLoaded', bootstrapCatalogPage, {
  once: true,
});
