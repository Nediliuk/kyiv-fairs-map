// === load-fair-sites.js ===
// Завантаження запланованих ярмарків з MapServer (layer 1)

const SITES_API_URL =
  'https://gisserver.kyivcity.gov.ua/mayno/rest/services/KYIV_API/Trade_api/MapServer/1/query?where=1%3D1&outFields=*&returnGeometry=true&f=pjson&outSR=4326';

// Головна функція: завантажує полігони ярмарків і повертає GeoJSON features
export async function loadFairSites() {
  try {
    const res = await fetch(SITES_API_URL);
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

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
        properties: {
          ...props,
          type: 'polygon',
          date_release: props.date_release,
        },
      });
    });

    return features;
  } catch (e) {
    console.error('❌ Помилка при завантаженні ярмарків:', e);
    return [];
  }
}
