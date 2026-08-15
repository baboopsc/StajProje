import { getTrending } from "./api.js";
import { reportError } from './logger.js';
import { showMovieSpotlight, showMovieTrailerSpotlight } from './movie-spotlight.js';
import { generateStarIconsMarkup } from './star-icons.js';

const MOBILE_TABLET_MAX_WIDTH = 1279;
const OVERVIEW_MAX_LENGTH = 192;
const DEFAULT_HOME_HERO_OVERVIEW =
  "Is a guide to creating a personalized movie theater experience. You'll need a projector, screen, and speakers. Decorate your space, choose your films, and stock up on snacks for the full experience.";

let currentHeroMovie = null;
let isLibraryHero = false;
let heroResizeRafId = null;
let currentLibraryHeroMovie = null;

window.addEventListener("resize", handleHeroResize);

export async function initHero() {
  const hero = document.getElementById("hero");

  if (!hero) return;

  if (window.location.pathname.toLowerCase().includes("library")) {
    isLibraryHero = true;
    await renderLibraryHero();
    return;
  }

  try {
    const data = await getTrending("day");

    if (!data || !data.results) {
      currentHeroMovie = null;
      renderFallbackHero();
      reportError("API data error:", data);
      return;
    }

    const movies = data.results.filter(m => m.backdrop_path);

    if (movies.length === 0) {
      currentHeroMovie = null;
      renderFallbackHero();
      return;
    }

    const randomIndex = Math.floor(Math.random() * movies.length);
    const movie = movies[randomIndex];

    currentHeroMovie = movie;
    isLibraryHero = false;

    renderHero(movie);

  } catch (error) {
    reportError("Hero error:", error);
    currentHeroMovie = null;
    renderFallbackHero();
  }
}

function getAssetUrl(filename) {
  return new URL(`../img/${filename}`, import.meta.url).href;
}

function shouldTruncateOverview() {
  return window.innerWidth <= MOBILE_TABLET_MAX_WIDTH;
}

function getBackdropImageUrl(backdropPath) {
  if (!backdropPath) return '';

  if (window.innerWidth < 768) {
    return `https://image.tmdb.org/t/p/w780${backdropPath}`;
  }

  return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
}

function formatOverviewText(text) {
  const overview = text?.trim() || "No description";

  if (!shouldTruncateOverview() || overview.length <= OVERVIEW_MAX_LENGTH) {
    return overview;
  }

  return `${overview.slice(0, OVERVIEW_MAX_LENGTH).trimEnd()}...`;
}

function handleHeroResize() {
  if (heroResizeRafId) {
    cancelAnimationFrame(heroResizeRafId);
  }

  heroResizeRafId = requestAnimationFrame(() => {
    heroResizeRafId = null;

    const hero = document.getElementById("hero");

    if (!hero) return;

    if (isLibraryHero) {
      if (currentLibraryHeroMovie) {
        renderLibraryFeaturedHero(currentLibraryHeroMovie);
        return;
      }

      renderLibraryHero();
      return;
    }

    if (currentHeroMovie) {
      renderHero(currentHeroMovie);
      return;
    }

    renderFallbackHero();
  });
}

function renderHero(movie) {
  const hero = document.getElementById("hero");
  const image = getBackdropImageUrl(movie.backdrop_path);
  const starHtml = generateStarIconsMarkup(movie.vote_average, 'hero__star');

  hero.innerHTML = `
    <img
      class="hero__bg"
      src="${image}"
      alt=""
      fetchpriority="high"
      decoding="async"
      width="1280"
      height="660"
    />

    <div class="hero__overlay">
      <div class="container">
        <div class="hero__content">
          <h1 class="hero__title">${movie.title}</h1>
          <div class="hero__rating">${starHtml}</div>
          <p class="hero__overview">
            ${formatOverviewText(movie.overview)}
          </p>
          <div class="hero__actions">
            <button class="btn btn--primary">Watch trailer</button>
            <button class="btn btn--secondary">More details</button>
          </div>
        </div>
      </div>
    </div>
  `;

  attachHeroSpotlightEvents(movie.id);
}

