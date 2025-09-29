// ui/zone-popups.js
// Створення попапів для зон торгівлі з реальними даними API

import * as mapboxgl from 'https://cdn.skypack.dev/mapbox-gl';
import { showMobileZonePopup } from './mobile/mobile-popups.js';
import { getZoneInfo, shouldShowPopup } from './zone-types-mapping.js';

let activeZonePopup;

// Основна функція для створення контенту попапу зони - МІНІМАЛЬНА ВЕРСІЯ
export function getZonePopupContent(zone, fair) {
  const zoneInfo = getZoneInfo(zone.zoneType);
  
  return `
    <div class="zone-popup minimal">
      <div class="zone-popup-title">
        ${zoneInfo.icon} ${zoneInfo.category}
      </div>
    </div>
  `;
}

// Створення попапу для зони на позиції клік/hover
export function createZonePopupAt(map, fairs, feature, lngLat) {
  const address = feature.properties.address;
  const zoneType = feature.properties.zoneType;
  
  // Перевіряємо мінімальний зум для показу попапів
  if (map.getZoom() < 14.5) {
    closeZonePopup();
    return;
  }
  
  // Перевіряємо чи потрібно показувати попап (не для інфраструктури)
  if (!shouldShowPopup(zoneType)) {
    console.log(`Пропускаємо попап для інфраструктури: ${zoneType}`);
    return;
  }
  
  // Знаходимо fair та зону
  const fair = fairs?.find(f => f.address === address);
  if (!fair) {
    console.warn('Fair not found for zone:', address);
    return;
  }
  
  const zone = fair.zones.find(z => z.zoneType === zoneType);
  if (!zone) {
    console.warn('Zone not found:', zoneType, 'in fair:', address);
    return;
  }

  // Для мобільних пристроїв використовуємо окремий попап
  if (window.isMobile) {
    showMobileZonePopup(zone, fair);
    return;
  }

  // Якщо попап вже існує - просто оновлюємо його позицію та контент
  if (activeZonePopup) {
    activeZonePopup
      .setLngLat(lngLat)
      .setHTML(getZonePopupContent(zone, fair));
  } else {
    // Створюємо новий попап тільки якщо його ще немає
    // ВАЖЛИВО: className додається до wrapper div, а не до .mapboxgl-popup
    activeZonePopup = new mapboxgl.Popup({
      offset: 16,
      closeButton: false,
      maxWidth: '180px',
      className: 'zone-popup-wrapper' // Це додасть клас до wrapper
    })
      .setLngLat(lngLat)
      .setHTML(getZonePopupContent(zone, fair))
      .addTo(map);
  }

  const zoneInfo = getZoneInfo(zoneType);
  console.log(`Показано попап: ${zoneInfo.icon} ${zoneInfo.category} в ${address}`);
}

// Закриття активного попапу зони
export function closeZonePopup() {
  if (activeZonePopup) {
    activeZonePopup.remove();
    activeZonePopup = null;
  }
}