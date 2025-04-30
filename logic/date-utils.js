// === Повертає назву дня тижня для заданого timestamp (мс) ===
export function getWeekdayName(timestamp) {
    const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота'];
    const date = new Date(Number(timestamp));
    return days[date.getUTCDay()];
  }
  