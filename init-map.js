// === ІМПОРТИ ===
import mapboxgl from 'https://cdn.skypack.dev/mapbox-gl';
import { mapboxToken, mapboxStyle } from './mapbox-config.js';

// === ІНІЦІАЛІЗАЦІЯ КАРТИ (Mapbox GL JS) ===
export const map = new mapboxgl.Map({
  container: 'map',
  style: mapboxStyle,
  center: [30.52, 50.45],
  zoom: 12,
    accessToken: mapboxToken 
  });