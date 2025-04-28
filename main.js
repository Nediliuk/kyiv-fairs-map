// === main.js ===

// Імпорти
import { map } from './init-map.js';
import { loadPlannedMarkets } from './load-planned.js';
import { loadZones } from './load-zones.js';
import { renderLayers } from './render-map.js';

// Підключення UI
async function loadUI() {
  const response = await fetch('./ui.html');
  const html = await response.text();
  document.getElementById('ui-container').innerHTML = html;
}
loadUI();

// Завантаження карти і даних
map.on('load', async () => {
  const fairFeatures = await loadPlannedMarkets();
  const zoneFeatures = await loadZones();

  const allFeatures = [...fairFeatures, ...zoneFeatures];
  renderLayers(map, allFeatures);
});
