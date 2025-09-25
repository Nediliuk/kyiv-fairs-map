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
import { VegetableLoader } from './logic/vegetable-loader.js';

// Змінна для анімації овочів
let vegetableLoader;

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
  initFeedback();

  // 🎬 ЗАПУСКАЄМО АНІМАЦІЮ ОВОЧІВ ОДРАЗУ ПІСЛЯ ЗАВАНТАЖЕННЯ UI!
  console.log('🥕 Запускаємо лоадер з овочами...');
  vegetableLoader = new VegetableLoader();
  vegetableLoader.start();
  console.log('✅ Лоадер запущений, поки карта завантажується');
}

// Спочатку завантажуємо UI і запускаємо лоадер
loadUI();

// Функція для завантаження свіжих даних з API і оновлення кешу
async function loadFreshData() {
  console.log('🔄 Завантажуємо свіжі дані з API...');
  const [sites, zones] = await Promise.all([
    loadFairSites(),
    loadFairZones(),
  ]);
  
  setCachedSites(sites);
  setCachedZones(zones);
  
  return { sites, zones };
}

// Функція для оновлення даних у фоновому режимі
async function updateDataInBackground(currentFairs) {
  try {
    console.log('🔍 Перевіряємо наявність оновлених даних...');
    const { sites, zones } = await loadFreshData();
    
    const newFairs = assembleFairs({ sites, zones });
    
    if (newFairs.length !== currentFairs.length) {
      console.log('✨ Знайдено оновлені дані про ярмарки');
    }
    
  } catch (err) {
    console.warn('⚠️ Не вдалося оновити дані у фоні:', err);
  }
}

// Ініціалізація карти - тепер лоадер УЖЕ працює
map.on('load', async () => {
  try {
    // Лоадер УЖЕ працює з самого початку ✅

    let sites, zones, usingCache = false;
    
    // Спочатку перевіряємо кеш
    const cachedSites = await getCachedSites();
    const cachedZones = await getCachedZones();
    
    if (cachedSites && cachedZones) {
      console.log('⚡ Використовуємо кешовані дані для швидкого завантаження');
      sites = cachedSites.data;
      zones = cachedZones.data;
      usingCache = true;
    } else {
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
    
    // Додаємо слухач руху карти для оновлення індикаторів
    map.on('move', () => updateOffscreenIndicators(map, fairs));

    // 🛑 ТЕПЕР ЗУПИНЯЄМО ЛОАДЕР І ПРИХОВУЄМО ЙОГО
    console.log('🛑 Карта готова! Зупиняємо лоадер...');
    
    if (vegetableLoader) {
      vegetableLoader.stop();
      console.log('✅ Анімація овочів зупинена');
    }
    
    const loader = document.getElementById('map-loader');
    if (loader) {
      loader.style.display = 'none';
      console.log('✅ Лоадер приховано');
    }
    
    document.body.classList.add('map-ready');
    console.log('✅ Карта повністю завантажена та готова до роботи');
    
    // Якщо використовували кеш, запускаємо оновлення у фоні
    if (usingCache) {
      setTimeout(() => {
        updateDataInBackground(fairs);
      }, 5000);
    }
    
  } catch (err) {
    console.error('❌ Критична помилка при завантаженні карти:', err);
    
    // Зупиняємо анімацію навіть при помилці
    if (vegetableLoader) {
      vegetableLoader.stop();
    }
    
    // Показуємо повідомлення про помилку
    const loader = document.getElementById('map-loader');
    if (loader) {
      const loadingText = loader.querySelector('.loading-text');
      if (loadingText) {
        loadingText.textContent = 'Помилка завантаження. Спробуйте оновити сторінку.';
        loadingText.style.color = '#FA5E5E';
      }
    }
  }
});