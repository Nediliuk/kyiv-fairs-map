// === render-map.js ===
// Візуалізація шарів для ярмарків і зон з hover логікою

import { setupWeekdayFilter } from '../logic/weekday-filter.js';
import { createPopupAt } from './popups.js';
import { createZonePopupAt, closeZonePopup, getZonePopupContent } from './zone-popups.js';

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
      // Мобільний: автоматичний показ при зумі 19+
      const MOBILE_AUTO_POPUP_ZOOM = 19;
      const MAGNETIC_MARGIN = -16; // Попапи залишаються на 16px всередині екрану
      let currentVisibleZones = new Map();
      let popupSizeCache = new Map(); // Кешуємо розміри попапів для швидкості
      let isUpdating = false; // Запобігає множинним одночасним оновленням
      
      // Створюємо індекс для швидкого пошуку fairs (O(1) замість O(n))
      const fairsByAddress = new Map();
      fairs.forEach(fair => {
        fairsByAddress.set(fair.address, fair);
      });
      
      const showVisibleZonePreviews = () => {
        // Якщо вже оновлюємо - пропускаємо
        if (isUpdating) return;
        isUpdating = true;
        
        const zoom = map.getZoom();
        
        // Ховаємо всі попапи на зумі < 19
        if (zoom < MOBILE_AUTO_POPUP_ZOOM) {
          if (currentVisibleZones.size > 0) {
            currentVisibleZones.forEach((popupEl) => {
              popupEl.remove();
            });
            currentVisibleZones.clear();
            popupSizeCache.clear();
          }
          isUpdating = false;
          return;
        }
        
        // Отримуємо всі видимі зони
        const features = map.queryRenderedFeatures({ layers: ['zone-polygons'] });
        const newVisibleZones = new Set();
        const popupsToPosition = [];
        
        // Розміри вікна
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Крок 1: Створюємо попапи (тільки нові)
        features.forEach(feature => {
          const address = feature.properties.address;
          const zoneType = feature.properties.zoneType;
          const zoneId = `${address}:${zoneType}`;
          
          newVisibleZones.add(zoneId);
          
          // Використовуємо індекс замість find() - швидше
          const fair = fairsByAddress.get(address);
          if (!fair) return;
          
          const zone = fair.zones.find(z => z.zoneType === zoneType);
          if (!zone || !zone.geometry) return;
          
          // Обчислюємо центроїд (оптимізований цикл)
          const coords = zone.geometry.coordinates[0];
          let sumX = 0, sumY = 0;
          const coordsLength = coords.length;
          for (let i = 0; i < coordsLength; i++) {
            sumX += coords[i][0];
            sumY += coords[i][1];
          }
          const centroidLng = sumX / coordsLength;
          const centroidLat = sumY / coordsLength;
          
          const projected = map.project([centroidLng, centroidLat]);
          
          // Створюємо попап тільки якщо його ще немає
          let popupEl = currentVisibleZones.get(zoneId);
          
          if (!popupEl) {
            popupEl = document.createElement('div');
            popupEl.className = 'mobile-zone-preview glass floating';
            popupEl.innerHTML = getZonePopupContent(zone, fair);
            popupEl.style.position = 'fixed';
            popupEl.style.left = '0';
            popupEl.style.top = '0';
            popupEl.style.opacity = '0';
            document.body.appendChild(popupEl);
            currentVisibleZones.set(zoneId, popupEl);
          }
          
          popupsToPosition.push({
            element: popupEl,
            centerX: projected.x,
            centerY: projected.y,
            zoneId: zoneId
          });
        });
        
        // Крок 2: Позиціонуємо попапи (з GPU прискоренням)
        requestAnimationFrame(() => {
          popupsToPosition.forEach(({ element, centerX, centerY, zoneId }) => {
            // Використовуємо кеш для розмірів
            let popupWidth, popupHeight;
            
            if (popupSizeCache.has(zoneId)) {
              const cached = popupSizeCache.get(zoneId);
              popupWidth = cached.width;
              popupHeight = cached.height;
            } else {
              const rect = element.getBoundingClientRect();
              popupWidth = rect.width;
              popupHeight = rect.height;
              // Кешуємо розміри для наступних разів
              popupSizeCache.set(zoneId, { width: popupWidth, height: popupHeight });
            }
            
            // Обчислюємо позицію
            const idealLeft = centerX - (popupWidth / 2);
            const idealTop = centerY - (popupHeight / 2);
            
            const minLeft = -MAGNETIC_MARGIN;
            const maxLeft = screenWidth - popupWidth + MAGNETIC_MARGIN;
            const minTop = -MAGNETIC_MARGIN;
            const maxTop = screenHeight - popupHeight + MAGNETIC_MARGIN;
            
            const finalLeft = Math.max(minLeft, Math.min(maxLeft, idealLeft));
            const finalTop = Math.max(minTop, Math.min(maxTop, idealTop));
            
            // Перевіряємо видимість
            const isCompletelyHidden = 
              finalLeft + popupWidth < 0 ||
              finalLeft > screenWidth ||
              finalTop + popupHeight < 0 ||
              finalTop > screenHeight;
            
            if (isCompletelyHidden) {
              element.remove();
              currentVisibleZones.delete(zoneId);
              popupSizeCache.delete(zoneId);
              return;
            }
            
            // Використовуємо transform для GPU прискорення
            element.style.transform = `translate(${finalLeft}px, ${finalTop}px)`;
            element.style.opacity = '1';
          });
          
          isUpdating = false;
        });
        
        // Крок 3: Видаляємо зникаючі попапи
        currentVisibleZones.forEach((popupEl, zoneId) => {
          if (!newVisibleZones.has(zoneId)) {
            popupEl.remove();
            currentVisibleZones.delete(zoneId);
            popupSizeCache.delete(zoneId);
          }
        });
      };
      
      // Throttle для move події (оновлюємо максимум кожні 100ms)
      let moveTimeout;
      const throttledUpdate = () => {
        if (moveTimeout) return;
        moveTimeout = setTimeout(() => {
          showVisibleZonePreviews();
          moveTimeout = null;
        }, 10);
      };
      
      // Показуємо при зміні зуму
      map.on('zoomend', showVisibleZonePreviews);
      
      // Throttled оновлення при русі
      map.on('move', throttledUpdate);
      
      // Початковий показ
      map.once('idle', showVisibleZonePreviews);
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