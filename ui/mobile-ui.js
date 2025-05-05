// mobile-ui.js — мобільна логіка інтерфейсу

import { applyFilter } from '/logic/weekday-filter.js';

// Задає текст активного дня в мобільному футері
export function setMobileDayLabel(label) {
  const labelEl = document.getElementById('current-day');
  if (labelEl) labelEl.textContent = label;
}

// Показує/приховує модальне вікно з днями тижня
export function toggleModal() {
  const modal = document.getElementById('weekday-panel');
  if (modal) modal.classList.toggle('visible');
}

// Ініціалізує логіку фільтрів для мобільного інтерфейсу
export function initMobileFilters() {
  const panel = document.getElementById('weekday-panel');
  if (!panel) return;

  panel.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;

    const day = e.target.getAttribute('data-day');
    if (!day) return;

    // Застосовуємо фільтр до мапи
    applyFilter(day);

    // Оновлюємо текст кнопки в футері
    setMobileDayLabel(e.target.textContent);

    // Приховуємо модалку після вибору
    toggleModal();
  });

  // Додаємо клік на кнопку в футері, щоб відкривати модалку
  const triggerButton = document.getElementById('current-day');
  if (triggerButton) {
    triggerButton.addEventListener('click', toggleModal);
  }
}
