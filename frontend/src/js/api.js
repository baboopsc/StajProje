import axios from 'axios';

const API_KEY = import.meta.env.VITE_TMDB_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const TMDB_CONFIG_ERROR =
  'TMDB live data is unavailable because VITE_TMDB_KEY is missing.';
export const hasTmdbKey = () => Boolean(API_KEY);
export const getApiKey = () => API_KEY;

// TMDB API için axios instance
const api = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
});

// Kendi NestJS Backend'imiz için yeni axios instance
const backendApi = axios.create({
  baseURL: BACKEND_URL,
});

const fetchData = async (url, params = {}) => {
  if (!hasTmdbKey()) {
    throw new Error(TMDB_CONFIG_ERROR);
  }

  const response = await api.get(url, {
    params: {
      api_key: API_KEY,
      ...params,
    },
  });

  return response.data;
};

export const getTrending = (timeWindow = 'day') =>
  fetchData(`/trending/movie/${timeWindow}`);

export const getTrendingPaged = (page = 1, timeWindow = 'week') =>
  fetchData(`/trending/movie/${timeWindow}`, { page });

export const getUpcoming = () => fetchData('/movie/upcoming');

export const searchMovies = (query, page = 1, year = '') =>
  fetchData('/search/movie', {
    query,
    page,
    primary_release_year: year || undefined,
  });

export const getMovieDetails = movieId => fetchData(`/movie/${movieId}`);

export const getMovieVideos = movieId => fetchData(`/movie/${movieId}/videos`);

let genreMapCache = null;

export const getGenres = async () => {
  if (genreMapCache) return genreMapCache;

  const data = await fetchData('/genre/movie/list');

  genreMapCache = new Map(data.genres.map(genre => [genre.id, genre.name]));

  return genreMapCache;
};

export const convertGenreIdsToNames = async genreIds => {
  const genreMap = await getGenres();

  return genreIds.map(id => genreMap.get(id) || 'Unknown');
};

// ============================================================================
// YORUM & PUAN SİSTEMİ (%100 YEREL & SORUNSUZ ÇÖZÜM)
// ============================================================================

export const getMovieComments = async movieId => {
  const allComments = JSON.parse(localStorage.getItem('cinemania_all_comments')) || {};
  return allComments[movieId] || [];
};

export const postMovieComment = async commentData => {
  const allComments = JSON.parse(localStorage.getItem('cinemania_all_comments')) || {};
  if (!allComments[commentData.movieId]) {
    allComments[commentData.movieId] = [];
  }

  const newComment = {
    id: Date.now(),
    ...commentData, // Burada username doğrudan içeri aktarılıyor
    createdAt: new Date().toISOString()
  };

  allComments[commentData.movieId].push(newComment);
  localStorage.setItem('cinemania_all_comments', JSON.stringify(allComments));
  
  return newComment;
};

// ============================================================================
// KULLANICI & ARKADAŞLIK SİSTEMİ (%100 YEREL & SORUNSUZ ÇÖZÜM)
// ============================================================================

export const registerUser = async (userData) => {
  const localUsers = JSON.parse(localStorage.getItem('cinemania_all_users')) || [];
  
  if (localUsers.some(u => u.email === userData.email)) {
    throw new Error('Bu e-posta adresi zaten kullanımda!');
  }

  const newUser = { id: Date.now(), ...userData };
  localUsers.push(newUser);
  localStorage.setItem('cinemania_all_users', JSON.stringify(localUsers));
  
  return newUser;
};

export const loginUser = async (email, password) => {
  const localUsers = JSON.parse(localStorage.getItem('cinemania_all_users')) || [];
  const foundUser = localUsers.find(u => u.email === email && u.password === password);

  if (foundUser) {
    return foundUser;
  }

  throw new Error('E-posta veya şifre hatalı!');
};

export const getAllUsers = async () => {
  return JSON.parse(localStorage.getItem('cinemania_all_users')) || [];
};
// Kullanıcıya özel kütüphane anahtarını getiren yardımcı fonksiyon
export const getUserLibraryKey = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    return null; // Kullanıcı giriş yapmamışsa null dönüyoruz
  }
  return `cinemania_library_${currentUser.id}`;
};