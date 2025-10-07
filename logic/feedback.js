// logic/feedback.js
// Модуль для форми зворотного зв'язку

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzqGU0mvA7G8di4aSs3vinL1Dbtluh_MENH-eQ-9ug7ievZLzP3Rdpbx-zEVjlfiuM7/exec";
const FEEDBACK_PATH = './ui/feedback.html';

// Довантаження HTML форми (одноразово)
async function ensureFeedbackHtml() {
  let wrapper = document.getElementById('feedback-wrapper');
  if (wrapper) return wrapper;

  const html = await fetch(FEEDBACK_PATH).then(r => r.text());
  const temp = document.createElement('div');
  temp.innerHTML = html.trim();
  wrapper = temp.querySelector('#feedback-wrapper') || temp.firstElementChild;

  document.body.appendChild(wrapper);
  initFormLogic();
  return wrapper;
}

// Відкрити модалку
async function openFeedback() {
  const wrapper = await ensureFeedbackHtml();
  wrapper.style.display = 'flex';
  setTimeout(() => {
    wrapper.classList.add('visible');
  }, 10);
}

// Закрити модалку
function closeFeedback() {
  const wrapper = document.getElementById('feedback-wrapper');
  if (wrapper) {
    wrapper.classList.remove('visible');
    setTimeout(() => {
      wrapper.style.display = 'none';
    }, 300);
  }
}

// Сабміт форми
async function submitFeedback(data) {
  const form = new URLSearchParams();
  if (data.email)   form.set('email', data.email.trim());
  if (data.message) form.set('message', data.message.trim());

  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) throw new Error(`Помилка при надсиланні (HTTP ${res.status})`);

  let payload = null;
  try { payload = await res.json(); } catch (_) {}
  if (payload && payload.status && payload.status !== 'ok') {
    throw new Error(payload.message || 'Помилка при надсиланні');
  }
}

// Логіка форми
function initFormLogic() {
  const wrapper = document.getElementById('feedback-wrapper');
  const form    = document.getElementById('feedback-form');
  if (!wrapper || !form) return;

  // Закриття по кліку на overlay
  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) closeFeedback();
  });

  // Закриття по кліку на хрестик
  const closeBtn = wrapper.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeFeedback);
  }

  // Закриття по Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape' && wrapper.classList.contains('visible')) {
      closeFeedback();
    }
  };
  document.addEventListener('keydown', handleEscape);

  const emailInput   = form.querySelector('input[name="email"]');
  const messageInput = form.querySelector('textarea[name="message"]');
  const submitBtn    = form.querySelector('[type="submit"]');
  const emailError   = form.querySelector('.email-error')   || createErrorBlock(emailInput,  'email-error');
  const messageError = form.querySelector('.message-error') || createErrorBlock(messageInput,'message-error');

  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    let valid = true;

    // Email: порожній або валідний
    if (emailInput) {
      const email = emailInput.value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError(emailError, 'Тут має бути email, або залиште поле порожнім…');
        valid = false;
      } else hideError(emailError);
    }

    // Message: обов'язкове
    if (messageInput) {
      const message = messageInput.value.trim();
      if (!message) {
        showError(messageError, 'Порожнє повідомлення відправити не можна…');
        valid = false;
      } else hideError(messageError);
    }

    if (!valid) return;

    // Loading state
    setLoading(submitBtn, true);
    isSubmitting = true;

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
    } finally {
      setLoading(submitBtn, false);
      isSubmitting = false;
    }
  });

  emailInput?.addEventListener('input',   () => hideError(emailError));
  messageInput?.addEventListener('input', () => hideError(messageError));
}

function setLoading(btn, on) {
  if (!btn) return;
  if (on) {
    if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Надсилаємо…';
  } else {
    btn.classList.remove('is-loading');
    btn.removeAttribute('aria-busy');
    if (btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
  }
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

// Публічна ініціалізація
function initFeedback() {
  const toggle = document.getElementById('feedback-toggle');
  if (toggle) toggle.addEventListener('click', openFeedback);
}

export { initFeedback, openFeedback };