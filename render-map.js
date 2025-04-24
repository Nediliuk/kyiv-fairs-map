// === render-map.js ===
// Візуалізація шарів і попапів для ярмарків і зон

import * as mapboxgl from 'https://cdn.skypack.dev/mapbox-gl';
import { setupWeekdayFilter } from './weekday-filter.js';

export function renderLayers(map, features) {
  map.addSource('fairs', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features,
    },
  });

  // Знаходимо шар 3D-будинків
  const buildingLayer = map.getStyle().layers.find(l => l.id === 'building-extrusion');
  const insertBefore = buildingLayer?.id;

  map.addLayer({
    id: 'fair-polygons',
    type: 'fill',
    source: 'fairs',
    paint: {
      'fill-color': '#F2EB3C',
      'fill-opacity': 0.15,
    },
    filter: ['==', ['get', 'type'], 'polygon'],
  }, insertBefore);

  map.addLayer({
    id: 'zone-polygons',
    type: 'fill-extrusion',
    source: 'fairs',
    paint: {
      'fill-extrusion-color': '#0033FF',
      'fill-extrusion-height': 2.3,
      'fill-extrusion-base': 0,
    },
    filter: ['==', ['get', 'type'], 'zone']
  }, insertBefore);

  map.addLayer({
    id: 'fair-points',
    type: 'circle',
    source: 'fairs',
    paint: {
      'circle-radius': 6,
      'circle-color': '#0033FF',
    },
    filter: ['==', ['get', 'type'], 'point'],
  });

  setupWeekdayFilter(map);

  map.once('idle', () => {
    // Прибираємо лоадер для карти
    const loader = document.getElementById('map-loader');
    if (loader) loader.style.display = 'none';
    document.body.classList.add('map-ready');
    
    let activePopup;

    const createPopupAt = (feature, lngLat) => {
      const props = feature.properties;

      if (activePopup) activePopup.remove();

      activePopup = new mapboxgl.Popup({
        offset: 16,
        closeButton: false,
      })
        .setLngLat(lngLat)
        .setHTML(`
          <div class="popup-address">${props.address}</div>
          <div class="popup-details">
            <span class="popup-weekday">${props.weekday}</span>
          </div>
        `)
        .addTo(map);
    };

    map.on('click', 'fair-points', (e) => {
      const feature = e.features[0];
      createPopupAt(feature, feature.geometry.coordinates);
    });

    map.on('click', 'fair-polygons', (e) => {
      const feature = e.features[0];
      createPopupAt(feature, e.lngLat); // Показати попап під курсором
    });
  });

  map.on('mouseenter', 'fair-points', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'fair-points', () => {
    map.getCanvas().style.cursor = '';
  });
}
