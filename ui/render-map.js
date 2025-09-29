// === render-map.js ===
// Візуалізація шарів для ярмарків і зон з hover логікою

import { setupWeekdayFilter } from '../logic/weekday-filter.js';
import { createPopupAt } from './popups.js';
import { createZonePopupAt, closeZonePopup } from './zone-popups.js';

export function renderLayers(map, fairs) {
  // Перетворення fairs у flat-масив features для GeoJSON
  const features = [];
  let featureId = 0; // Лічильник для унікальних ID

  fairs.forEach(fair => {
    // Полігон ярмарку
    if (fair.polygon) {
      features.push({
        type: 'Feature',
        id: featureId++, // Додаємо унікальний ID
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
        id: featureId++, // Додаємо унікальний ID
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
        id: featureId++, // Додаємо унікальний ID
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
        '#0022AA', // Темніший синій при ховері
        '#0033FF'  // Звичайний синій
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

    // === Попапи для ярмарків (залишаються на клік) ===
    map.on('click', 'fair-points', (e) => {
      const feature = e.features[0];
      createPopupAt(map, fairs, feature, feature.geometry.coordinates);
    });

    map.on('click', 'fair-polygons', (e) => {
      const feature = e.features[0];
      createPopupAt(map, fairs, feature, e.lngLat);
    });

    // === Попапи для торгових зон: hover на десктопі, клік на мобільному ===
    let hoveredZoneId = null;

    if (!window.isMobile) {
      // Десктоп: показуємо попап по ховеру що слідує за курсором
      map.on('mouseenter', 'zone-polygons', (e) => {
        const feature = e.features[0];
        
        // Встановлюємо hover стан для темнішого кольору
        if (feature.id !== undefined && feature.id !== null) {
          // Очищаємо попередній hover перед встановленням нового
          if (hoveredZoneId !== null && hoveredZoneId !== feature.id) {
            map.setFeatureState(
              { source: 'fairs', id: hoveredZoneId },
              { hover: false }
            );
          }
          hoveredZoneId = feature.id;
          map.setFeatureState(
            { source: 'fairs', id: hoveredZoneId },
            { hover: true }
          );
        }
        
        // Перевіряємо мінімальний зум
        if (map.getZoom() >= 14.5) {
          createZonePopupAt(map, fairs, feature, e.lngLat);
        }
      });

      // mousemove для слідування попапу за курсором
      map.on('mousemove', 'zone-polygons', (e) => {
        // Перевіряємо мінімальний зум
        if (map.getZoom() >= 14.5 && e.features.length > 0) {
          const feature = e.features[0];
          
          // Оновлюємо hover state при переході між зонами
          if (feature.id !== undefined && feature.id !== null && hoveredZoneId !== null && hoveredZoneId !== feature.id) {
            try {
              map.setFeatureState(
                { source: 'fairs', id: hoveredZoneId },
                { hover: false }
              );
            } catch (e) {
              console.warn('Failed to clear previous hover state:', e);
            }
            // Встановлюємо новий hover
            hoveredZoneId = feature.id;
            map.setFeatureState(
              { source: 'fairs', id: hoveredZoneId },
              { hover: true }
            );
          }
          
          // Оновлюємо позицію та контент попапу
          createZonePopupAt(map, fairs, feature, e.lngLat);
        }
      });

      map.on('mouseleave', 'zone-polygons', () => {
        // Прибираємо hover стан
        if (hoveredZoneId !== null) {
          try {
            map.setFeatureState(
              { source: 'fairs', id: hoveredZoneId },
              { hover: false }
            );
          } catch (e) {
            console.warn('Failed to clear hover state:', e);
          }
          hoveredZoneId = null;
        }
        
        // Закриваємо попап коли прибираємо курсор
        closeZonePopup();
      });

      // Закриваємо попап при зміні зуму нижче мінімального
      map.on('zoom', () => {
        if (map.getZoom() < 14.5) {
          closeZonePopup();
        }
      });
    } else {
      // Мобільний: залишаємо клік
      map.on('click', 'zone-polygons', (e) => {
        const feature = e.features[0];
        createZonePopupAt(map, fairs, feature, e.lngLat);
      });
    }

    // === Курсори для hover ефектів ===
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