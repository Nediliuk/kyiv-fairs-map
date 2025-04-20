// === main.js ===

// Імпорти ініціалізованої карти, даних та рендеру
import { map } from './init-map.js';
import { loadPlannedMarkets } from './load-planned.js';
import { loadZones } from './load-zones.js';
import { renderLayers } from './render-map.js';

// Після завантаження стилю карти — завантажуємо дані та візуалізуємо
map.on('load', async () => {
  const fairFeatures = await loadPlannedMarkets();
  const zoneFeatures = await loadZones();

  const allFeatures = [...fairFeatures, ...zoneFeatures];

  renderLayers(map, allFeatures);
});
