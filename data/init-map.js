// === ІМПОРТИ ===
import * as mapboxgl from 'https://cdn.skypack.dev/mapbox-gl';
import { mapboxToken, mapboxStyle } from './mapbox-config.js';
import { loadMapState, createDebouncedSave } from './map-state.js';

// Завантажуємо збережений стан карти (або дефолтний)
const mapState = loadMapState();

// === ІНІЦІАЛІЗАЦІЯ КАРТИ (Mapbox GL JS) ===
export const map = new mapboxgl.Map({
  container: 'map',
  style: mapboxStyle,
  center: mapState.center,
  zoom: mapState.zoom,
  pitch: mapState.pitch,
  bearing: mapState.bearing,
  minZoom: 12,
  maxBounds: [
    [30.30, 50.35], // SW
    [30.72, 50.55]  // NE
  ],
  accessToken: mapboxToken
});

// Створюємо debounced функцію збереження
const debouncedSave = createDebouncedSave(map, 1000);

// Зберігаємо позицію карти при її зміні
map.on('moveend', debouncedSave);
map.on('zoomend', debouncedSave);
map.on('pitchend', debouncedSave);
map.on('rotateend', debouncedSave);

// Зберігаємо при закритті сторінки
window.addEventListener('beforeunload', () => {
  try {
    const state = {
      center: [map.getCenter().lng, map.getCenter().lat],
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      timestamp: Date.now()
    };
    localStorage.setItem('kyiv-fairs-map-state-v1', JSON.stringify(state));
  } catch (e) {
    // Ігноруємо помилки при закритті
  }
});