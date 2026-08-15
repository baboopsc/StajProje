import {
  getMovieDetails,
  getMovieVideos,
  getMovieComments,
  postMovieComment,
} from './api.js';
import { reportError } from './logger.js';
import { getCurrentUser, showAuthModal } from './auth-modal.js';
import {
  isMovieSaved as isMovieSavedInLibrary,
  removeMovieFromLibrary as deleteMovieFromLibrary,
  saveMovieToLibrary as persistMovieToLibrary,
} from './library-storage.js';

const OVERLAY_ID = 'movie-spotlight-overlay';
let spotlightEscapeHandler = null;

function buildVoteMarkup(voteAverage, voteCount) {
  const averageValue = voteAverage ? voteAverage.toFixed(1) : 'N/A';
  const totalVotes = voteCount ?? 0;

  return `
    <span class="spotlight-vote-pill">${averageValue}</span>
    <span class="spotlight-vote-separator">/</span>
    <span class="spotlight-vote-pill">${totalVotes}</span>
  `;
}

function buildInfoRow(label, value) {
  return `
    <div class="spotlight-meta-row">
      <span class="spotlight-meta-label">${label}</span>
      <span class="spotlight-meta-value">${value}</span>
    </div>
  `;
}

// Kullanıcı yorumlarından oy ortalamasını hesaplayıp ekrana yazan fonksiyon
function updateUserRatingRow(overlayElement, comments) {
  const rowElement = overlayElement.querySelector('#spotlight-user-rating-row');
  if (!rowElement) return;

  // Sadece puan verilmiş (0'dan büyük) yorumları filtrele
  const ratedComments = comments.filter(c => c.rating && Number(c.rating) > 0);
  const totalVotes = ratedComments.length;

  // Ortalamayı hesapla
  const avgRating =
    totalVotes > 0
      ? ratedComments.reduce((sum, c) => sum + Number(c.rating), 0) / totalVotes
      : 0;

  // Ekranda 0.0 / 0 ya da 8.5 / 4 şeklinde göstermek için formatla
  const displayAvg = totalVotes > 0 ? avgRating.toFixed(1) : '0.0';

  rowElement.innerHTML = `
    <span class="spotlight-meta-label">User Rating</span>
    <span class="spotlight-meta-value">
      <span class="spotlight-vote-pill">${displayAvg}</span>
      <span class="spotlight-vote-separator">/</span>
      <span class="spotlight-vote-pill">${totalVotes}</span>
    </span>
  `;
}

// Yorum listesi ve yeni yorum formunun HTML şablonu
// Yorum listesi ve yeni yorum formunun HTML şablonu (KULLANICI ADI GÖSTERİLECEK ŞEKİLDE GÜNCELLENDİ)
function createCommentsMarkup(comments, movieId) {
  const commentsListHtml =
    comments.length > 0
      ? comments
          .map(
            c => `
        <div class="spotlight-comment-item" style="border-bottom: 1px solid #333; padding: 10px 0;">
          <div style="display: flex; justify-content: space-between; color: #f86f03; font-weight: bold; font-size: 13px;">
            <span>${c.username || 'Kullanıcı'}</span>
            <span>★ ${c.rating ? c.rating : 'Puan Yok'} / 10</span>
          </div>
          <p style="margin: 5px 0 0; color: #fff; font-size: 14px; word-break: break-word;">${c.content}</p>
        </div>
      `
          )
          .join('')
      : '<p style="color: #aaa; font-size: 14px; margin: 10px 0;">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>';

  return `
    <div class="spotlight-comments-wrapper" style="margin-top: 20px; border-top: 1px solid #444; padding-top: 15px; width: 100%;">
      <h3 class="spotlight-copy-title" style="margin-bottom: 10px;">YORUMLAR & PUANLAR</h3>
      <div id="comments-list-container" style="max-height: 150px; overflow-y: auto; margin-bottom: 15px; padding-right: 5px;">
        ${commentsListHtml}
      </div>
      
      <form id="comment-form" data-movie-id="${movieId}" style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="color: #fff; font-size: 14px; white-space: nowrap;">Puanın:</label>
          <select id="comment-rating" style="padding: 6px; background: #111; color: #fff; border: 1px solid #444; border-radius: 4px; width: 100%;">
            <option value="10">10 - Harika</option>
            <option value="9">9 - Çok İyi</option>
            <option value="8">8 - İyi</option>
            <option value="7">7 - İdare Eder</option>
            <option value="6">6 - Ortalama</option>
            <option value="5">5 - Kötü</option>
            <option value="4">4 - Zayıf</option>
            <option value="3">3 - Çok Kötü</option>
            <option value="2">2 - Berbat</option>
            <option value="1">1 - Zaman Kaybı</option>
          </select>
        </div>
        <textarea id="comment-text" rows="2" placeholder="Film hakkında ne düşünüyorsun?" required style="width: 100%; padding: 8px; background: #111; color: #fff; border: 1px solid #444; border-radius: 4px; resize: none; box-sizing: border-box;"></textarea>
        <button type="submit" style="padding: 10px 15px; background: #f86f03; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; transition: opacity 0.2s;">Yorumu Gönder</button>
      </form>
    </div>
  `;
}

