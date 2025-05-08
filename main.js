import { map } from './data/init-map.js';
import { loadFairSites } from './data/load-fair-sites.js';
import { loadFairZones } from './data/load-fair-zones.js';
import { assembleFairs } from './logic/fair-assembly.js';
import { renderLayers } from './ui/render-map.js';
import { syncMobileDayLabel } from './ui/mobile-ui.js';
import { enableMobileTogglePanel } from './ui/mobile-ui.js';
import { renderOffscreenIndicators } from './logic/offscreen-indicators.js';


let isMobile = false; // глобальна змінна

// Підключення UI залежно від ширини екрану
async function loadUI() {
  isMobile = window.innerWidth <= 768;
  const uiPath = isMobile ? './ui/mobile-ui.html' : './ui/ui.html';
  const uiStylesPath = isMobile ? './ui/mobile-style.css' : './ui/style.css';

  const response = await fetch(uiPath);
  const html = await response.text();
  document.getElementById('ui-container').innerHTML = html;

  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = uiStylesPath;
  document.head.appendChild(styleLink);

  console.log('[UI loaded]');
}
loadUI();

// Коли карта завантажиться
map.on('load', async () => {
  const sites = await loadFairSites();
  const zones = await loadFairZones();

  const fairs = assembleFairs({ sites, zones });

  renderLayers(map, fairs);

  if (isMobile) {
    syncMobileDayLabel();
    enableMobileTogglePanel();
  }

  map.on('move', () => {
    renderOffscreenIndicators(map, fairs);
  });
});
