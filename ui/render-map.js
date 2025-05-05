// === render-map.js ===
// Візуалізація шарів і попапів для ярмарків і зон

import * as mapboxgl from 'https://cdn.skypack.dev/mapbox-gl';
import { setupWeekdayFilter } from '/kyiv-fairs-map/logic/weekday-filter.js';

export function renderLayers(map, fairs) {
  // Перетворення fairs у flat-масив features для GeoJSON
  const features = [];

  fairs.forEach(fair => {
    // Полігон ярмарку
    if (fair.polygon) {
      features.push({
        type: 'Feature',
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

  map.once('idle', () => {

    // Підключення фільтра днів тижня
    setupWeekdayFilter(map, fairs);

    // Прибирання лоадеру
    const loader = document.getElementById('map-loader');
    if (loader) loader.style.display = 'none';
    document.body.classList.add('map-ready');

    // === Додавання попапів ===
    let activePopup;

    // Форматування дати у вигляді "1 травня"
    function formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
      });
    }

    // Відмінювання днів тижня (множина, місцевий відмінок)
    const weekdayPluralLocative = {
      понеділок: 'понеділок',
      вівторок: 'вівторок',
      середа: 'середу',
      четвер: 'четвер',
      пʼятниця: 'пʼятницю',
      субота: 'суботу',
      неділя: 'неділю',
    };

    // Форматування списку днів тижня з відмінюванням
    function formatWeekdaysList(days) {
      const declined = days.map(d => weekdayPluralLocative[d.toLowerCase()] || d);
      if (declined.length === 1) return declined[0];
      if (declined.length === 2) return `${declined[0]} та ${declined[1]}`;
      return `${declined.slice(0, -1).join(', ')} та ${declined[declined.length - 1]}`;
    }

    // Основна функція створення попапу
    const createPopupAt = (feature, lngLat) => {
      const address = feature.properties.address;
      const fair = fairs.find(f => f.address === address);
      if (!fair) return;

      if (activePopup) activePopup.remove();

      // Знаходимо найближчу дату в майбутньому (або сьогодні)
      const nearest = fair.dates
        .map(d => ({ ...d, dateObj: new Date(d.date) }))
        .filter(d => d.dateObj >= new Date())
        .sort((a, b) => a.dateObj - b.dateObj)[0];

      // Збираємо унікальні дні тижня (порядок зберігається)
      const uniqueWeekdays = [...new Set(fair.dates.map(d => d.weekday))];

      activePopup = new mapboxgl.Popup({
        offset: 16,
        closeButton: false,
      })
        .setLngLat(lngLat)
        .setHTML(`
          <div class="popup-address">${fair.address}</div>
          <div class="popup-details">
            <div>Ярмарки проходять у ${formatWeekdaysList(uniqueWeekdays).toLowerCase()}</div>
            ${nearest
              ? `<div>Наступний — у ${weekdayPluralLocative[nearest.weekday.toLowerCase()] || nearest.weekday.toLowerCase()} ${formatDate(nearest.date)}</div>`
              : '<div><em>Наступну дату ще не оголошено</em></div>'}
          </div>
        `)
        .addTo(map);
    };

    // Попап над точкою
    map.on('click', 'fair-points', (e) => {
      const feature = e.features[0];
      createPopupAt(feature, feature.geometry.coordinates);
    });

    // Попап під курсором (для полігону)
    map.on('click', 'fair-polygons', (e) => {
      const feature = e.features[0];
      createPopupAt(feature, e.lngLat);
    });

    // Наведення на точку — зміна курсору
    map.on('mouseenter', 'fair-points', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'fair-points', () => {
      map.getCanvas().style.cursor = '';
    });
  });
}