function createSpotlightMarkup(movie) {
  const posterSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://placehold.co/500x750/111111/ffffff?text=No+Image';

  const year = movie.release_date?.slice(0, 4) || 'Unknown';
  const genres =
    movie.genres?.length > 0
      ? movie.genres.map(genre => genre.name).join(' ')
      : 'Unknown';
  const popularity = movie.popularity ? movie.popularity.toFixed(1) : 'N/A';
  const overview = movie.overview || 'No description available for this movie.';
  const buttonLabel = isMovieSaved(movie.id)
    ? 'Remove from my library'
    : 'Add to my library';
  const buttonStateClass = isMovieSaved(movie.id)
    ? 'spotlight-library-button--remove'
    : 'spotlight-library-button--add';

  return `
    <div class="spotlight-shell" role="dialog" aria-modal="true" aria-labelledby="spotlight-title">
      <button class="spotlight-close" type="button" aria-label="Close movie details">&times;</button>
      <div class="spotlight-poster-wrap">
        <img class="spotlight-poster" src="${posterSrc}" alt="${movie.title}" />
      </div>
      <div class="spotlight-content">
        <h2 id="spotlight-title" class="spotlight-title">${movie.title}</h2>
        <div class="spotlight-meta">
          ${buildInfoRow(
            'Vote / Votes',
            buildVoteMarkup(movie.vote_average, movie.vote_count)
          )}
          
          <div id="spotlight-user-rating-row" class="spotlight-meta-row">
            <span class="spotlight-meta-label">User Rating</span>
            <span class="spotlight-meta-value">${buildVoteMarkup(0, 0)}</span>
          </div>

          ${buildInfoRow('Popularity', popularity)}
          ${buildInfoRow('Genre', genres)}
        </div>
        <div class="spotlight-copy-block">
          <h3 class="spotlight-copy-title">ABOUT</h3>
          <p class="spotlight-overview">${overview}</p>
        </div>
        
        <!-- BUTONLARIN YER ALDIĞI ALAN -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
          <button class="spotlight-library-button ${buttonStateClass}" type="button" data-movie-id="${movie.id}">
            ${buttonLabel}
          </button>
          
          <!-- İstediğin Turuncu Gradyan Watch Trailer Butonu -->
          <button id="spotlight-watch-trailer-btn" class="btn btn--primary" type="button" data-movie-id="${movie.id}">
            Watch trailer
          </button>
        </div>
        
        <div id="spotlight-comments-section" style="width: 100%;"></div>

      </div>
    </div>
  `;
}

