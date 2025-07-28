// Робочий скрипт для фідбек‑форми: довантаження, відкриття/закриття, сабміт

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbycWLKdCKPkrdnt0H8sqY8GrNs5CW-lj4ck21hpJRRjN0N7OPTgFajdcfz7X8g00_rg/exec"; // заміни на свій URL

// Довантаження HTML форми (одноразово)
async function ensureFeedbackHtml() {
  let wrapper = document.getElementById('feedback-wrapper');
  if (wrapper) return wrapper; // вже в DOM

  const html = await fetch('./ui/feedback.html').then(r => r.text());
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

// Сабміт форми
async function submitFeedback(data) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Помилка при надсиланні');
}

// Логіка полів форми та сабміту
function initFormLogic() {
  const wrapper = document.getElementById('feedback-wrapper');
  const form = document.getElementById('feedback-form');
  if (!wrapper || !form) return;

  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) closeFeedback();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFeedback();
  });

  // === Валідація та сабміт ===
  const emailInput = form.querySelector('input[type="text"], input[name="email"], #email');
  const messageInput = form.querySelector('textarea[name="message"], textarea, #message');

  // Додаємо елементи для помилок, якщо їх немає
  let emailError = form.querySelector('.email-error');
  if (!emailError && emailInput) {
    emailError = document.createElement('div');
    emailError.className = 'email-error error';
    emailInput.insertAdjacentElement('afterend', emailError);
  }
  let messageError = form.querySelector('.message-error');
  if (!messageError && messageInput) {
    messageError = document.createElement('div');
    messageError.className = 'message-error error';
    messageInput.insertAdjacentElement('afterend', messageError);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    // Email: дозволяємо порожній або валідний email
    if (emailInput) {
      const email = emailInput.value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = "Тут має бути саме email, а не щось інше…";
        emailError.style.display = "block";
        valid = false;
      } else {
        emailError.textContent = "";
        emailError.style.display = "none";
      }
    }

    // Message: обов'язкове поле
    if (messageInput) {
      const message = messageInput.value.trim();
      if (!message) {
        messageError.textContent = "Порожнє повідомлення відправити не можна…";
        messageError.style.display = "block";
        valid = false;
      } else {
        messageError.textContent = "";
        messageError.style.display = "none";
      }
    }

    if (!valid) return;

    // Якщо все валідно — відправляємо
    const data = {
      email: emailInput ? emailInput.value.trim() : "",
      message: messageInput ? messageInput.value.trim() : "",
    };
    try {
      await submitFeedback(data);
      alert('Дякуємо за ваш відгук!');
      form.reset();
      closeFeedback();
    } catch (err) {
      alert(err.message || 'Не вдалося надіслати. Спробуйте пізніше');
    }
  });

  // При зміні полів ховаємо помилки
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      emailError.textContent = "";
      emailError.style.display = "none";
    });
  }
  if (messageInput) {
    messageInput.addEventListener('input', () => {
      messageError.textContent = "";
      messageError.style.display = "none";
    });
  }
}

// Публічна ініціалізація: привʼязати кнопку
function initFeedback() {
  const toggle = document.getElementById('feedback-toggle');
  if (toggle) toggle.addEventListener('click', openFeedback);
}

export { initFeedback };
