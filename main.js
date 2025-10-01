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
import { initAboutProject } from './logic/about-project.js'; // ← НОВИЙ ІМПОРТ

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
  initAboutProject(); // ← ІНІЦІАЛІЗАЦІЯ МОДУЛЯ "ПРО ПРОЕКТ"

  // Запускаємо анімацію овочів одразу після завантаження UI
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

// Ініціалізація карти
map.on('load', async () => {
  try {
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

    // 📊 ПОВНИЙ АНАЛІЗ ЗНАЧЕНЬ type_table, goods_type_kd і zone_type
    console.log('📊 АНАЛІЗ ВСІХ ЗНАЧЕНЬ В ПОЛЯХ ЗОНИ:');

    // Збираємо всі унікальні значення
    const goodsTypeValues = new Set();
    const zoneTypeValues = new Set();
    const typeTableValues = new Set();
    const combinedStats = new Map();

    // Аналізуємо сирі дані zones
    zones.forEach((rawZone, index) => {
      const props = rawZone.attributes || rawZone.properties || {};
      
      // Збираємо type_table
      if (props.type_table !== undefined && props.type_table !== null) {
        typeTableValues.add(props.type_table);
      }
      
      // Збираємо goods_type_kd
      if (props.goods_type_kd !== undefined && props.goods_type_kd !== null) {
        goodsTypeValues.add(props.goods_type_kd);
      }
      
      // Збираємо zone_type
      if (props.zone_type !== undefined && props.zone_type !== null) {
        zoneTypeValues.add(props.zone_type);
      }
      
      // Збираємо комбінації для аналізу
      const combination = `zone_type:"${props.zone_type || 'null'}" + goods_type_kd:"${props.goods_type_kd || 'null'}" + type_table:"${props.type_table || 'null'}"`;
      combinedStats.set(combination, (combinedStats.get(combination) || 0) + 1);
      
      // Показуємо перші 5 записів для розуміння структури
      if (index < 5) {
        console.log(`\n🔍 Запис ${index}:`);
        console.log(`   type_table: "${props.type_table}" (${typeof props.type_table})`);
        console.log(`   goods_type_kd: "${props.goods_type_kd}" (${typeof props.goods_type_kd})`);
        console.log(`   zone_type: "${props.zone_type}" (${typeof props.zone_type})`);
        console.log(`   Всі поля:`, Object.keys(props));
      }
    });

    // Виводимо результати аналізу
    console.log('\n🏷️ ТИП ТАБЛИЦІ type_table:');
    console.log(`Загальна кількість: ${typeTableValues.size}`);
    const sortedTypeTable = Array.from(typeTableValues).sort();
    sortedTypeTable.forEach((value, index) => {
      console.log(`   ${index + 1}. "${value}" (${typeof value})`);
    });

    console.log('\n🛒 ВСІ УНІКАЛЬНІ ЗНАЧЕННЯ goods_type_kd:');
    console.log(`Загальна кількість: ${goodsTypeValues.size}`);
    const sortedGoodsTypes = Array.from(goodsTypeValues).sort();
    sortedGoodsTypes.forEach((value, index) => {
      console.log(`   ${index + 1}. "${value}" (${typeof value})`);
    });

    console.log('\n🏪 ВСІ УНІКАЛЬНІ ЗНАЧЕННЯ zone_type:');
    console.log(`Загальна кількість: ${zoneTypeValues.size}`);
    const sortedZoneTypes = Array.from(zoneTypeValues).sort();
    sortedZoneTypes.forEach((value, index) => {
      console.log(`   ${index + 1}. "${value}" (${typeof value})`);
    });

    console.log('\n📈 СТАТИСТИКА КОМБІНАЦІЙ (zone_type + goods_type_kd + type_table):');
    const sortedCombinations = Array.from(combinedStats.entries())
      .sort((a, b) => b[1] - a[1]) // Сортуємо за кількістю
      .slice(0, 15); // Показуємо топ-15

    sortedCombinations.forEach(([combination, count]) => {
      console.log(`   ${combination}: ${count} разів`);
    });

    console.log('\n📋 ЕКСПОРТ ДЛЯ КОДУ:');
    console.log('// type_table values:');
    console.log('const TYPE_TABLE_VALUES = [');
    sortedTypeTable.forEach(value => {
      console.log(`  "${value}",`);
    });
    console.log('];');

    console.log('\n// goods_type_kd values:');
    console.log('const GOODS_TYPES = [');
    sortedGoodsTypes.forEach(value => {
      console.log(`  "${value}",`);
    });
    console.log('];');

    console.log('\n// zone_type values:');
    console.log('const ZONE_TYPES = [');
    sortedZoneTypes.forEach(value => {
      console.log(`  "${value}",`);
    });
    console.log('];');

    // Додатковий аналіз - чи є ще корисні поля?
    console.log('\n🔍 ІНШІ КОРИСНІ ПОЛЯ В ДАНИХ ЗОНИ:');
    const allFields = new Set();
    zones.slice(0, 20).forEach(rawZone => {
      const props = rawZone.attributes || rawZone.properties || {};
      Object.keys(props).forEach(key => allFields.add(key));
    });

    const interestingFields = Array.from(allFields).filter(field => 
      field.toLowerCase().includes('goods') || 
      field.toLowerCase().includes('type') ||
      field.toLowerCase().includes('category') ||
      field.toLowerCase().includes('name') ||
      field.toLowerCase().includes('descr') ||
      field.toLowerCase().includes('table')
    ).sort();

    console.log('Потенційно корисні поля:');
    interestingFields.forEach(field => console.log(`   - ${field}`));

    console.log(`\nВсього полів в даних зони: ${allFields.size}`);
    console.log('Всі поля:', Array.from(allFields).sort());

    // Рендеримо шари карти
    renderLayers(map, fairs);
    
    // Налаштовуємо мобільний інтерфейс
    if (window.isMobile) {
      syncMobileDayLabel();
      enableMobileTogglePanel();
    }
    
    // Додаємо слухач руху карти для оновлення індикаторів
    map.on('move', () => updateOffscreenIndicators(map, fairs));

    // Зупиняємо лоадер і приховуємо його
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