function createTrailerMarkup(movie, trailerKey) {
  return `
    <div class="spotlight-shell spotlight-shell--trailer" role="dialog" aria-modal="true" aria-labelledby="spotlight-trailer-title">
      <button class="spotlight-close" type="button" aria-label="Close trailer">&times;</button>
      <div class="spotlight-content spotlight-content--trailer">
        <div class="spotlight-trailer-frame-wrap">
          <iframe
            class="spotlight-trailer-frame"
            src="https://www.youtube.com/embed/${trailerKey}?autoplay=1"
            title="${movie.title} trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>
  `;
}

function createTrailerFallbackMarkup() {
  const fallbackImage = new URL('../img/oops-logo.png', import.meta.url).href;

  return `
    <div class="spotlight-shell spotlight-shell--trailer spotlight-shell--trailer-fallback" role="dialog" aria-modal="true" aria-labelledby="spotlight-trailer-fallback-title">
      <button class="spotlight-close" type="button" aria-label="Close trailer fallback">&times;</button>
      <div class="spotlight-trailer-fallback">
        <div class="spotlight-trailer-fallback__copy">
          <h2 id="spotlight-trailer-fallback-title" class="spotlight-trailer-fallback__title">OOPS...</h2>
          <p class="spotlight-trailer-fallback__text">We are very sorry!</p>
          <p class="spotlight-trailer-fallback__text">But we couldn&apos;t find the trailer.</p>
        </div>
        <img
          class="spotlight-trailer-fallback__image"
          src="${fallbackImage}"
          alt="Trailer unavailable"
          width="320"
          height="240"
        />
      </div>
    </div>
  `;
}

function isMovieSaved(movieId) {
  return isMovieSavedInLibrary(movieId);
}

function saveMovieToLibrary(movie) {
  return persistMovieToLibrary(movie);
}

function removeSpotlight() {
  const existingOverlay = document.getElementById(OVERLAY_ID);

  if (spotlightEscapeHandler) {
    document.removeEventListener('keydown', spotlightEscapeHandler);
    spotlightEscapeHandler = null;
  }

  if (!existingOverlay) return;

  existingOverlay.remove();
  document.body.classList.remove('spotlight-open');
}

