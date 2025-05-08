// Створює індикатори поза вʼюпортом (один раз, для подальшого оновлення)
export function renderOffscreenIndicators(map, fairs) {
  const container = document.getElementById('offscreen-indicators') || createIndicatorContainer();
  container.innerHTML = ''; // очищення попередніх

  for (const fair of fairs) {
    if (!fair.centroid) continue;

    const el = document.createElement('div');
    el.className = 'indicator';
    el.dataset.id = fair.address; // ідентифікатор індикатора
    el.style.position = 'absolute';
    el.style.opacity = '0'; // спочатку прихований

    container.appendChild(el);
  }
}

// Оновлює лише видимість і позицію
export function updateOffscreenIndicators(map, visibleFairs) {
  const container = document.getElementById('offscreen-indicators');
  if (!container) return;

  const center = map.getCenter();
  const canvas = map.getCanvas();
  const screenWidth = canvas.clientWidth;
  const screenHeight = canvas.clientHeight;
  const screenCenter = map.project([center.lng, center.lat]);

  const activeMap = new Map();
  for (const fair of visibleFairs) {
    if (!fair.centroid) continue;
    activeMap.set(fair.address, fair);
  }

  const indicators = container.querySelectorAll('.indicator');
  indicators.forEach(el => {
    const fair = activeMap.get(el.dataset.id);
    if (!fair) {
      el.style.opacity = '0';
      return;
    }

    const [lng, lat] = fair.centroid;
    const projected = map.project([lng, lat]);
    const isOnscreen =
      projected.x >= 0 && projected.x <= screenWidth &&
      projected.y >= 0 && projected.y <= screenHeight;

    if (isOnscreen) {
      el.style.opacity = '0';
      return;
    }

    const dx = projected.x - screenCenter.x;
    const dy = projected.y - screenCenter.y;
    const angle = Math.atan2(dy, dx);

    const margin = 8;
    const halfWidth = screenWidth / 2 - margin;
    const halfHeight = screenHeight / 2 - margin;

    const ratio = Math.min(
      Math.abs(halfWidth / Math.cos(angle)),
      Math.abs(halfHeight / Math.sin(angle))
    );

    const x = screenCenter.x + Math.cos(angle) * ratio;
    const y = screenCenter.y + Math.sin(angle) * ratio;

    const { offsetWidth, offsetHeight } = el;
    el.style.left = `${x - offsetWidth / 2}px`;
    el.style.top = `${y - offsetHeight / 2}px`;
    el.style.transform = `rotate(${angle}rad)`;
    el.style.opacity = '1';
  });
}

function createIndicatorContainer() {
  const el = document.createElement('div');
  el.id = 'offscreen-indicators';
  el.style.position = 'absolute';
  el.style.top = '0';
  el.style.left = '0';
  el.style.width = '100%';
  el.style.height = '100%';
  el.style.pointerEvents = 'none';
  el.style.zIndex = '9';
  document.body.appendChild(el);
  return el;
}
