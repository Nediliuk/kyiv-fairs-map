// logic/about-project.js
// Модуль для показу інформації про проект

const STORAGE_KEY = 'kyiv-fairs-first-visit';

let aboutModal = null;

// Створення HTML модального вікна
function createAboutModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="about-modal">
      <button class="about-modal-close" aria-label="Закрити">×</button>
      
        <div class="about-modal-illustration">
          <img src="/media/images/fair-illustration.png" alt="Ілюстрація ярмарку" />
        </div>

        <div class="about-modal-body">
          <h2>Що таке єЯрмарок?</h2>

          <p class="about-modal-description">
            Це карта Києва з фермерськими ярмарками які проходять щодня 
            окрім понеділка в різних районах столиці.
          </p>

          <p class="about-modal-description">
            Це неприбутковий, недержавний проект вихідного дня, 
            написаний із допомогою штучного інтелекту.
          </p>

          <p class="about-modal-description">
            Дані з офіційного <a href="https://data.gov.ua/dataset/6ba9c4e1-3dad-4423-b641-0b7d76720a55" target="_blank" rel="noopener noreferrer">API КМДА</a>.
          </p>

          <p class="about-modal-description">
            Якщо маєте скарги чи пропозиції тисніть кнопку <a href="#" id="feedback-link">Відгук</a>.
          </p>

          <div class="about-modal-footer">
            <p class="about-modal-credits">
              Ідея і дизайн: <a href="https://www.instagram.com/nediliuk_official/" target="_blank" rel="noopener">@nediliuk_official</a>&nbsp;&nbsp;&nbsp;Ілюстрації: <a href="https://www.instagram.com/simka_shpin/" target="_blank" rel="noopener">@simka_shpin</a>
            </p>
            <p class="about-modal-copyright" id="about-modal-copyright">
              Всі права захищено © Київ, <span id="about-modal-year"></span>
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Динамічно вставляємо поточний рік
  const yearSpan = modal.querySelector('#about-modal-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  return modal;
}

// Відкриття модального вікна
export function openAboutModal() {
  if (!aboutModal) {
    aboutModal = createAboutModal();
    
    // Закриття по кліку на overlay
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) {
        closeAboutModal();
      }
    });

    // Закриття по кліку на хрестик
    const closeBtn = aboutModal.querySelector('.about-modal-close');
    closeBtn.addEventListener('click', closeAboutModal);

    // Обробник для посилання "Відгук"
    const feedbackLink = aboutModal.querySelector('#feedback-link');
    if (feedbackLink) {
      feedbackLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeAboutModal();
        // Відкриваємо форму фідбеку
        const feedbackBtn = document.querySelector('.feedback-btn');
        if (feedbackBtn) {
          feedbackBtn.click();
        }
      });
    }

    // Закриття по Escape
    document.addEventListener('keydown', handleEscape);
  }

  // Показуємо модал
  setTimeout(() => {
    aboutModal.classList.add('visible');
  }, 10);
}

// Закриття модального вікна
export function closeAboutModal() {
  if (aboutModal) {
    aboutModal.classList.remove('visible');
    
    setTimeout(() => {
      aboutModal.remove();
      aboutModal = null;
      document.removeEventListener('keydown', handleEscape);
    }, 300);
  }
}

// Обробник клавіші Escape
function handleEscape(e) {
  if (e.key === 'Escape') {
    closeAboutModal();
  }
}

// Перевірка першого візиту
export function isFirstVisit() {
  return !localStorage.getItem(STORAGE_KEY);
}

// Позначити що користувач вже був
export function markAsVisited() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

// Ініціалізація: показати попап при першому візиті
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

  // Додаємо обробник для кнопки "Про проект"
  const aboutBtn = document.getElementById('about-btn');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', openAboutModal);
  }
}