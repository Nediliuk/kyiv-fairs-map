// === weekday-filter.js ===
// UI-фільтр по днях тижня для всієї сутності ярмарку: точок, полігонів і зон

export function setupWeekdayFilter(map) {
  const source = map.getSource('fairs');
  const features = source._data.features;

  const availableWeekdays = new Set(
    features.filter(f => f.properties.type === 'point')
            .map(f => f.properties.weekday)
  );

  const ordered = ['Понеділок','Вівторок','Середа','Четвер','Пʼятниця','Субота','Неділя'];

  const todayBtn = document.querySelector('.weekday-today');
  const allBtn = document.querySelector('.weekday-button[data-day="all"]');
  const dayButtons = document.querySelectorAll('.weekday-button[data-day]:not([data-day="all"])');

  if (todayBtn) {
    const today = new Date();
    const weekdayToday = ordered[(today.getDay() + 6) % 7];
    todayBtn.textContent = `Сьогодні (${weekdayToday})`;
    todayBtn.dataset.day = weekdayToday;
  }

  dayButtons.forEach(btn => {
    if (!availableWeekdays.has(btn.dataset.day)) {
      btn.disabled = true;
      btn.classList.add('disabled');
    }
  });

  function applyFilter(weekday) {
    document.querySelectorAll('.weekday-button, .weekday-today').forEach(b => b.classList.remove('active'));

    const targetButton = [...document.querySelectorAll('.weekday-button, .weekday-today')]
      .find(btn => btn.dataset.day === weekday);
    if (targetButton) {
      targetButton.classList.add('active');
    }

    if (weekday === 'all') {
      map.setFilter('fair-polygons', ['==', ['get', 'type'], 'polygon']);
      map.setFilter('fair-points', ['==', ['get', 'type'], 'point']);
      map.setFilter('zone-polygons', ['==', ['get', 'type'], 'zone']);
    } else {
      const fairIDs = new Set(
        features.filter(f => f.properties.type === 'point' && f.properties.weekday === weekday)
                .map(f => f.properties.address)
      );

      const idFilter = ['in', ['get', 'address'], ['literal', [...fairIDs]]];

      map.setFilter('fair-polygons', ['all', ['==', ['get', 'type'], 'polygon'], idFilter]);
      map.setFilter('fair-points', ['all', ['==', ['get', 'type'], 'point'], idFilter]);
      map.setFilter('zone-polygons', ['all', ['==', ['get', 'type'], 'zone'], idFilter]);
    }
  }

  [...dayButtons].forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.day));
  });

  if (todayBtn) {
    todayBtn.addEventListener('click', () => applyFilter(todayBtn.dataset.day));
  }

  if (allBtn) {
    allBtn.addEventListener('click', () => applyFilter('all'));
  }

  applyFilter('all');
}
