// === weekday-filter.js ===
// Підключення логіки фільтра до вже існуючого DOM із ui.html
// Працює з масивом fairs (зібраних сутностей), а не raw GeoJSON features

export function setupWeekdayFilter(map, fairs) {
  const ordered = ['Понеділок','Вівторок','Середа','Четвер','Пʼятниця','Субота','Неділя'];

  // === Визначаємо доступні дні тижня на основі fair.dates
  const availableWeekdays = new Set(
    fairs.flatMap(f => f.dates.map(d => d.weekday))
  );

  // === Пошук елементів у DOM ===
  const allButtons = [...document.querySelectorAll('[data-day]')];
  const todayBtn = document.querySelector('.weekday-today');

  // Визначення поточного дня тижня (зміщення на понеділок як початок)
  const today = new Date();
  const weekdayToday = ordered[today.getDay() - 1 >= 0 ? today.getDay() - 1 : 6];
  todayBtn.textContent = `Сьогодні (${weekdayToday})`;

  // Вимкнення кнопок, якщо в цей день немає ярмарків
  allButtons.forEach(btn => {
    const day = btn.dataset.day;
    if (ordered.includes(day) && !availableWeekdays.has(day)) {
      btn.disabled = true;
      btn.classList.add('disabled');
    }
  });

  // === Основна логіка фільтрації ===
  function applyFilter(weekday, source = null) {
    // Скидаємо попередню активну кнопку
    allButtons.forEach(b => b.classList.remove('active'));

    // Позначаємо активну кнопку
    allButtons.forEach(b => b.classList.remove('active'));
    todayBtn.classList.remove('active');
    
    // Якщо джерело — кнопка "Сьогодні"
    if (source === 'today') {
      todayBtn.classList.add('active');
    } else {
      const active = allButtons.find(b => b.dataset.day === weekday);
      if (active) active.classList.add('active');
    }

    if (weekday === 'all') {
      map.setFilter('fair-polygons', ['==', ['get', 'type'], 'polygon']);
      map.setFilter('fair-points', ['==', ['get', 'type'], 'point']);
      map.setFilter('zone-polygons', ['==', ['get', 'type'], 'zone']);
    } else {
      // Отримуємо список адрес ярмарків, які мають вказаний день тижня
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

  // === Обробники кліків на кнопки днів тижня ===
  allButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      applyFilter(btn.dataset.day);
    });
  });

  // === Обробник кнопки "Сьогодні" ===
  todayBtn.addEventListener('click', () => {
    applyFilter(weekdayToday, 'today');
  });

  // Запускаємо з фільтрацією за замовчуванням (усі дні)
  applyFilter('all');
}
