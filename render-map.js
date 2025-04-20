// === render-map.js ===
// Візуалізація шарів і попапів для ярмарків і зон

import mapboxgl from 'https://cdn.skypack.dev/mapbox-gl';
import { setupWeekdayFilter } from './weekday-filter.js';

export function renderLayers(map, features) {
  map.addSource('fairs', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features,
    },
  });

  map.addLayer({
    id: 'fair-polygons',
    type: 'fill',
    source: 'fairs',
    paint: {
      'fill-color': '#ffa500',
      'fill-opacity': 0.2,
    },
    filter: ['all', ['==', ['get', 'type'], 'polygon']],
  });

  map.addLayer({
    id: 'fair-points',
    type: 'circle',
    source: 'fairs',
    paint: {
      'circle-radius': 6,
      'circle-color': '#ffa500',
    },
    filter: ['all', ['==', ['get', 'type'], 'point']],
  });

  map.addLayer({
    id: 'zone-polygons',
    type: 'fill',
    source: 'fairs',
    paint: {
      'fill-color': '#4CAF50',
      'fill-opacity': 0.15,
    },
    filter: ['==', ['get', 'type'], 'zone'],
  });

  // Ініціалізація фільтра по днях тижня
  setupWeekdayFilter(map);

  // Попапи й курсор
  map.once('idle', () => {
    map.on('click', 'fair-points', (e) => {
      const feature = e.features[0];
      const props = feature.properties;

      new mapboxgl.Popup()
        .setLngLat(feature.geometry.coordinates)
        .setHTML(`
          <strong>${props.address}</strong><br/>
          Дата: ${props.date_release}<br/>
          День тижня: ${props.weekday}
        `)
        .addTo(map);
    });

    map.on('mouseenter', 'fair-points', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'fair-points', () => {
      map.getCanvas().style.cursor = '';
    });
  });
}
