// === load-planned.js ===
// Завантаження запланованих ярмарків з MapServer (layer 1)

import { getWeekdayName } from './date-utils.js';

const PLANNED_API_URL = 'https://gisserver.kyivcity.gov.ua/mayno/rest/services/KYIV_API/Trade_api/MapServer/1/query?where=1%3D1&outFields=*&returnGeometry=true&f=pjson&outSR=4326';

// Обчислює центр мас для полігону (центроїд)
function getCentroid(coords) {
  let x = 0, y = 0;
  coords.forEach(([lng, lat]) => {
    x += lng;
    y += lat;
  });
  return [x / coords.length, y / coords.length];
}

// Головна функція: завантажує дані про ярмарки і повертає GeoJSON features
export async function loadPlannedMarkets() {
  try {
    const res = await fetch(PLANNED_API_URL);
    const data = await res.json();

    if (!data.features || !Array.isArray(data.features)) {
      throw new Error('Некоректна структура відповіді');
    }

    const features = [];

    data.features.forEach(f => {
      const props = f.attributes;
      const rings = f.geometry?.rings?.[0];
      if (!rings) return;

      const coords = rings.map(([x, y]) => [x, y]);
      const [cx, cy] = getCentroid(coords);

      const dateRaw = props.date_release;
      const weekday = dateRaw ? getWeekdayName(new Date(dateRaw)) : null;

      // Додаємо полігон як окрему фічу
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
        properties: {
          ...props,
          type: 'polygon',
          weekday,
        },
      });

      // Додаємо точку на центроїд цього полігону
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [cx, cy],
        },
        properties: {
          ...props,
          type: 'point',
          weekday,
        },
      });
    });

    return features;
  } catch (e) {
    console.error('❌ Помилка при завантаженні ярмарків:', e);
    return [];
  }
}
