// === fair-assembly.js ===
// Збирання сутностей "fair" на основі даних сайтів і зон

import { calculateCentroid } from './geometry-utils.js';
import { getWeekdayName } from './date-utils.js';

export function assembleFairs({ sites, zones }) {
  const fairsByAddress = {};

  // 1. Спочатку збираємо дані з сайтів (полігонів і точок)
  sites.forEach(feature => {
    const { address, date_release, type } = feature.properties;
    if (!address) return;

    if (!fairsByAddress[address]) {
      fairsByAddress[address] = {
        address,
        dates: [],
        centroid: null,
        polygon: null,
        zones: [],
      };
    }

    if (type === 'polygon') {
      fairsByAddress[address].polygon = feature.geometry;
      const coords = feature.geometry.coordinates[0];
      if (coords) {
        fairsByAddress[address].centroid = calculateCentroid(coords);
      }
    }

    if (date_release) {
      const weekday = getWeekdayName(new Date(date_release));
      fairsByAddress[address].dates.push({ date: date_release, weekday });
    }
  });

  // 2. Додаємо зони для кожної адреси
  zones.forEach(zoneFeature => {
    const { address, zone_type } = zoneFeature.properties;
    if (address && fairsByAddress[address]) {
      fairsByAddress[address].zones.push({
        geometry: zoneFeature.geometry,
        zoneType: zone_type,
      });
    }
  });

  // 3. Повертаємо масив ярмарків
  return Object.values(fairsByAddress);
}
