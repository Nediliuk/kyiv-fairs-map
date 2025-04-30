// === ІМПОРТИ ===
import * as mapboxgl from 'https://cdn.skypack.dev/mapbox-gl';
import { mapboxToken, mapboxStyle } from './mapbox-config.js';

// === ІНІЦІАЛІЗАЦІЯ КАРТИ (Mapbox GL JS) ===
export const map = new mapboxgl.Map({
  container: 'map',
  style: mapboxStyle,
  center: [30.541831, 50.421004  ],
  pitch: 57.75,
  bearing: 36.96,
  zoom: 17,
  minzoom: 13,
  maxBounds: [
    [30.30, 50.35], // SW
    [30.72, 50.55]  // NE
  ],
  accessToken: mapboxToken
});