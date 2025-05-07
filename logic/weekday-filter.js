// weekday-filter.js — логіка фільтрації ярмарків за днями тижня

import { syncMobileDayLabel, closeMobilePanel } from '../ui/mobile-ui.js';

export function applyFilter(weekday, { map, fairs, allButtons, todayBtn, weekdayToday }, source = null) {
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
    const fairIDs = new Set(
      fairs.filter(f => f.dates.some(d => d.weekday === weekday))
           .map(f => f.address)
    );
    const idFilter = ['in', ['get', 'address'], ['literal', [...fairIDs]]];

    map.setFilter('fair-polygons', ['all', ['==', ['get', 'type'], 'polygon'], idFilter]);
    map.setFilter('fair-points', ['all', ['==', ['get', 'type'], 'point'], idFilter]);
    map.setFilter('zone-polygons', ['all', ['==', ['get', 'type'], 'zone'], idFilter]);
  }
}

export function setupWeekdayFilter(map, fairs) {
  const ordered = ['Понеділок','Вівторок','Середа','Четвер','Пʼятниця','Субота','Неділя'];

  const availableWeekdays = new Set(
    fairs.flatMap(f => f.dates.map(d => d.weekday))
  );

  const allButtons = [...document.querySelectorAll('[data-day]')];
  const todayBtn = document.querySelector('.weekday-today');

  const today = new Date();
  const weekdayToday = ordered[today.getDay() - 1 >= 0 ? today.getDay() - 1 : 6];
  if (todayBtn) todayBtn.textContent = `Сьогодні (${weekdayToday})`;

  // Вимкнення кнопок, якщо в цей день немає ярмарків
  allButtons.forEach(btn => {
    const day = btn.dataset.day;
    if (ordered.includes(day) && !availableWeekdays.has(day)) {
      btn.disabled = true;
      btn.classList.add('disabled');
    }
  });

  // Обробники кліків для десктопу
  if (window.innerWidth > 768) {
    allButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const day = btn.dataset.day;
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

      applyFilter(day, { map, fairs, allButtons, todayBtn, weekdayToday });
      syncMobileDayLabel();
      closeMobilePanel();
    });
  }

  // Початкове застосування фільтра (усі дні)
  applyFilter('all', { map, fairs, allButtons, todayBtn, weekdayToday });
} 
