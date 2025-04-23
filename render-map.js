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