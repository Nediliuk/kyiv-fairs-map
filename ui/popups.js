// === popup.js ===
// Створення попапів для ярмарків

import * as mapboxgl from 'https://cdn.skypack.dev/mapbox-gl';
import { showMobilePopup } from './mobile/mobile-popups.js';

let activePopup;

const weekdayPluralLocative = {
  понеділок: 'понеділок',
  вівторок: 'вівторок',
  середа: 'середу',
  четвер: 'четвер',
  пʼятниця: 'пʼятницю',
  субота: 'суботу',
  неділя: 'неділю',
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
  });
}

function formatWeekdaysList(days) {
  const declined = days.map(d => weekdayPluralLocative[d.toLowerCase()] || d);
  if (declined.length === 1) return declined[0];
  if (declined.length === 2) return `${declined[0]} та ${declined[1]}`;
  return `${declined.slice(0, -1).join(', ')} та ${declined[declined.length - 1]}`;
}

export function getPopupContent(fair, nearest, uniqueWeekdays) {
  const [lng, lat] = fair.centroid || [];
  return `
    <a 
      class="popup-address" 
      href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" 
      target="_blank" rel="noopener"
    >
      ${fair.address}
    </a>
    <div class="popup-details">
      <div>Ярмарки проходять у ${formatWeekdaysList(uniqueWeekdays).toLowerCase()}</div>
      ${nearest
        ? `<div>Наступний — у ${weekdayPluralLocative[nearest.weekday.toLowerCase()] || nearest.weekday.toLowerCase()} ${formatDate(nearest.date)}</div>`
        : '<div><em>Наступну дату ще не оголошено</em></div>'}
    </div>
  `;
}

export function createPopupAt(map, fairs, feature, lngLat) {
  const address = feature.properties.address;
  const fair = fairs?.find(f => f.address === address);
  if (!fair) return;

  if (window.isMobile) {
    const uniqueWeekdays = [...new Set(fair.dates.map(d => d.weekday))];
    const now = Date.now();
    const nearest = fair.dates.find(d => new Date(d.date).getTime() >= now);
    showMobilePopup(fair, nearest, uniqueWeekdays);
    return;
  }

  if (activePopup) activePopup.remove();

  const nearest = fair.dates
    .map(d => ({ ...d, dateObj: new Date(d.date) }))
    .filter(d => d.dateObj >= new Date())
    .sort((a, b) => a.dateObj - b.dateObj)[0];

  const uniqueWeekdays = [...new Set(fair.dates.map(d => d.weekday))];

  activePopup = new mapboxgl.Popup({
    offset: 16,
    closeButton: false,
  })
    .setLngLat(lngLat)
    .setHTML(getPopupContent(fair, nearest, uniqueWeekdays))
    .addTo(map);
}
