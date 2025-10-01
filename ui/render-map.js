// === render-map.js ===
// Візуалізація шарів для ярмарків і зон з hover логікою

import { setupWeekdayFilter } from '../logic/weekday-filter.js';
import { createPopupAt } from './popups.js';
import { createZonePopupAt, closeZonePopup } from './zone-popups.js';

export function renderLayers(map, fairs) {
  // Перетворення fairs у flat-масив features для GeoJSON
  const features = [];
  let featureId = 0;

  fairs.forEach(fair => {
    // Полігон ярмарку
    if (fair.polygon) {
      features.push({
        type: 'Feature',
        id: featureId++,
        geometry: fair.polygon,
        properties: {
          type: 'polygon',
          address: fair.address,
          weekday: fair.dates[0]?.weekday || '',
        }
      });
    }

    // Центроїд ярмарку
    if (fair.centroid) {
      features.push({
        type: 'Feature',
        id: featureId++,
        geometry: {
          type: 'Point',
          coordinates: fair.centroid,
        },
        properties: {
          type: 'point',
          address: fair.address,
          weekday: fair.dates[0]?.weekday || '',
        }
      });
    }

    // Зони (палатки)
    fair.zones.forEach(zone => {
      features.push({
        type: 'Feature',
        id: featureId++,
        geometry: zone.geometry,
        properties: {
          type: 'zone',
          address: fair.address,
          zoneType: zone.zoneType,
        }
      });
    });
  });

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
      'fill-opacity': 0.70,
    },
    filter: ['==', ['get', 'type'], 'polygon'],
  }, insertBefore);

  map.addLayer({
    id: 'zone-polygons',
    type: 'fill-extrusion',
    source: 'fairs',
    paint: {
      'fill-extrusion-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#0022AA',
        '#0033FF'
      ],
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
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        13, 6,
        14, 8,
        17, 8,
      ],
      'circle-color': '#0033FF',
      'circle-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14.5, 1,
        15, 0,
      ]
    },
    filter: ['==', ['get', 'type'], 'point'],
  });

  map.once('idle', () => {
    setupWeekdayFilter(map, fairs);

    const loader = document.getElementById('map-loader');
    if (loader) loader.style.display = 'none';
    document.body.classList.add('map-ready');

    // === Попапи для ярмарків ===
    map.on('click', 'fair-points', (e) => {
      const feature = e.features[0];
      createPopupAt(map, fairs, feature, feature.geometry.coordinates);
    });

    map.on('click', 'fair-polygons', (e) => {
      const feature = e.features[0];
      createPopupAt(map, fairs, feature, e.lngLat);
    });

    // === Попапи для торгових зон ===
    let hoveredZoneId = null;
    const MIN_ZOOM = 14.5;

    // Helper функція для оновлення hover state
    const updateHoverState = (newFeatureId) => {
      if (hoveredZoneId !== null && hoveredZoneId !== newFeatureId) {
        map.setFeatureState(
          { source: 'fairs', id: hoveredZoneId },
          { hover: false }
        );
      }
      if (newFeatureId != null) {
        hoveredZoneId = newFeatureId;
        map.setFeatureState(
          { source: 'fairs', id: hoveredZoneId },
          { hover: true }
        );
      }
    };

    // Helper функція для очищення hover state
    const clearHoverState = () => {
      if (hoveredZoneId !== null) {
        map.setFeatureState(
          { source: 'fairs', id: hoveredZoneId },
          { hover: false }
        );
        hoveredZoneId = null;
      }
    };

    if (!window.isMobile) {
      // Десктоп: hover з слідуванням за курсором
      
      map.on('mouseenter', 'zone-polygons', (e) => {
        const feature = e.features[0];
        
        if (feature.id != null) {
          updateHoverState(feature.id);
        }
        
        if (map.getZoom() >= MIN_ZOOM) {
          createZonePopupAt(map, fairs, feature, e.lngLat);
        }
      });

      map.on('mousemove', 'zone-polygons', (e) => {
        if (map.getZoom() < MIN_ZOOM || e.features.length === 0) return;
        
        const feature = e.features[0];
        
        // Оновлюємо hover state тільки при зміні зони
        if (feature.id != null && hoveredZoneId !== feature.id) {
          updateHoverState(feature.id);
        }
        
        // Оновлюємо позицію попапу
        createZonePopupAt(map, fairs, feature, e.lngLat);
      });

      map.on('mouseleave', 'zone-polygons', () => {
        clearHoverState();
        closeZonePopup();
      });

      // Закриваємо попап при зміні зуму
      map.on('zoom', () => {
        if (map.getZoom() < MIN_ZOOM) {
          closeZonePopup();
        }
      });
      
    } else {
      // Мобільний: клік
      map.on('click', 'zone-polygons', (e) => {
        const feature = e.features[0];
        createZonePopupAt(map, fairs, feature, e.lngLat);
      });
    }

    // === Курсори ===
    map.on('mouseenter', 'fair-points', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'fair-points', () => {
      map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'zone-polygons', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'zone-polygons', () => {
      map.getCanvas().style.cursor = '';
    });
  });
}