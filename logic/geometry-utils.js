// === geometry-utils.js ===
// Утиліти для роботи з геометрією

/**
 * Обчислює центроїд полігона
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
  