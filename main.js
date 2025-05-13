import { map } from './data/init-map.js';
import { loadFairSites } from './data/load-fair-sites.js';
import { loadFairZones } from './data/load-fair-zones.js';
import { assembleFairs } from './logic/fair-assembly.js';
import { renderLayers } from './ui/render-map.js';
import { syncMobileDayLabel } from './ui/mobile/mobile-ui.js';
import { enableMobileTogglePanel } from './ui/mobile/mobile-ui.js';
import { renderOffscreenIndicators } from './logic/offscreen-indicators.js';
import { initMobilePopup } from './ui/mobile/mobile-popups.js';

// === Глобальна змінна для виявлення мобільних екранів ===
// Оновлює window.isMobile залежно від ширини вікна
function updateIsMobile() {
  window.isMobile = window.innerWidth <= 768;
}
updateIsMobile(); // Початкове встановлення при завантаженні
window.addEventListener('resize', updateIsMobile); // Оновлення при зміні розміру

// === Завантаження UI залежно від типу пристрою ===
async function loadUI() {
  const uiPath = window.isMobile ? './ui/mobile/mobile-ui.html' : './ui/ui.html';

  const response = await fetch(uiPath);
  const html = await response.text();
  document.getElementById('ui-container').innerHTML = html;

  console.log('[UI loaded]');

  // === Ініціалізація мобільного попапу після підключення UI ===
  initMobilePopup();
}

loadUI();

console.dir(document.body);

// === Ініціалізація карти після завантаження ===
map.on('load', async () => {
  const sites = await loadFairSites();
  const zones = await loadFairZones();

  const fairs = assembleFairs({ sites, zones });

  renderLayers(map, fairs);

  // Додаткові мобільні налаштування після рендеру
  if (window.isMobile) {
    syncMobileDayLabel(); // оновлення підпису кнопки з днем тижня
    enableMobileTogglePanel(); // активація логіки показу/приховування панелі
  }

  // Відображення індикаторів при русі карти
  map.on('move', () => {
    renderOffscreenIndicators(map, fairs);
  });
});
