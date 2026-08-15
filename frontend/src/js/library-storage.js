import { reportError } from './logger.js';

export const getLibraryKey = () => {
  try {
    // Doğru anahtarı (cinemania_current_user) buraya ekledik
    const rawUser = localStorage.getItem('cinemania_current_user');
    
    if (rawUser) {
      const currentUser = JSON.parse(rawUser);
      // Kullanıcı ID'sini yakalıyoruz
      const userId = currentUser.id || currentUser._id || currentUser.userId;
      
      if (userId) {
        return `cinemania_library_${userId}`;
      }
    }
  } catch (error) {
    reportError('Kullanıcı verisi okunamadı:', error);
  }
  return null; 
};

export const LIBRARY_ADD_EVENT = 'cinemania:library:add';
export const LIBRARY_REMOVE_EVENT = 'cinemania:library:remove';

function safeParseSavedMovies(rawValue) {
  try {
    const parsedValue = JSON.parse(rawValue || '[]');
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    reportError('Saved movies parse error:', error);
    return [];
  }
}

export function readSavedMovies() {
  const key = getLibraryKey();
  if (!key) return []; // Giriş yapılmamışsa boş liste döndür

  return safeParseSavedMovies(localStorage.getItem(key));
}

export function isMovieSaved(movieId) {
  return readSavedMovies().some(savedMovie => Number(savedMovie.id) === Number(movieId));
}

export function normalizeMovieForLibrary(movie) {
  const genreIds =
    movie.genre_ids ||
    movie.genres?.map(genre =>
      typeof genre === 'object' && genre !== null ? genre.id : genre
    ) ||
    [];

  const genreNames =
    movie.genre_names ||
    movie.genres?.map(genre =>
      typeof genre === 'object' && genre !== null ? genre.name : genre
    ) ||
    [];

  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path || '',
    backdrop_path: movie.backdrop_path || '',
    release_date: movie.release_date || '',
    vote_average: movie.vote_average ?? 0,
    overview: movie.overview || '',
    genre_ids: genreIds.filter(Boolean),
    genre_names: genreNames.filter(Boolean),
  };
}

export function saveMovieToLibrary(movie) {
  const key = getLibraryKey();
  
  // Eğer kullanıcı giriş yapmamışsa eklemesini engelle ve uyar
  if (!key) {
    alert("Kütüphanenize film eklemek için lütfen önce giriş yapın!");
    return false;
  }

  const savedMovies = readSavedMovies();

  if (savedMovies.some(savedMovie => Number(savedMovie.id) === Number(movie.id))) {
    return false;
  }

  const movieSummary = normalizeMovieForLibrary(movie);

  localStorage.setItem(
    key,
    JSON.stringify([...savedMovies, movieSummary])
  );

  document.dispatchEvent(
    new CustomEvent(LIBRARY_ADD_EVENT, {
      detail: movieSummary,
    })
  );

  return true;
}

export function removeMovieFromLibrary(movieId) {
  const key = getLibraryKey();
  if (!key) return false;

  const savedMovies = readSavedMovies();
  const nextSavedMovies = savedMovies.filter(
    savedMovie => Number(savedMovie.id) !== Number(movieId)
  );

  if (nextSavedMovies.length === savedMovies.length) {
    return false;
  }

  localStorage.setItem(key, JSON.stringify(nextSavedMovies));

  document.dispatchEvent(
    new CustomEvent(LIBRARY_REMOVE_EVENT, {
      detail: { movieId: Number(movieId) },
    })
  );

  return true;
}

export function getLatestSavedMovie() {
  const savedMovies = readSavedMovies();
  return savedMovies[savedMovies.length - 1] || null;
}