export const mapboxToken = 'pk.eyJ1IjoibmVkaWxpdWsiLCJhIjoiY205ZzY3YzVuMTFlNDJqcjd3M3R5M28wNiJ9.d9pdFMa-zjnOugdymxHh9w';

// Базовий стиль без параметрів
const baseStyle = 'mapbox://styles/nediliuk/cm9gm5flo00k801s8hjuz8u0f';

// Додаємо таймстемп щоразу, коли карта ініціалізується
export const mapboxStyle = `${baseStyle}?ts=${Date.now()}`;
