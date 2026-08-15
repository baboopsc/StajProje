import { initHeader } from './header.js';
import { initHero } from './hero.js';
import './footer.js';
import { hideGlobalLoader, initGlobalUi, showGlobalLoader } from './ui.js';
import { convertGenreIdsToNames, getGenres } from './api.js';
import { LIBRARY_ADD_EVENT, LIBRARY_REMOVE_EVENT, readSavedMovies } from './library-storage.js';
import { showMovieSpotlight } from './movie-spotlight.js';
import { generateStarIconsMarkup } from './star-icons.js';
import { reportError } from './logger.js';

let allMovies = [];
let filteredMovies = [];
let currentPage = 1;
const perPage = 9;

async function bootstrapLibraryPage() {
  initGlobalUi();
  initHeader();
  showGlobalLoader();

  try {
    await initHero();
    await initLibrary();
  } finally {
    hideGlobalLoader();
  }
}

async function initLibrary() {
  const container = document.getElementById('libraryGallery');
  const loadMoreBtn = document.getElementById('loadMore');
  const genreFilter = document.getElementById('genreFilter');

  if (!container) return;

  allMovies = readSavedMovies();
  filteredMovies = [...allMovies];

  if (allMovies.length === 0) {
    renderEmptyState(container, loadMoreBtn, genreFilter);
    return;
  }

  const genreMap = await getGenres();
  populateGenreDropdown(genreFilter, genreMap);
  renderLibrarySlice(container, loadMoreBtn);

  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    renderLibrarySlice(container, loadMoreBtn);
  });

  addCardListeners(container);
  document.addEventListener(LIBRARY_ADD_EVENT, () => refreshLibrary(container, loadMoreBtn));
  document.addEventListener(LIBRARY_REMOVE_EVENT, () => refreshLibrary(container, loadMoreBtn));
}

function renderEmptyState(container, loadMoreBtn, genreFilter) {
  if (loadMoreBtn) loadMoreBtn.classList.add('is-hidden');
  if (genreFilter) genreFilter.classList.add('is-hidden');
  container.innerHTML = `
    <div class="empty-state">
      <p class="empty-text">OOPS...<br>We are very sorry!<br>You don't have any movies<br>at your library.</p>
      <a href="./catalog.html" class="btn-search-more" target="_self">Search Movie</a>
    </div>
  `;
}

function populateGenreDropdown(genreFilter, genreMap) {
  if (!genreFilter) return;

  const list = genreFilter.querySelector('.custom-select__list');
  const button = genreFilter.querySelector('.custom-select__button');
  const label = genreFilter.querySelector('.custom-select__label');

  if (!list || !button || !label) return;

  const availableGenreIds = new Set();
  allMovies.forEach(m => m.genre_ids?.forEach(id => availableGenreIds.add(id)));

  const allItem = document.createElement('li');
  allItem.dataset.value = 'all';
  allItem.textContent = 'All Genres';
  allItem.classList.add('selected');
  list.appendChild(allItem);

  availableGenreIds.forEach(id => {
    const name = genreMap.get(id);
    if (name) {
      const li = document.createElement('li');
      li.dataset.value = id;
      li.textContent = name;
      list.appendChild(li);
    }
  });

  const toggleList = open => {
    if (open) {
      list.classList.remove('hide');
      button.setAttribute('aria-expanded', 'true');
    } else {
      list.classList.add('hide');
      button.setAttribute('aria-expanded', 'false');
    }
  };

  button.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = !list.classList.contains('hide');
    toggleList(!isOpen);
  });

  document.addEventListener('click', e => {
    if (!genreFilter.contains(e.target)) toggleList(false);
  });

  list.addEventListener('click', e => {
    const li = e.target.closest('li');
    if (!li) return;

    list.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
    li.classList.add('selected');
    label.textContent = li.textContent;
    toggleList(false);

    const selectedId = li.dataset.value;
    currentPage = 1;

    const container = document.getElementById('libraryGallery');
    const loadMoreBtn = document.getElementById('loadMore');
    container.innerHTML = '';

    filteredMovies =
      selectedId === 'all'
        ? allMovies
        : allMovies.filter(m => m.genre_ids?.includes(Number(selectedId)));

    renderLibrarySlice(container, loadMoreBtn);
  });
}

async function renderLibrarySlice(container, loadMoreBtn) {
  if (!container) return;

  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const slice = filteredMovies.slice(start, end);

  if (end >= filteredMovies.length) {
    if (loadMoreBtn) loadMoreBtn.classList.add('is-hidden');
  } else {
    if (loadMoreBtn) loadMoreBtn.classList.remove('is-hidden');
  }

  await renderMovies(slice, container, false);
}

async function renderMovies(moviesList, container, clear = true) {
  if (clear) container.innerHTML = '';

  const markup = await Promise.all(
    moviesList.map(async movie => {
      const genres =
        movie.genre_names?.length > 0
          ? movie.genre_names
          : await convertGenreIdsToNames(movie.genre_ids || []);
      const year = movie.release_date ? movie.release_date.slice(0, 4) : '—';
      const poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : './img/oops-logo.png';

      const starsHtml = generateStarIconsMarkup(movie.vote_average, 'movie-card__star');

      return `
        <li class="movie-card" data-id="${movie.id}">
          <div class="movie-card__thumb">
            <img class="movie-card__img" src="${poster}" alt="${movie.title}" loading="lazy" />
            <div class="movie-card__overlay">
              <span class="movie-card__rating">${(movie.vote_average || 0).toFixed(1)}</span>
            </div>
          </div>
          <h3 class="movie-card__title">${movie.title}</h3>
          <div class="movie-card__meta">
            <p>${genres.slice(0, 2).join(', ')} | ${year}</p>
          </div>
        </li>`;
    })
  );

  container.innerHTML += markup.join('');
}

function addCardListeners(container) {
  if (container.dataset.listenerAttached === 'true') return;

  container.addEventListener('click', e => {
    const card = e.target.closest('.movie-card');
    if (!card) return;
    showMovieSpotlight(card.dataset.id);
  });

  container.dataset.listenerAttached = 'true';
}

function refreshLibrary(container, loadMoreBtn) {
  allMovies = readSavedMovies();
  filteredMovies = [...allMovies];
  currentPage = 1;
  container.innerHTML = '';

  if (allMovies.length === 0) {
    renderEmptyState(container, loadMoreBtn);
    return;
  }

  renderLibrarySlice(container, loadMoreBtn);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapLibraryPage, { once: true });
} else {
  bootstrapLibraryPage();
}
