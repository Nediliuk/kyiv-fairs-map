// === geometry-utils.js ===
// Утиліти для роботи з геометрією

/**
 * Обчислює центроїд полігона (arithmetic mean)
 * Використовується для полігонів ярмарків
 * @param {Array} coords - масив координат [lng, lat]
 * @returns {[number, number]} - координати центроїда
 */
export function calculateCentroid(coords) {
  let x = 0, y = 0;

  coords.forEach(([lng, lat]) => {
    x += lng;
    y += lat;
  });

  return [x / coords.length, y / coords.length];
}

/**
 * Обчислює центроїд через bounding box (точніше для прямокутників)
 * Використовується для торгових зон (палаток)
 * @param {Array} coords - масив координат [lng, lat]
 * @returns {[number, number]} - координати центроїда
 */
export function calculateZoneCentroid(coords) {
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  
  for (let i = 0; i < coords.length; i++) {
    const lng = coords[i][0];
    const lat = coords[i][1];
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}