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

  // === Контейнери ===
  const uiContainer = document.createElement('div');
  uiContainer.id = 'fair-ui';
  uiContainer.className = 'fair-ui';

  const logo = document.createElement('div');
  logo.textContent = 'єЯрмарок';
  logo.className = 'fair-logo';

  const panel = document.createElement('div');
  panel.id = 'weekday-panel';
  panel.className = 'weekday-panel';

  // === Кнопка "сьогодні" ===
  const today = new Date();
  const weekdayToday = ordered[today.getDay() - 1 >= 0 ? today.getDay() - 1 : 6];

  const todayBtn = document.createElement('button');
  todayBtn.textContent = `Сьогодні (${weekdayToday})`;
  todayBtn.className = 'weekday-today weekday-button';
  todayBtn.dataset.day = 'today';
  panel.appendChild(todayBtn);

  // === Кнопки днів ===
  const buttons = [];

  const allBtn = document.createElement('button');
  allBtn.textContent = 'Усі дні';
  allBtn.dataset.day = 'all';
  allBtn.className = 'weekday-button';
  panel.appendChild(allBtn);
  buttons.push(allBtn);

  ordered.forEach(day => {
    const btn = document.createElement('button');
    btn.textContent = day;
    btn.dataset.day = day;
    btn.className = 'weekday-button';
    if (!availableWeekdays.has(day)) {
      btn.disabled = true;
      btn.classList.add('disabled');
    }
    panel.appendChild(btn);
    buttons.push(btn);
  });

  // === DOM вставка ===
  uiContainer.appendChild(logo);
  uiContainer.appendChild(panel);
  document.body.appendChild(uiContainer);

  // === Застосування фільтра ===
  function applyFilter(weekday, source = null) {
    // Очистити всі активні стани
    [...buttons, todayBtn].forEach(b => b.classList.remove('active'));

    // Активувати відповідну кнопку
    if (source === 'today') {
      todayBtn.classList.add('active');
    } else {
      const active = buttons.find(b => b.dataset.day === weekday);
      if (active) active.classList.add('active');
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

  // === Події ===
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      applyFilter(btn.dataset.day);
    });
  });

  todayBtn.addEventListener('click', () => {
    applyFilter(weekdayToday, 'today');
  });

  applyFilter('all');
}
