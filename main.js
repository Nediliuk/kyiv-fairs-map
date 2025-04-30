import { map } from './data/init-map.js';
import { loadFairSites } from './data/load-fair-sites.js';
import { loadFairZones } from './data/load-fair-zones.js';
import { assembleFairs } from './logic/fair-assembly.js';
import { renderLayers } from './ui/render-map.js';

// Підключення UI 
async function loadUI() {
  const response = await fetch('./ui/ui.html');
  const html = await response.text();
  document.getElementById('ui-container').innerHTML = html;
}
loadUI();

// Коли карта завантажиться
map.on('load', async () => {
  const sites = await loadFairSites();
  const zones = await loadFairZones();

  const fairs = assembleFairs({ sites, zones });

  renderLayers(map, fairs);
});
