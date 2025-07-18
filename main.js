import { map } from './data/init-map.js';
import { loadFairSites } from './data/load-fair-sites.js';
import { loadFairZones } from './data/load-fair-zones.js';
import { assembleFairs } from './logic/fair-assembly.js';
import { renderLayers } from './ui/render-map.js';
import {
  syncMobileDayLabel,
  enableMobileTogglePanel,
} from './ui/mobile/mobile-ui.js';
import { updateOffscreenIndicators } from './logic/offscreen-indicators.js';
import { initMobilePopup } from './ui/mobile/mobile-popups.js';
import { initFeedback } from './logic/feedback.js';

// Виявлення мобільного екрана
function updateIsMobile() {
  window.isMobile = window.innerWidth <= 768;
}
updateIsMobile();
window.addEventListener('resize', updateIsMobile);

// Завантаження UI (десктоп / мобільний)
async function loadUI() {
  const uiPath = window.isMobile
    ? './ui/mobile/mobile-ui.html'
    : './ui/ui.html';
  const html = await fetch(uiPath).then((r) => r.text());
  const uiContainer = document.getElementById('ui-container');
  uiContainer.innerHTML = html;

  console.log('[UI loaded]');

  initMobilePopup();
  initFeedback(); // кнопка тепер у DOM
}
loadUI();

// Ініціалізація карти
map.on('load', async () => {
  try {
    const [sites, zones] = await Promise.all([
      loadFairSites(),
      loadFairZones(),
    ]);

    const fairs = assembleFairs({ sites, zones });
    renderLayers(map, fairs);

    if (window.isMobile) {
      syncMobileDayLabel();
      enableMobileTogglePanel();
    }

    map.on('move', () => updateOffscreenIndicators(map, fairs));
  } catch (err) {
    console.error('Помилка при завантаженні даних ярмарків:', err);
  }
});