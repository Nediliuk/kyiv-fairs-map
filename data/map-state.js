// data/map-state.js
// Система збереження та відновлення позиції карти

const MAP_STATE_KEY = 'kyiv-fairs-map-state-v1';
const STATE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 днів в мілісекундах

// Дефолтна позиція карти (ваші поточні налаштування)
const DEFAULT_MAP_STATE = {
  center: [30.541831, 50.421004],
  zoom: 17,
  pitch: 57.75,
  bearing: 36.96
};

/**
 * Зберігає поточну позицію карти в localStorage
 * @param {mapboxgl.Map} map - екземпляр карти Mapbox
 */
export function saveMapState(map) {
  try {
    const state = {
      center: [map.getCenter().lng, map.getCenter().lat], // [lng, lat] формат
      zoom: map.getZoom(),
      pitch: map.getPitch(), 
      bearing: map.getBearing(),
      timestamp: Date.now()
    };
    
    localStorage.setItem(MAP_STATE_KEY, JSON.stringify(state));
    console.log('📍 Позицію карти збережено:', {
      center: state.center,
      zoom: Math.round(state.zoom * 100) / 100
    });
    
  } catch (e) {
    console.warn('⚠️ Не вдалося зберегти позицію карти:', e);
  }
}

/**
 * Завантажує збережену позицію карти або повертає дефолтну
 * @returns {Object} об'єкт з параметрами карти (center, zoom, pitch, bearing)
 */
export function loadMapState() {
  try {
    const saved = localStorage.getItem(MAP_STATE_KEY);
    
    if (saved) {
      const state = JSON.parse(saved);
      
      // Перевіряємо чи не занадто старий стан (більше 30 днів)
      if (state.timestamp && (Date.now() - state.timestamp < STATE_EXPIRY)) {
        
        // Валідуємо дані перед поверненням
        if (isValidMapState(state)) {
          console.log('✅ Відновлено збережену позицію карти:', {
            center: state.center,
            zoom: Math.round(state.zoom * 100) / 100
          });
          return state;
        } else {
          console.warn('⚠️ Збережена позиція карти некоректна, використовуємо дефолтну');
        }
      } else {
        console.log('⏰ Збережена позиція карти застаріла, використовуємо дефолтну');
      }
    }
    
  } catch (e) {
    console.warn('❌ Помилка при завантаженні позиції карти:', e);
    localStorage.removeItem(MAP_STATE_KEY);
  }
  
  console.log('🗺️ Використовуємо дефолтну позицію карти');
  return DEFAULT_MAP_STATE;
}

/**
 * Перевіряє чи коректні збережені дані позиції карти
 */
function isValidMapState(state) {
  if (!state.center || !Array.isArray(state.center) || state.center.length !== 2) {
    return false;
  }
  
  const [lng, lat] = state.center;
  if (lng < 22 || lng > 40 || lat < 44 || lat > 52) {
    return false;
  }
  
  if (typeof state.zoom !== 'number' || state.zoom < 8 || state.zoom > 22) {
    return false;
  }
  
  if (typeof state.pitch !== 'number' || state.pitch < 0 || state.pitch > 60) {
    return false;
  }
  
  if (typeof state.bearing !== 'number') {
    return false;
  }
  
  return true;
}

/**
 * Створює debounced функцію збереження
 */
export function createDebouncedSave(map, delay = 1000) {
  let timeout;
  
  return function() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      saveMapState(map);
    }, delay);
  };
}