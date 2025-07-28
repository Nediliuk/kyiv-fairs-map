// Робочий скрипт для фідбек‑форми: довантаження, відкриття/закриття, сабміт

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxNGGsN6_-w0SvHCQIHzHWEuEOUhVxu3bQ0Zd2zmv5x3wjUVrm5jJfwR-_kG-XPhYKV/exec"; // URL веб‑застосунку Apps Script
const FEEDBACK_PATH = './ui/feedback.html'; // шлях до HTML форми (змінюй при потребі)

// Довантаження HTML форми (одноразово)
async function ensureFeedbackHtml() {
  let wrapper = document.getElementById('feedback-wrapper');
  if (wrapper) return wrapper; // вже в DOM

  const html = await fetch(FEEDBACK_PATH).then(r => r.text());
  const temp = document.createElement('div');
  temp.innerHTML = html.trim();
  wrapper = temp.querySelector('#feedback-wrapper') || temp.firstElementChild;

  document.body.appendChild(wrapper);
  initFormLogic(); // слухачі форми після вставки
  return wrapper;
}

// Відкрити / закрити модалку
async function openFeedback() {
  const wrapper = await ensureFeedbackHtml();
  wrapper.style.display = 'flex';
}

function closeFeedback() {
  const wrapper = document.getElementById('feedback-wrapper');
  if (wrapper) wrapper.style.display = 'none';
}

// Сабміт форми: simple request без pre‑flight CORS
async function submitFeedback(data) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // simple request → без pre‑flight
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Помилка при надсиланні');
}

// Логіка полів форми та сабміту
function initFormLogic() {
  const wrapper = document.getElementById('feedback-wrapper');
  const form    = document.getElementById('feedback-form');
  if (!wrapper || !form) return;

  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) closeFeedback();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFeedback();
  });

  const emailInput   = form.querySelector('input[name="email"]');
  const messageInput = form.querySelector('textarea[name="message"]');
  const emailError   = form.querySelector('.email-error')   || createErrorBlock(emailInput,  'email-error');
  const messageError = form.querySelector('.message-error') || createErrorBlock(messageInput,'message-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    // Email: порожній або валідний
    if (emailInput) {
      const email = emailInput.value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError(emailError, 'Тут має бути email, або залиште поле порожнім…');
        valid = false;
      } else hideError(emailError);
    }

    // Message: обовʼязкове
    if (messageInput) {
      const message = messageInput.value.trim();
      if (!message) {
        showError(messageError, 'Порожнє повідомлення відправити не можна…');
        valid = false;
      } else hideError(messageError);
    }

    if (!valid) return;

    try {
      await submitFeedback({
        email:   emailInput   ? emailInput.value.trim()   : '',
        message: messageInput ? messageInput.value.trim() : '',
      });
      alert('Дякуємо за ваш відгук!');
      form.reset();
      closeFeedback();
    } catch (err) {
      alert(err.message || 'Не вдалося надіслати. Спробуйте пізніше');
    }
  });

  emailInput?.addEventListener('input',   () => hideError(emailError));
  messageInput?.addEventListener('input', () => hideError(messageError));
}

function createErrorBlock(afterEl, className) {
  if (!afterEl) return null;
  const div = document.createElement('div');
  div.className = `${className} error`;
  afterEl.insertAdjacentElement('afterend', div);
  return div;
}

function showError(el, msg) { if (el) { el.textContent = msg; el.style.display = 'block'; } }
function hideError(el)      { if (el) { el.textContent = '';  el.style.display = 'none';  } }

// Публічна ініціалізація: привʼязати кнопку
function initFeedback() {
  const toggle = document.getElementById('feedback-toggle');
  if (toggle) toggle.addEventListener('click', openFeedback);
}

export { initFeedback };
