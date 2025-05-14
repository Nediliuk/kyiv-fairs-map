// weekday-filter.js — логіка фільтрації ярмарків за днями тижня

import { syncMobileDayLabel, closeMobilePanel } from '../ui/mobile/mobile-ui.js';
import { renderOffscreenIndicators, updateOffscreenIndicators } from './offscreen-indicators.js';

// Окрема функція для оновлення видимості та позиції індикаторів без пересоздання
function updateIndicators(map, fairs, weekday) {
  if (weekday === 'all') {
    updateOffscreenIndicators(map, fairs);
  } else {
    const filteredFairs = fairs.filter(f => f.dates.some(d => d.weekday.toLowerCase() === weekday.toLowerCase()));
    updateOffscreenIndicators(map, filteredFairs);
  }
}

export function applyFilter(weekday, { map, fairs, allButtons, todayBtn, weekdayToday }, source = null) {
  if (source === 'today') {
    weekday = weekdayToday;
  }
  allButtons.forEach(b => b.classList.remove('active'));
  if (todayBtn) todayBtn.classList.remove('active');

  // Активуємо потрібну кнопку
  if (source === 'today' && todayBtn) {
    todayBtn.classList.add('active');
  } else {
    const active = allButtons.find(b => b.dataset.day === weekday);
    if (active) active.classList.add('active');
  }

  // Застосовуємо фільтр до карти
  if (weekday === 'all') {
    map.setFilter('fair-polygons', ['==', ['get', 'type'], 'polygon']);
    map.setFilter('fair-points', ['==', ['get', 'type'], 'point']);
    map.setFilter('zone-polygons', ['==', ['get', 'type'], 'zone']);
  } else {
    const filteredFairs = fairs.filter(f => f.dates.some(d => d.weekday.toLowerCase() === weekday.toLowerCase()));
    const fairIDs = new Set(filteredFairs.map(f => f.address));
    const idFilter = ['in', ['get', 'address'], ['literal', [...fairIDs]]];

    map.setFilter('fair-polygons', ['all', ['==', ['get', 'type'], 'polygon'], idFilter]);
    map.setFilter('fair-points', ['all', ['==', ['get', 'type'], 'point'], idFilter]);
    map.setFilter('zone-polygons', ['all', ['==', ['get', 'type'], 'zone'], idFilter]);
  }

  updateIndicators(map, fairs, weekday); // лише оновлюємо видимість і позицію
}

export function setupWeekdayFilter(map, fairs) {
  const ordered = ['Понеділок','Вівторок','Середа','Четвер','Пʼятниця','Субота','Неділя'];

  const availableWeekdays = new Set(
    fairs.flatMap(f => f.dates.map(d => d.weekday))
  );

  const allButtons = [...document.querySelectorAll('[data-day]')];
  const todayBtn = document.querySelector('.weekday-today');

  const today = new Date();
  const weekdayToday = ordered[(today.getDay() + 6) % 7];
  if (todayBtn) todayBtn.textContent = `Сьогодні (${weekdayToday})`;

  // Вимкнення кнопок, якщо в цей день немає ярмарків
  allButtons.forEach(btn => {
    const day = btn.dataset.day;
    if (ordered.includes(day) && !availableWeekdays.has(day)) {
      btn.disabled = true;
      btn.classList.add('disabled');
    }
  });

  let currentWeekday = 'all';

  // Створюємо індикатори один раз
  renderOffscreenIndicators(map, fairs);

  // Обробники кліків для десктопу
  if (window.innerWidth > 768) {
    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        currentWeekday = weekdayToday;
        applyFilter(weekdayToday, { map, fairs, allButtons, todayBtn, weekdayToday }, 'today');
      });
    }
    allButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const day = btn.dataset.day;
        currentWeekday = day;
        applyFilter(day, { map, fairs, allButtons, todayBtn, weekdayToday }, day === 'today' ? 'today' : null);
      });
    });
  }

  // Обробники кліків для мобільного інтерфейсу
  if (window.innerWidth <= 768) {
    const panel = document.getElementById('weekday-panel');
    if (!panel) return;

    panel.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button || !panel.contains(button)) return;

      const day = button.getAttribute('data-day');
      if (day === null) return;

      currentWeekday = day;
      applyFilter(day, { map, fairs, allButtons, todayBtn, weekdayToday }, day === 'today' ? 'today' : null);
      syncMobileDayLabel();
      closeMobilePanel();
    });
  }

  // Оновлення індикаторів при русі або зумі карти
  map.on('move', () => updateIndicators(map, fairs, currentWeekday));

  // Початкове застосування фільтра
  applyFilter('all', { map, fairs, allButtons, todayBtn, weekdayToday });
}
