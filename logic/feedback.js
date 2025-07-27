// Робочий скрипт для фідбек‑форми: довантаження, відкриття/закриття, сабміт

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwHvMD-aL0E8sAqp0-D_AT2k0xvigwnad2ubmjVo0cfJYbCE2TwKj2MiIMn_OjCBnKg/exec://script.google.com/macros/s/1S5ZXtZlBnqowTY2KtXCqapiG9DKnF7QUD0kBCPNBnAPuNX_A2tKyNXfE/exec"; // заміни на свій URL

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      email: form.email.value.trim(),
      message: form.message.value.trim(),
    };
    try {
      await submitFeedback(data);
      alert('Дякуємо за ваш відгук!');
      form.reset();
      closeFeedback();
    } catch (err) {
      alert(err.message || 'Не вдалося надіслати. Спробуйте пізніше.');
    }
  });
}

// Публічна ініціалізація: привʼязати кнопку
function initFeedback() {
  const toggle = document.getElementById('feedback-toggle');
  if (toggle) toggle.addEventListener('click', openFeedback);
}

export { initFeedback };
