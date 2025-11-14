// logic/vegetable-loader.js
// Чистий лоадер з анімацією овочів

export class VegetableLoader {
  constructor() {
    this.vegetables = document.querySelectorAll('.vegetable');
    this.currentIndex = 0;
    this.isRunning = false;
    this.interval = null;
  }

  start() {
    if (this.isRunning || this.vegetables.length === 0) return;

    this.isRunning = true;

    // Вибираємо випадковий овоч для початку
    this.currentIndex = Math.floor(Math.random() * this.vegetables.length);

    // Миттєво показуємо випадковий перший
    this.showVegetable(this.currentIndex);
    
    // Швидка зміна кожні 0.6 секунди
    this.interval = setInterval(() => {
      this.nextVegetable();
    }, 600);
  }

  nextVegetable() {
    // Приховуємо поточний
    this.hideVegetable(this.currentIndex);
    
    // Переходимо до наступного
    this.currentIndex = (this.currentIndex + 1) % this.vegetables.length;
    
    // Показуємо наступний з короткою затримкою
    setTimeout(() => {
      this.showVegetable(this.currentIndex);
    }, 100);
  }

  showVegetable(index) {
    const vegetable = this.vegetables[index];
    if (!vegetable) return;
    
    vegetable.classList.remove('leaving');
    vegetable.classList.add('active');
  }

  hideVegetable(index) {
    const vegetable = this.vegetables[index];
    if (!vegetable) return;
    
    vegetable.classList.add('leaving');
    vegetable.classList.remove('active');
    
    setTimeout(() => {
      vegetable.classList.remove('leaving');
    }, 200);
  }

  stop() {
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    // Приховуємо всі зображення
    this.vegetables.forEach(veg => {
      veg.classList.remove('active', 'leaving');
    });
  }
}