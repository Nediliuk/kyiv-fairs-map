// mobile-popup.js — логіка показу попапу на мобільних

import { getPopupContent } from '../popups.js';

let popupContainer;

// === Створення контейнера, якщо його ще немає в DOM ===
function createPopupContainer() {
  let el = document.querySelector('#mobile-popup');
  if (!el) {
    el = document.createElement('div');
    el.id = 'mobile-popup';
    el.className = 'mobile-popup';
    const container = document.querySelector('#ui-container');
    if (!container) {
      console.warn('[popup] #ui-container not found!');
      return null;
    }
    container.appendChild(el);
    console.log('[popup] #mobile-popup dynamically created');
  }
  return el;
}

// === Ініціалізація контейнера після завантаження UI ===
export function initMobilePopup() {
  popupContainer = createPopupContainer();
  console.log('[popup] container ready', popupContainer);

    // Слухач кліку поза попапом для його закриття
    ['click', 'touchstart'].forEach(eventType => {
    document.addEventListener(eventType, (event) => {
      if (
        popupContainer?.classList.contains('visible') &&
        !popupContainer.contains(event.target) &&
        !event.target.closest('.mobile-popup')
      ) {
        hideMobilePopup();
      }
    });
  });
}

// === Показ мобільного попапу ===
export function showMobilePopup(fair, nearest, uniqueWeekdays) {
  if (!popupContainer) {
    console.warn('[popup] popupContainer is not initialized');
    return;
  }

  // Очистка контейнера перед вставкою нового вмісту
  popupContainer.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'mobile-popup-card';
  card.innerHTML = `
    <button class="mobile-popup-close">×</button>
    ${getPopupContent(fair, nearest, uniqueWeekdays)}
  `;

  popupContainer.appendChild(card);

  // Додаємо клас visible на наступному кадрі, щоб уникнути скидання DOM
  requestAnimationFrame(() => {
    popupContainer.classList.add('visible');
    console.log('[popup] showMobilePopup (via RAF)', popupContainer);
    console.log('[popup] popupContainer.classList:', popupContainer?.classList);
  });

  // Закриття по кнопці
  card.querySelector('.mobile-popup-close')?.addEventListener('click', hideMobilePopup);
}

// === Приховування попапу ===
export function hideMobilePopup() {
  popupContainer?.classList.remove('visible');
}