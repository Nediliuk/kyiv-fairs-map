import { map } from '/data/init-map.js';
import { loadFairSites } from './data/load-fair-sites.js';
import { loadFairZones } from './data/load-fair-zones.js';
import { assembleFairs } from './logic/fair-assembly.js';
import { renderLayers } from './ui/render-map.js';
import { initMobileFilters } from './ui/mobile-ui.js';

// Підключення UI залежно від ширини екрану
async function loadUI() {
  const isMobile = window.innerWidth <= 768;
  const uiPath = isMobile ? './ui/mobile-ui.html' : './ui/ui.html';
  console.log('[UI]', isMobile ? '📱 Mobile' : '🖥️ Desktop', '→', uiPath);

  const response = await fetch(uiPath);
  const html = await response.text();
  document.getElementById('ui-container').innerHTML = html;
  await Promise.resolve();
  if (isMobile) initMobileFilters();
}
loadUI();

// Коли карта завантажиться
map.on('load', async () => {
  const sites = await loadFairSites();
  const zones = await loadFairZones();

  const fairs = assembleFairs({ sites, zones });

  renderLayers(map, fairs);
});
