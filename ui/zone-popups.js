// ui/zone-popups.js
// Створення попапів для зон торгівлі з оптимізованим пошуком

import * as mapboxgl from 'https://cdn.skypack.dev/mapbox-gl';
import { showMobileZonePopup } from './mobile/mobile-popups.js';
import { getZoneInfo, shouldShowPopup } from './zone-types-mapping.js';

let activeZonePopup;

// Кеш для швидкого пошуку зон за ключем "address:zoneType"
let zoneCache = null;

// Ініціалізація кешу для швидкого пошуку
function initZoneCache(fairs) {
  if (zoneCache) return; // Вже ініціалізовано
  
  zoneCache = new Map();
  fairs.forEach(fair => {
    fair.zones.forEach(zone => {
      const key = `${fair.address}:${zone.zoneType}`;
      zoneCache.set(key, { zone, fair });
    });
  });
}

// Швидкий пошук зони через кеш
function findZone(address, zoneType, fairs) {
  // Ініціалізуємо кеш при першому виклику
  if (!zoneCache) {
    initZoneCache(fairs);
  }
  
  const key = `${address}:${zoneType}`;
  return zoneCache.get(key);
}

// Основна функція для створення контенту попапу
export function getZonePopupContent(zone) {
  const zoneInfo = getZoneInfo(zone.zoneType);
  
  return `
    <div class="zone-popup minimal">
      <div class="zone-popup-title">
        ${zoneInfo.icon} ${zoneInfo.category}
      </div>
    </div>
  `;
}

// Створення попапу для зони на позиції
export function createZonePopupAt(map, fairs, feature, lngLat) {
  const address = feature.properties.address;
  const zoneType = feature.properties.zoneType;
  
  // Перевіряємо чи потрібно показувати попап
  if (!shouldShowPopup(zoneType)) {
    return;
  }
  
  // Швидкий пошук через кеш замість двох find()
  const result = findZone(address, zoneType, fairs);
  if (!result) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Zone not found:', address, zoneType);
    }
    return;
  }
  
  const { zone, fair } = result;

  // Для мобільних пристроїв
  if (window.isMobile) {
    showMobileZonePopup(zone, fair);
    return;
  }

  // Оновлюємо існуючий попап замість створення нового
  if (activeZonePopup) {
    activeZonePopup
      .setLngLat(lngLat)
      .setHTML(getZonePopupContent(zone));
  } else {
    activeZonePopup = new mapboxgl.Popup({
      offset: 16,
      closeButton: false,
      maxWidth: '180px',
      className: 'zone-popup-wrapper'
    })
      .setLngLat(lngLat)
      .setHTML(getZonePopupContent(zone))
      .addTo(map);
  }
}

// Закриття активного попапу
export function closeZonePopup() {
  if (activeZonePopup) {
    activeZonePopup.remove();
    activeZonePopup = null;
  }
}

// Скидання кешу (якщо потрібно перезавантажити дані)
export function resetZoneCache() {
  zoneCache = null;
}