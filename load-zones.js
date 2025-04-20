// === load-zones.js ===
// Завантаження зон торгівлі з MapServer (layer 2)

const ZONES_API_URL = 'https://gisserver.kyivcity.gov.ua/mayno/rest/services/KYIV_API/Trade_api/MapServer/2/query?where=1%3D1&outFields=*&returnGeometry=true&f=pjson&outSR=4326';

// Головна функція: завантажує зони і повертає GeoJSON features
export async function loadZones() {
  try {
    const res = await fetch(ZONES_API_URL);
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

      // Додаємо полігон з типом "zone"
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
        properties: {
          ...props,
          type: 'zone',
        },
      });
    });

    return features;
  } catch (e) {
    console.error('❌ Помилка при завантаженні зон торгівлі:', e);
    return [];
  }
}
