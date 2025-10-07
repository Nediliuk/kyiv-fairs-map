// logic/about-project.js
// Модуль для показу інформації про проект (рефакторинг - завантаження з HTML)

import { openFeedback } from './feedback.js';

const ABOUT_PATH = './ui/about-project.html';
const STORAGE_KEY = 'kyiv-fairs-first-visit';

// Довантаження HTML (одноразово)
async function ensureAboutHtml() {
  let wrapper = document.getElementById('about-wrapper');
  if (wrapper) return wrapper; // вже в DOM

  const html = await fetch(ABOUT_PATH).then(r => r.text());
  const temp = document.createElement('div');
  temp.innerHTML = html.trim();
  wrapper = temp.querySelector('#about-wrapper') || temp.firstElementChild;

  document.body.appendChild(wrapper);
  initAboutLogic(); // слухачі після вставки
  return wrapper;
}

// Відкрити модалку - УНІФІКОВАНО з feedback
async function openAboutModal() {
  const wrapper = await ensureAboutHtml();
  wrapper.style.display = 'flex'; // показуємо wrapper
  setTimeout(() => {
    wrapper.classList.add('visible'); // додаємо анімацію
  }, 10);
}

// Закрити модалку - УНІФІКОВАНО з feedback
function closeAboutModal() {
  const wrapper = document.getElementById('about-wrapper');
  if (wrapper) {
    wrapper.classList.remove('visible');
    setTimeout(() => {
      wrapper.style.display = 'none';
    }, 300); // чекаємо поки анімація закінчиться
  }
}

// Логіка кнопок та посилань попапу
function initAboutLogic() {
  const wrapper = document.getElementById('about-wrapper');
  if (!wrapper) return;

  // Закриття по кліку на overlay
  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) closeAboutModal();
  });

  // Закриття по кліку на хрестик
  const closeBtn = wrapper.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAboutModal);
  }

  // Обробник для посилання "Відгук"
  const feedbackLink = wrapper.querySelector('#feedback-link');
  if (feedbackLink) {
    feedbackLink.addEventListener('click', (e) => {
      e.preventDefault();
      closeAboutModal();
      // Відкриваємо форму фідбеку з невеликою паузою
      setTimeout(() => {
        openFeedback();
      }, 150);
    });
  }

  // Закриття по Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape' && wrapper.classList.contains('visible')) {
      closeAboutModal();
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Встановлюємо поточний рік
  const yearSpan = wrapper.querySelector('#about-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

// Перевірка першого візиту
function isFirstVisit() {
  return !localStorage.getItem(STORAGE_KEY);
}

// Позначити що користувач вже був
function markAsVisited() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

// Публічна ініціалізація
export function initAboutProject() {
  // Чекаємо поки карта завантажиться
  const checkMapReady = setInterval(() => {
    if (document.body.classList.contains('map-ready')) {
      clearInterval(checkMapReady);
      
      // Якщо перший візит - показуємо попап через 1 секунду
      if (isFirstVisit()) {
        setTimeout(() => {
          openAboutModal();
          markAsVisited();
        }, 1000);
      }
    }
  }, 100);

  // Додаємо обробник для кнопки "Про проект" (десктоп)
  const aboutBtn = document.getElementById('about-btn');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', openAboutModal);
  }

  // Додаємо обробник для логотипу (мобільний)
  if (window.isMobile) {
    const mobileLogo = document.querySelector('#mobile-ui .logo-container');
    if (mobileLogo) {
      mobileLogo.addEventListener('click', openAboutModal);
      // Додаємо клас для стилізації (щоб показати що клікабельний)
      mobileLogo.classList.add('clickable');
    }
  }
}

export { openAboutModal, closeAboutModal };