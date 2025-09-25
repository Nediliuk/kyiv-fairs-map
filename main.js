// main.js (оновлена версія з кешуванням)
import { map } from './data/init-map.js';
import { loadFairSites } from './data/load-fair-sites.js';
import { loadFairZones } from './data/load-fair-zones.js';
import { getCachedSites, setCachedSites, getCachedZones, setCachedZones } from './data/cache-manager.js';
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

// Завантаження UI
async function loadUI() {
  const uiPath = window.isMobile ? './ui/mobile/mobile-ui.html' : './ui/ui.html';
  const html = await fetch(uiPath).then((r) => r.text());
  const uiContainer = document.getElementById('ui-container');
  uiContainer.innerHTML = html;

  console.log('[UI loaded]');
  initMobilePopup();
  initFeedback();
}
loadUI();

// Функція для завантаження свіжих даних з API і оновлення кешу
async function loadFreshData() {
  console.log('🔄 Завантажуємо свіжі дані з API...');
  const [sites, zones] = await Promise.all([
    loadFairSites(),
    loadFairZones(),
  ]);
  
  // Зберігаємо нові дані в кеш
  setCachedSites(sites);
  setCachedZones(zones);
  
  return { sites, zones };
}

// Функція для оновлення даних у фоновому режимі
async function updateDataInBackground(currentFairs) {
  try {
    console.log('🔍 Перевіряємо наявність оновлених даних...');
    const { sites, zones } = await loadFreshData();
    
    // Порівнюємо нові дані з поточними
    const newFairs = assembleFairs({ sites, zones });
    
    // Якщо дані змінились, можемо показати повідомлення користувачу
    // (це опціонально - можна просто оновити мовчки)
    if (newFairs.length !== currentFairs.length) {
      console.log('✨ Знайдено оновлені дані про ярмарки');
      // Тут можна додати ненав'язливе повідомлення користувачу
    }
    
  } catch (err) {
    console.warn('⚠️ Не вдалося оновити дані у фоні:', err);
    // Це не критична помилка - користувач працює з кешованими даними
  }
}

// Основна ініціалізація карти з розумним кешуванням
map.on('load', async () => {
  try {
    let sites, zones, usingCache = false;
    
    // Спочатку перевіряємо кеш
    const cachedSites = await getCachedSites();
    const cachedZones = await getCachedZones();
    
    if (cachedSites && cachedZones) {
      // Є кешовані дані - використовуємо їх для швидкого старту
      console.log('⚡ Використовуємо кешовані дані для швидкого завантаження');
      sites = cachedSites.data;
      zones = cachedZones.data;
      usingCache = true;
    } else {
      // Кешу немає - завантажуємо з API та кешуємо
      console.log('📡 Завантажуємо дані з API (перший запуск або застарілий кеш)');
      const freshData = await loadFreshData();
      sites = freshData.sites;
      zones = freshData.zones;
    }
    
    // Збираємо та рендеримо дані
    const fairs = assembleFairs({ sites, zones });
    renderLayers(map, fairs);
    
    // Налаштовуємо мобільний інтерфейс
    if (window.isMobile) {
      syncMobileDayLabel();
      enableMobileTogglePanel();
    }
    
    // Додаємо слухач руху карти
    map.on('move', () => updateOffscreenIndicators(map, fairs));
    
    // Якщо використовували кеш, запускаємо оновлення у фоні
    if (usingCache) {
      // Даємо користувачу трохи часу попрацювати з картою, потім оновлюємо
      setTimeout(() => {
        updateDataInBackground(fairs);
      }, 5000); // Оновлюємо через 5 секунд
    }
    
  } catch (err) {
    console.error('❌ Критична помилка при завантаженні:', err);
    // Тут можна показати користувачу повідомлення про помилку
  }
});