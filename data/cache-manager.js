// data/cache-manager.js
// Система розумного кешування для API даних про ярмарки

const CACHE_KEY_SITES = 'kyiv-fairs-sites-v1';
const CACHE_KEY_ZONES = 'kyiv-fairs-zones-v1'; 
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 години в мілісекундах

// Перевіряємо чи актуальний кеш (не старше 24 годин)
function isCacheValid(timestamp) {
  return timestamp && (Date.now() - timestamp < CACHE_DURATION);
}

// Спроба завантажити сайти з кешу
export async function getCachedSites() {
  try {
    const cached = localStorage.getItem(CACHE_KEY_SITES);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (isCacheValid(timestamp)) {
        console.log('✅ Завантажено сайти з кешу');
        return { data, fromCache: true };
      } else {
        console.log('⏰ Кеш сайтів застарів, потрібне оновлення');
      }
    }
  } catch (e) {
    console.warn('❌ Помилка читання кешу сайтів:', e);
    // Очищаємо пошкоджений кеш
    localStorage.removeItem(CACHE_KEY_SITES);
  }
  return null;
}

// Збереження сайтів в кеш
export function setCachedSites(data) {
  try {
    localStorage.setItem(CACHE_KEY_SITES, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    console.log('💾 Сайти збережено в кеш');
  } catch (e) {
    console.warn('❌ Не вдалося зберегти сайти в кеш:', e);
  }
}

// Аналогічні функції для зон торгівлі
export async function getCachedZones() {
  try {
    const cached = localStorage.getItem(CACHE_KEY_ZONES);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (isCacheValid(timestamp)) {
        console.log('✅ Завантажено зони з кешу');
        return { data, fromCache: true };
      } else {
        console.log('⏰ Кеш зон застарів, потрібне оновлення');
      }
    }
  } catch (e) {
    console.warn('❌ Помилка читання кешу зон:', e);
    localStorage.removeItem(CACHE_KEY_ZONES);
  }
  return null;
}

export function setCachedZones(data) {
  try {
    localStorage.setItem(CACHE_KEY_ZONES, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    console.log('💾 Зони збережено в кеш');
  } catch (e) {
    console.warn('❌ Не вдалося зберегти зони в кеш:', e);
  }
}

// Функція для очищення застарілого кешу (корисно для майбутніх оновлень)
export function clearCache() {
  localStorage.removeItem(CACHE_KEY_SITES);
  localStorage.removeItem(CACHE_KEY_ZONES);
  console.log('🗑️ Кеш очищено');
}