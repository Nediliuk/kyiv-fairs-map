// === weekday-filter.js ===
// UI-фільтр по днях тижня для всієї сутності ярмарку: точок, полігонів і зон

export function setupWeekdayFilter(map) {
    const source = map.getSource('fairs');
    const features = source._data.features;
  
    // Доступні дні тижня на основі точок
    const availableWeekdays = new Set(
      features.filter(f => f.properties.type === 'point')
              .map(f => f.properties.weekday)
    );
  
    // Створюємо селект для фільтрації
    const select = document.createElement('select');
    select.id = 'weekday-filter';
    select.style.position = 'absolute';
    select.style.top = '10px';
    select.style.left = '10px';
    select.style.zIndex = '1';
    select.style.padding = '4px';
  
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'Усі дні';
    select.appendChild(allOption);
  
    const ordered = ['Понеділок','Вівторок','Середа','Четвер','Пʼятниця','Субота','Неділя'];
    ordered.forEach(day => {
      const option = document.createElement('option');
      option.value = day;
      option.textContent = day;
      if (!availableWeekdays.has(day)) {
        option.disabled = true;
      }
      select.appendChild(option);
    });
  
    document.body.appendChild(select);
  
    // Групування фільтрів за fair_id (який базується на address)
    function applyFilter(weekday) {
      const features = map.getSource('fairs')._data.features;
  
      if (weekday === 'all') {
        map.setFilter('fair-polygons', ['==', ['get', 'type'], 'polygon']);
        map.setFilter('fair-points', ['==', ['get', 'type'], 'point']);
        map.setFilter('zone-polygons', ['==', ['get', 'type'], 'zone']);
      } else {
        // Групування по адресі як fair_id
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
  
    applyFilter('all');
  
    select.addEventListener('change', (e) => {
      applyFilter(e.target.value);
    });
  }
  