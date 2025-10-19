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
      // Мобільний: автоматичний показ при зумі 17+
      const MOBILE_AUTO_POPUP_ZOOM = 19;
      const MAGNETIC_MARGIN = -16; // Ще менше - попапи можуть виходити максимум на 20px
      let currentVisibleZones = new Map();
      
      const showVisibleZonePreviews = () => {
        const zoom = map.getZoom();
        
        // Ховаємо всі попапи на зумі < 17
        if (zoom < MOBILE_AUTO_POPUP_ZOOM) {
          if (currentVisibleZones.size > 0) {
            currentVisibleZones.forEach((popupEl) => {
              popupEl.remove();
            });
            currentVisibleZones.clear();
          }
          return;
        }
        
        // Отримуємо всі видимі зони на екрані
        const features = map.queryRenderedFeatures({ layers: ['zone-polygons'] });
        const newVisibleZones = new Set();
        const popupsToPosition = []; // Масив попапів для позиціонування
        
        // Розміри вікна (не canvas!) для розрахунку магніту
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Крок 1: Створюємо всі попапи
        features.forEach(feature => {
          const address = feature.properties.address;
          const zoneType = feature.properties.zoneType;
          const zoneId = `${address}:${zoneType}`;
          
          newVisibleZones.add(zoneId);
          
          // Знаходимо дані про ярмарок та зону
          const fair = fairs.find(f => f.address === address);
          if (!fair) return;
          
          const zone = fair.zones.find(z => z.zoneType === zoneType);
          if (!zone || !zone.geometry) return;
          
          // Обчислюємо центроїд полігону зони
          const coords = zone.geometry.coordinates[0];
          let sumX = 0, sumY = 0;
          coords.forEach(([lng, lat]) => {
            sumX += lng;
            sumY += lat;
          });
          const centroidLng = sumX / coords.length;
          const centroidLat = sumY / coords.length;
          
          // Проектуємо центроїд на координати екрану
          const projected = map.project([centroidLng, centroidLat]);
          
          // Створюємо або отримуємо попап
          let popupEl = currentVisibleZones.get(zoneId);
          
          if (!popupEl) {
            popupEl = document.createElement('div');
            popupEl.className = 'mobile-zone-preview glass floating';
            popupEl.innerHTML = getZonePopupContent(zone, fair);
            popupEl.style.position = 'fixed';
            // Ставимо в (0,0) з opacity 0 щоб виміряти розміри
            popupEl.style.left = '0px';
            popupEl.style.top = '0px';
            popupEl.style.opacity = '0';
            popupEl.style.visibility = 'visible'; // ВАЖЛИВО: visible щоб браузер відрендерив
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
        
        // Крок 2: Позиціонуємо всі попапи після того як браузер їх відрендерив
        requestAnimationFrame(() => {
          popupsToPosition.forEach(({ element, centerX, centerY, zoneId }) => {
            // Отримуємо розміри (тепер вони мають бути правильні!)
            const rect = element.getBoundingClientRect();
            const popupWidth = rect.width;
            const popupHeight = rect.height;
            
            // Обчислюємо ідеальну позицію (центр попапу над центроїдом)
            let idealLeft = centerX - (popupWidth / 2);
            let idealTop = centerY - (popupHeight / 2);
            
            // Магніт: попап може виходити максимум на MAGNETIC_MARGIN за межі екрану
            // Ліва межа: попап може виходити на MAGNETIC_MARGIN пікселів зліва
            const minLeft = -MAGNETIC_MARGIN;
            // Права межа: лівий край попапу може бути максимум тут щоб правий край виходив на MAGNETIC_MARGIN
            const maxLeft = screenWidth - popupWidth + MAGNETIC_MARGIN;
            // Верхня межа
            const minTop = -MAGNETIC_MARGIN;
            // Нижня межа
            const maxTop = screenHeight - popupHeight + MAGNETIC_MARGIN;
            
            // Обмежуємо позицію в діапазоні
            const finalLeft = Math.max(minLeft, Math.min(maxLeft, idealLeft));
            const finalTop = Math.max(minTop, Math.min(maxTop, idealTop));
            
            // Перевіряємо чи попап взагалі видно
            // Ховаємо тільки якщо попап ПОВНІСТЮ за межами екрану
            const isCompletelyHidden = 
              finalLeft + popupWidth < 0 ||     // повністю зліва
              finalLeft > screenWidth ||        // повністю справа
              finalTop + popupHeight < 0 ||     // повністю зверху
              finalTop > screenHeight;          // повністю знизу
            
            if (isCompletelyHidden) {
              element.remove();
              currentVisibleZones.delete(zoneId);
              return;
            }
            
            // Позиціонуємо та показуємо попап
            element.style.left = `${finalLeft}px`;
            element.style.top = `${finalTop}px`;
            element.style.opacity = '1';
          });
        });
        
        // Крок 3: Видаляємо попапи які більше не видимі
        currentVisibleZones.forEach((popupEl, zoneId) => {
          if (!newVisibleZones.has(zoneId)) {
            popupEl.remove();
            currentVisibleZones.delete(zoneId);
          }
        });
      };
      
      // Показуємо попапи при зміні зуму
      map.on('zoomend', showVisibleZonePreviews);
      
      // Оновлюємо попапи при русі карти
      map.on('move', showVisibleZonePreviews);
      
      // Початковий показ після завантаження карти
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