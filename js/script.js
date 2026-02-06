const viewport = document.querySelector('.carousel__viewport');
const track = document.querySelector('.carousel__track');
const prev = document.querySelector('.prev');
const next = document.querySelector('.next');

/* === 1. ОРИГИНАЛЬНЫЕ КАРТОЧКИ === */
const originalCards = Array.from(track.children);
const cardCount = originalCards.length;

const gap = 40;
const speed = 3000;

/* === 2. ЗАЩИТА ОТ ПОВТОРНОГО КЛОНИРОВАНИЯ === */
if (!track.classList.contains('is-cloned')) {
  track.classList.add('is-cloned');

  originalCards.forEach(card => {
    track.append(card.cloneNode(true));
    track.prepend(card.cloneNode(true));
  });
}

/* === 3. ВСЕ КАРТОЧКИ === */
const cards = Array.from(track.children);

/* === 4. РАЗМЕРЫ === */
const cardWidth = originalCards[0].offsetWidth + gap;

/* === 5. СТАРТ С ПЕРВОЙ ОРИГИНАЛЬНОЙ === */
let position = cardWidth * cardCount;
track.style.transform = `translateX(-${position}px)`;

/* === 6. АКТИВНАЯ КАРТОЧКА (БЛИЖАЙШАЯ К ЦЕНТРУ) === */
function updateActive() {
  const viewportCenter =
    viewport.getBoundingClientRect().left +
    viewport.offsetWidth / 2;

  let closest = null;
  let minDistance = Infinity;

  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const distance = Math.abs(center - viewportCenter);

    if (distance < minDistance) {
      minDistance = distance;
      closest = card;
    }
  });

  cards.forEach(card => card.classList.remove('active'));
  if (closest) closest.classList.add('active');
}

requestAnimationFrame(updateActive);

/* === 7. ДВИЖЕНИЕ === */
function move(dir = 1) {
  position += cardWidth * dir;
  track.style.transition = 'transform 0.6s ease';
  track.style.transform = `translateX(-${position}px)`;
}

/* === 8. БЕСКОНЕЧНЫЙ RESET БЕЗ РЫВКА === */
track.addEventListener('transitionend', () => {
  const max = cardWidth * cardCount * 2;
  const min = cardWidth * cardCount;

  if (position >= max) {
    track.style.transition = 'none';
    position = min;
    track.style.transform = `translateX(-${position}px)`;
  }

  if (position < min) {
    track.style.transition = 'none';
    position = max - cardWidth;
    track.style.transform = `translateX(-${position}px)`;
  }

  requestAnimationFrame(updateActive);
});

/* === 9. КНОПКИ === */
next.addEventListener('click', () => move(1));
prev.addEventListener('click', () => move(-1));

/* === 10. АВТОПРОКРУТКА === */
let auto = setInterval(() => move(1), speed);

viewport.addEventListener('mouseenter', () => clearInterval(auto));
viewport.addEventListener('mouseleave', () => {
  auto = setInterval(() => move(1), speed);
});

/* === 11. СВАЙП === */
let startX = 0;

viewport.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX;
});

viewport.addEventListener('touchend', e => {
  const endX = e.changedTouches[0].clientX;
  if (startX - endX > 50) move(1);
  if (endX - startX > 50) move(-1);
});