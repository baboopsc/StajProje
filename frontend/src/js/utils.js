/**
 * @param {string} dateString 
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return 'Bilinmiyor';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('tr-TR', options);
}

/**
 * @param {number} rating 
 * @returns {string}
 */
export function getRatingBadgeClass(rating) {
  if (rating >= 7.5) return 'badge-high';
  if (rating >= 5.0) return 'badge-mid';
  return 'badge-low';
}

/**
 * @param {string} key 
 * @param {any} value 
 */
export function setToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Veri kaydedilirken bir hata oluştu:', error);
  }
}

/**
 * @param {string} key 
 * @returns {any[]}
 */
export function getFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Veri okunurken bir hata oluştu:', error);
    return [];
  }
}

/**
 * @param {Function} func 
 * @param {number} delay 
 * @returns {Function}
 */
export function debounce(func, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
}