function attachSpotlightEvents(overlayElement, movie) {
  const trailerButton = overlayElement.querySelector('#spotlight-watch-trailer-btn');
  trailerButton?.addEventListener('click', () => {
    showMovieTrailerSpotlight(movie.id);
  });
  const closeButton = overlayElement.querySelector('.spotlight-close');
  const libraryButton = overlayElement.querySelector(
    '.spotlight-library-button'
  );

  closeButton?.addEventListener('click', removeSpotlight);
  libraryButton?.addEventListener('click', () => {
    const movieIsSaved = isMovieSaved(movie?.id);

    if (movieIsSaved) {
      const wasRemoved = deleteMovieFromLibrary(movie.id);

      if (wasRemoved) {
        updateLibraryButtonState(libraryButton, false);
      }

      return;
    }

    const wasAdded = saveMovieToLibrary(movie);

    if (wasAdded) {
      updateLibraryButtonState(libraryButton, true);
    }
  });

  overlayElement.addEventListener('click', event => {
    if (event.target === overlayElement) {
      removeSpotlight();
    }
  });

  spotlightEscapeHandler = event => {
    if (event.key === 'Escape') {
      removeSpotlight();
    }
  };

  document.addEventListener('keydown', spotlightEscapeHandler);

  if (movie && movie.id) {
    const commentsSection = overlayElement.querySelector(
      '#spotlight-comments-section'
    );
    if (commentsSection) {
      // 1. Backend'den yorumları çek, ekrana bas VE üstteki puan satırını güncelle!
      getMovieComments(movie.id).then(comments => {
        commentsSection.innerHTML = createCommentsMarkup(comments, movie.id);
        updateUserRatingRow(overlayElement, comments);

        const form = commentsSection.querySelector('#comment-form');
        form?.addEventListener('submit', async e => {
          e.preventDefault();
          const contentInput = form.querySelector('#comment-text');
          const ratingInput = form.querySelector('#comment-rating');

          const content = contentInput.value.trim();
          const rating = Number(ratingInput.value);

          if (!content) return;

          // ====================================================================
          // YENİ GÜNCELLENEN KISIM: Dinamik Giriş Kontrolü
          // ====================================================================
          const currentUser = getCurrentUser();
          if (!currentUser) {
            alert('Yorum yapmak ve puan vermek için önce giriş yapmalısın!');
            showAuthModal(true); // Giriş yapmamışsa otomatik giriş modalını aç!
            return;
          }

          const submitBtn = form.querySelector('button[type="submit"]');
          submitBtn.disabled = true;
          submitBtn.textContent = 'Gönderiliyor...';

          try {
            const newComment = await postMovieComment({
              movieId: Number(movie.id),
              content: content,
              rating: rating,
              userId: currentUser.id, // <-- Artık giriş yapan kişinin GERÇEK ID'si gidiyor!
              username: currentUser.username,
            });

            if (newComment) {
              // Yorum eklenince listeyi ve üstteki puan satırını anında yenile!
              const updatedComments = await getMovieComments(movie.id);
              commentsSection.innerHTML = createCommentsMarkup(
                updatedComments,
                movie.id
              );
              updateUserRatingRow(overlayElement, updatedComments);
            } else {
              alert('Yorum eklenemedi. Lütfen backend sunucunu kontrol et.');
              submitBtn.disabled = false;
              submitBtn.textContent = 'Yorumu Gönder';
            }
          } catch (error) {
            console.error('Yorum gönderme hatası:', error);
            alert('Bir hata oluştu. Backend sunucusuna ulaşılamıyor.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Yorumu Gönder';
          }
        });
      });
    }
  }
}

function updateLibraryButtonState(button, isSaved) {
  if (!button) return;

  button.textContent = isSaved
    ? 'Remove from my library'
    : 'Add to my library';
  button.classList.toggle('spotlight-library-button--add', !isSaved);
  button.classList.toggle('spotlight-library-button--remove', isSaved);
}

export async function showMovieSpotlight(movieId) {
  removeSpotlight();

  try {
    const movie = await getMovieDetails(movieId);
    const overlayElement = document.createElement('div');

    overlayElement.id = OVERLAY_ID;
    overlayElement.className = 'spotlight-backdrop';
    overlayElement.innerHTML = createSpotlightMarkup(movie);

    document.body.appendChild(overlayElement);
    document.body.classList.add('spotlight-open');

    attachSpotlightEvents(overlayElement, movie);
  } catch (error) {
    reportError('Movie spotlight error:', error);
  }
}

export async function showMovieTrailerSpotlight(movieId) {
  removeSpotlight();

  try {
    const [movie, videoData] = await Promise.all([
      getMovieDetails(movieId),
      getMovieVideos(movieId),
    ]);
    const videos = videoData?.results || [];
    const trailer =
      videos.find(
        video =>
          video.site === 'YouTube' &&
          video.type === 'Trailer' &&
          video.official
      ) ||
      videos.find(
        video => video.site === 'YouTube' && video.type === 'Trailer'
      ) ||
      videos.find(video => video.site === 'YouTube');

    const overlayElement = document.createElement('div');

    overlayElement.id = OVERLAY_ID;
    overlayElement.className = 'spotlight-backdrop';
    overlayElement.innerHTML = trailer?.key
      ? createTrailerMarkup(movie, trailer.key)
      : createTrailerFallbackMarkup();

    document.body.appendChild(overlayElement);
    document.body.classList.add('spotlight-open');

    attachSpotlightEvents(overlayElement);
  } catch (error) {
    reportError('Movie trailer error:', error);
  }
}