function renderFallbackHero() {
  const hero = document.getElementById("hero");

  if (!hero) return;

  isLibraryHero = false;

  const mobile = getAssetUrl('hero-mobile.jpg');
  const mobile2x = getAssetUrl('hero-mobile@2x.jpg');
  const tablet = getAssetUrl('hero-tablet.jpg');
  const tablet2x = getAssetUrl('hero-tablet@2x.jpg');
  const desktop = getAssetUrl('hero-desktop.jpg');
  const desktop2x = getAssetUrl('hero-desktop@2x.jpg');

  hero.innerHTML = `
    <picture class="hero__bg-picture">
      <source media="(min-width: 1280px)" srcset="${desktop} 1x, ${desktop2x} 2x" />
      <source media="(min-width: 768px)" srcset="${tablet} 1x, ${tablet2x} 2x" />
      <img
        class="hero__bg"
        src="${mobile}"
        srcset="${mobile} 1x, ${mobile2x} 2x"
        alt="Cinema hero background"
        fetchpriority="high"
        decoding="async"
        width="1280"
        height="660"
      />
    </picture>

    <div class="hero__overlay">
      <div class="container">
        <div class="hero__content">
          <h1 class="hero__title">Let's Make Your Own Cinema</h1>
          <div class="hero__rating"></div>
          <p class="hero__overview">
            ${formatOverviewText(DEFAULT_HOME_HERO_OVERVIEW)}
          </p>
          <div class="hero__actions">
            <button class="btn btn--primary">Get started</button>
          </div>
        </div>
      </div>
    </div>
  `;

  hero.querySelector('.btn--primary')?.addEventListener('click', () => {
    window.location.href = './catalog.html';
  });
}

async function renderLibraryHero() {
  const hero = document.getElementById("hero");

  if (!hero) return;

  isLibraryHero = true;

  try {
    const data = await getTrending("day");
    const movies = data?.results?.filter(movie => movie.backdrop_path) || [];

    if (movies.length > 0) {
      const randomIndex = Math.floor(Math.random() * movies.length);
      currentLibraryHeroMovie = movies[randomIndex];
      renderLibraryFeaturedHero(currentLibraryHeroMovie);
      return;
    }
  } catch (error) {
    reportError("Library hero error:", error);
  }

  currentLibraryHeroMovie = null;

  const mobile = getAssetUrl("library-mobile.jpg");
  const mobile2x = getAssetUrl("library-mobile@2x.jpg");
  const tablet = getAssetUrl("library-tablet.jpg");
  const tablet2x = getAssetUrl("library-tablet@2x.jpg");
  const desktop = getAssetUrl("library-desktop.jpg");
  const desktop2x = getAssetUrl("library-desktop@2x.jpg");

  hero.innerHTML = `
    <picture class="hero__bg-picture">
      <source media="(min-width: 1280px)" srcset="${desktop} 1x, ${desktop2x} 2x" />
      <source media="(min-width: 768px)" srcset="${tablet} 1x, ${tablet2x} 2x" />
      <img
        class="hero__bg"
        src="${mobile}"
        srcset="${mobile} 1x, ${mobile2x} 2x"
        alt="Library background"
        fetchpriority="high"
        decoding="async"
        width="1280"
        height="660"
      />
    </picture>

    <div class="hero__overlay">
      <div class="container">
        <div class="hero__content">
          <h1 class="hero__title">Create Your Dream Cinema</h1>
          <div class="hero__rating"></div>
          <p class="hero__overview">
            ${formatOverviewText("Is a guide to designing a personalized movie theater experience with the right equipment, customized decor, and favorite films. This guide helps you bring the cinema experience into your own home with cozy seating, dim lighting, and movie theater snacks.")}
          </p>
        </div>
      </div>
    </div>
  `;
}

function renderLibraryFeaturedHero(movie) {
  const hero = document.getElementById('hero');

  if (!hero) return;

  const image = getBackdropImageUrl(movie.backdrop_path);
  const starHtml = generateStarIconsMarkup(movie.vote_average, 'hero__star');

  hero.innerHTML = `
    <img
      class="hero__bg"
      src="${image}"
      alt="${movie.title}"
      fetchpriority="high"
      decoding="async"
      width="1280"
      height="660"
    />

    <div class="hero__overlay">
      <div class="container">
        <div class="hero__content">
          <h1 class="hero__title">${movie.title}</h1>
          <div class="hero__rating">${starHtml}</div>
          <p class="hero__overview">
            ${formatOverviewText(movie.overview)}
          </p>
          <div class="hero__actions">
            <button class="btn btn--primary">Watch trailer</button>
            <button class="btn btn--secondary">More details</button>
          </div>
        </div>
      </div>
    </div>
  `;

  attachHeroSpotlightEvents(movie.id);
}

function attachHeroSpotlightEvents(movieId) {
  const hero = document.getElementById('hero');

  if (!hero || !movieId) return;

  const trailerButton = hero.querySelector('.btn--primary');
  const detailsButton = hero.querySelector('.btn--secondary');

  trailerButton?.addEventListener('click', () => {
    showMovieTrailerSpotlight(movieId);
  });

  detailsButton?.addEventListener('click', () => {
    showMovieSpotlight(movieId);
  });
}
