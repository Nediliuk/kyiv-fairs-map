// Відображає назву активного дня тижня в кнопці футера
export function syncMobileDayLabel() {
  const labelEl = document.querySelector('#current-day .day-label');
  const activeBtn = document.querySelector('#weekday-panel .active');
  if (labelEl && activeBtn) {
    if (activeBtn.classList.contains('weekday-today')) {
      labelEl.textContent = 'Сьогодні';
    } else {
      labelEl.textContent = activeBtn.textContent;
    }
  }
}

// Закриває панель вибору дня тижня на мобільному
export function closeMobilePanel() {
  const panel = document.getElementById('weekday-panel');
  const trigger = document.getElementById('current-day');
  if (!panel || !trigger) return;
  panel.classList.remove('open');
  trigger.classList.remove('expanded');
}

// Додає механіку відкриття/закриття панелі по кліку на кнопку
export function enableMobileTogglePanel() {
  const trigger = document.getElementById('current-day');
  const panel = document.getElementById('weekday-panel');
  if (!trigger || !panel) return;

  trigger.addEventListener('click', () => {
    panel.classList.toggle('open');
    trigger.classList.toggle('expanded');
  });
} 
