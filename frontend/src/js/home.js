import { getTrending, getUpcoming, getMovieDetails } from './api.js';
import { showMovieSpotlight, showMovieTrailerSpotlight } from './movie-spotlight.js';
import { saveMovieToLibrary, removeMovieFromLibrary, isMovieSaved } from './library-storage.js';
import { generateStarIconsMarkup } from './star-icons.js';
import { showGlobalLoader, hideGlobalLoader } from './ui.js';

const weeklyList = document.getElementById('weeklyList');
const upcomingWrapper = document.getElementById('upcomingWrapper');

export async function initHome() {
  showGlobalLoader();
  try {
    await Promise.allSettled([
      renderWeeklyTrends(),
      renderUpcoming()
    ]);
  } catch (err) {
    console.error(err);
  } finally {
    hideGlobalLoader();
  }
}

async function renderWeeklyTrends() {
  if (!weeklyList) return;
  const data = await getTrending('week');
  const movies = data.results.slice(0, 3);

  const markup = await Promise.all(movies.map(async movie => {
    const rating = movie.vote_average || 0;
    const starRatingHtml = generateStarIconsMarkup(rating, 'movie-card__star');
    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : './img/oops-logo.png';
    const year = movie.release_date ? movie.release_date.slice(0, 4) : (movie.first_air_date ? movie.first_air_date.slice(0, 4) : '—');

    return `
      <li class="movie-card" data-id="${movie.id}">
        <div class="movie-card__thumb">
          <img class="movie-card__img" src="${poster}" alt="${movie.title || movie.name}" loading="lazy" />
          <div class="movie-card__overlay">
            <span class="movie-card__rating">${rating.toFixed(1)}</span>
          </div>
        </div>
        <h3 class="movie-card__title">${movie.title || movie.name}</h3>
        <div class="movie-card__meta">
          <p>${movie.genre_names ? movie.genre_names.slice(0, 2).join(', ') : 'Movie'} | ${year}</p>
          <div class="movie-card__stars">${starRatingHtml}</div>
        </div>
      </li>
    `;
  }));

  weeklyList.innerHTML = markup.join('');

  weeklyList.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', () => {
      showMovieSpotlight(card.dataset.id);
    });
  });
}

async function renderUpcoming() {
  if (!upcomingWrapper) return;
  const data = await getUpcoming();
  const movies = data.results;
  if (!movies || movies.length === 0) return;

  const randomIndex = Math.floor(Math.random() * Math.min(movies.length, 10));
  const movie = movies[randomIndex];
  const details = await getMovieDetails(movie.id);
  
  const rating = details.vote_average || 0;
  const poster = details.poster_path
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : './img/oops-logo.png';
  const releaseDate = details.release_date || '—';
  const genres = details.genres.map(g => g.name).slice(0, 2).join(', ') || '—';

  upcomingWrapper.innerHTML = `
    <div class="upcoming__poster">
      <img src="${poster}" alt="${details.title}" loading="lazy" />
    </div>
    <div class="upcoming__info">
      <h3 class="upcoming__movie-title">${details.title}</h3>
      <div class="upcoming__meta">
        <p><span class="meta-label">Release date</span><span class="meta-value">${releaseDate}</span></p>
        <p><span class="meta-label">Vote / Votes</span><span class="meta-value"><span class="movie-card__rating">${rating.toFixed(1)}</span> / ${details.vote_count}</span></p>
        <p><span class="meta-label">Popularity</span><span class="meta-value">${details.popularity.toFixed(1)}</span></p>
        <p><span class="meta-label">Genre</span><span class="meta-value">${genres}</span></p>
      </div>
      <p class="upcoming__overview">${details.overview || 'No description available.'}</p>
      <button class="btn btn--primary upcoming__btn" id="upcomingAddBtn" type="button">
        Add to my library
      </button>
    </div>
  `;

  const addBtn = document.getElementById('upcomingAddBtn');
  const updateBtnState = () => {
    const isSaved = isMovieSaved(movie.id);
    if (isSaved) {
      addBtn.textContent = 'Remove from my library';
      addBtn.classList.add('upcoming__btn--remove');
    } else {
      addBtn.textContent = 'Add to my library';
      addBtn.classList.remove('upcoming__btn--remove');
    }
  };

  updateBtnState();

  addBtn.addEventListener('click', () => {
    if (isMovieSaved(movie.id)) {
      removeMovieFromLibrary(movie.id);
    } else {
      saveMovieToLibrary(movie);
    }
    updateBtnState();
  });
}


