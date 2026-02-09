const viewport = document.querySelector('.carousel__viewport');
const track = document.querySelector('.carousel__track');
const prev = document.querySelector('.prev');
const next = document.querySelector('.next');

/* ✅ ВАЖНО: на <=450px отключаем карусель полностью */
if (window.matchMedia('(max-width: 450px)').matches) {
  track.style.transform = 'none';
  track.style.transition = 'none';
  // (опционально) можно скрыть кнопки, чтобы не мешали
  if (prev) prev.style.display = 'none';
  if (next) next.style.display = 'none';
} else {

  /* === 1. ОРИГИНАЛЬНЫЕ КАРТОЧКИ === */
  const originalCards = Array.from(track.children);
  const cardCount = originalCards.length;

  const gap = 40;
  const speed = 2000;

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
  if (next) next.addEventListener('click', () => move(1));
  if (prev) prev.addEventListener('click', () => move(-1));

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

} // конец else (карусель только >450px)

/* ===== BURGER MENU ===== */
document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.header__burger');
  const nav = document.querySelector('.header__nav');

  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    burger.classList.toggle('is-active');
    nav.classList.toggle('is-open');
    document.body.classList.toggle('nav-open');
  });

  // Закрытие по клику на ссылку
  nav.addEventListener('click', (e) => {
    if (e.target.classList.contains('header__nav-link')) {
      burger.classList.remove('is-active');
      nav.classList.remove('is-open');
      document.body.classList.remove('nav-open');
    }
  });

  // Закрытие по ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      burger.classList.remove('is-active');
      nav.classList.remove('is-open');
      document.body.classList.remove('nav-open');
    }
  });
});


// ===== Modal + отправка формы =====
(() => {
  const openBtn = document.querySelector('#openTourModal');
  const modal = document.querySelector('#tourModal');
  const form = document.querySelector('#tourForm');
  const statusEl = document.querySelector('#tourStatus');

  if (!openBtn || !modal || !form || !statusEl) return;

  const openModal = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nav-open'); // блокируем скролл как в меню
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nav-open');
    statusEl.textContent = '';
    form.reset();
  };

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  modal.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-close')) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const name = (formData.get('name') || '').toString().trim();
    const phone = (formData.get('phone') || '').toString().trim();

    if (name.length < 2) {
      statusEl.textContent = t('modal_err_name');
      return;
    }
    if (phone.length < 7) {
      statusEl.textContent = t('modal_err_phone');
      return;
    }

    statusEl.textContent = t('modal_sending');

    try {
      const res = await fetch('./send.php', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        statusEl.textContent = t('modal_send_error');
        return;
      }

      statusEl.textContent = t('modal_success');
      setTimeout(closeModal, 1200);
    } catch (err) {
      statusEl.textContent = t('modal_no_connection');
    }
  });
})();


/* =========================
   i18n: RU / UZ / EN
========================= */

const translations = {
  ru: {
    logo_tagline: "Travel <br>agency",

    aria_open_menu: "Открыть меню",
    aria_close: "Закрыть",

    nav_home: "Главная",
    nav_pick: "Подобрать тур",
    nav_tours: "Туры",
    nav_about: "О нас",
    nav_address: "Адрес",
    nav_contacts: "Контакты",

    banner_title: "Весь мир ближе,<br>чем кажется...",
    banner_offer: "Авиабилеты по всему миру<br>Пакетные туры: Азия | Европа <br> Круизы",

    popular_title: "ПОПУЛЯРНЫЕ НАПРАВЛЕНИЯ",

    card1_title: "Турция",
    card1_desc: "Солнце, море и комфорт “всё включено”\nИдеальный выбор для семейного отдыха и романтических поездок. Тёплое море, отличные отели, богатая кухня и высокий уровень сервиса по доступной цене.",
    card2_title: "ОАЭ",
    card2_desc: "Роскошь, технологии и восточная сказка\nСовременные мегаполисы, пустынные сафари, пляжный отдых и шопинг мирового уровня. Отлично подойдёт для тех, кто хочет впечатлений и комфорта.",
    card3_title: "Египет",
    card3_desc: "История цивилизаций и Красное море\nПирамиды, древние храмы и лучшие коралловые рифы. Прекрасный вариант для отдыха круглый год с насыщенной экскурсионной программой.",
    card4_title: "Мальдивы",
    card4_desc: "Уединение, океан и абсолютный релакс\nБелоснежные пляжи, бирюзовая вода и виллы над океаном. Идеальное направление для медового месяца и спокойного отдыха вдали от суеты.",
    card5_title: "Таиланд",
    card5_desc: "Экзотика, природа и улыбки\nТропические острова, вкусная кухня, массажи и насыщенная ночная жизнь. Подходит как для активного, так и для расслабленного отдыха.",
    card6_title: "Италия",
    card6_desc: "Культура, гастрономия и романтика\nИсторические города, море, мода и изысканная кухня. Отличный выбор для тех, кто хочет совместить vacation и культурные впечатления.",

    about_title: "Почему BI TOUR",
    about_lead: "Мы не просто продаём туры. Мы берём на себя заботу о вашем отдыхе, чтобы вы спокойно наслаждались поездкой от первого шага до возвращения домой.",

    about_card1_title: "Индивидуальный подход",
    about_card1_desc: "Подбираем тур именно под вас, а не «как у всех»",
    about_card2_title: "Официальная компания",
    about_card2_desc: "Работаем прозрачно и только по договору",
    about_card3_title: "Лучшие цены",
    about_card3_desc: "Прямые партнёры и всегда актуальные предложения",
    about_card4_title: "Поддержка 24/7",
    about_card4_desc: "Мы на связи до, во время и после поездки",
    about_card5_title: "Полное сопровождение",
    about_card5_desc: "От первой заявки до вашего возвращения домой",
    about_card6_title: "Проверенные направления",
    about_card6_desc: "Рекомендуем только те маршруты, в которых уверены сами",
    about_card7_title: "Экономия времени",
    about_card7_desc: "Быстро, удобно и без лишних вопросов",
    about_card8_title: "Спокойствие в поездке",
    about_card8_desc: "Мы всё проверяем заранее, чтобы вы просто отдыхали",
    about_card9_title: "Живое общение",
    about_card9_desc: "Всегда объясним, подскажем и поможем",

    about_bottom: " — это спокойствие, уверенность и комфорт в каждом путешествии. Мы рядом на всех этапах, чтобы ваш vacation был именно таким, каким вы его представляете.",

    map_title: "Наш Адрес",

    footer_address: "Узбекистан, г. Ташкент<br>Проспект Амира темура, 15<br>Ориэнтир: TIFT university<br>",

    modal_title: "Подобрать тур",
    modal_subtitle: "Оставьте контакты, мы свяжемся с вами",
    modal_name_label: "Имя",
    modal_phone_label: "Телефон",
    modal_name_ph: "Ваше имя",
    modal_phone_ph: "+998 90 123 45 67",
    modal_submit: "Отправить",

    modal_err_name: "Введите корректное имя.",
    modal_err_phone: "Введите корректный номер телефона.",
    modal_sending: "Отправляем...",
    modal_send_error: "Ошибка отправки. Попробуйте позже.",
    modal_success: "Готово! Мы скоро с вами свяжемся ✅",
    modal_no_connection: "Нет соединения. Попробуйте ещё раз."
  },

  uz: {
    logo_tagline: "Sayohat <br>agentligi",

    aria_open_menu: "Menyuni ochish",
    aria_close: "Yopish",

    nav_home: "Bosh sahifa",
    nav_pick: "Tur tanlash",
    nav_tours: "Turlar",
    nav_about: "Biz haqimizda",
    nav_address: "Manzil",
    nav_contacts: "Aloqa",

    banner_title: "Butun dunyo<br>o'ylaganingdan ham<br>yaqinroq...",
    banner_offer: "Butun dunyo bo‘ylab aviabiletlar<br>Tur paketlari: Osiyo | Yevropa <br> Kruizlar",

    popular_title: "OMMABOP YO‘NALISHLAR",

    card1_title: "Turkiya",
    card1_desc: "Quyosh, dengiz va “all inclusive”. Hissiyotga boy va oilaviy sayohatlar uchun ideal tanlov. Iliq dengiz, a'lo darajadagi mehmonxonalar, mazali taomlar va qulay narxda yuqori xizmat.",
    card2_title: "BAA",
    card2_desc: "Hashamat, texnologiya va sharqona ertak, zamonaviy megapolislar, cho‘l safari, plyajda dam olish va jahon darajasidagi shopping. Taassurot va komfort istaganlar uchun.",
    card3_title: "Misr",
    card3_desc: "Sivilizatsiya tarixi va qizil dengiz, piramidalar, qadimiy ibodatxonalar va eng chiroyli marjon riflari. Butun yil davomida dam olish va boy ekskursiya dasturi uchun a’lo tanlov.",
    card4_title: "Maldiv orollari",
    card4_desc: "Yolg‘izlik, okean va mutloq hordiq. Oppoq plyajlar, moviy suv va okean ustidagi villalar. Asal oyi va shovqindan uzoqda sokin dam olish uchun ideal tanlov.",
    card5_title: "Tailand",
    card5_desc: "Ekzotika, tabiat va tabassumlar Tropik orollar, mazali oshxona, massajlar va jonli tungi hayot. Faol, ham sokin dam olish uchun mos tanlov.",
    card6_title: "Italiya",
    card6_desc: "Madaniyat, gastronomiya va romantika. Tarixiy shaharlar, dengiz, moda va nafis taomlar. Dam olishni madaniy taassurotlar bilan birlashtirmoqchi bo‘lganlar uchun.",

    about_title: "Nega aynan BI TOUR",
    about_lead: "Biz shunchaki tur sotmaymiz. Dam olishingizni o‘z zimmamizga olamiz, siz esa sayohatni birinchi qadamidan uyga qaytgunga qadar xotirjam bahramand bo‘lasiz.",

    about_card1_title: "Individual yondashuv",
    about_card1_desc: "Sayohatni aynan siz uchun, moslashtiramiz",
    about_card2_title: "Rasmiy kompaniya",
    about_card2_desc: "Shaffof va faqat shartnoma asosida ishlaymiz",
    about_card3_title: "Eng yaxshi narxlarda",
    about_card3_desc: "To‘g‘ridan-to‘g‘ri hamkorlar va doim dolzarb takliflar",
    about_card4_title: "24/7 qo‘llab-quvvatlash",
    about_card4_desc: "Safardan oldin, safar davomida va safardan keyin ham aloqadamiz",
    about_card5_title: "To‘liq hamrohlik",
    about_card5_desc: "Birinchi arizadan uyga qaytguningizgacha",
    about_card6_title: "Ishonchli yo‘nalishlar",
    about_card6_desc: "O‘zimiz ishonadigan yo'nalishlarni tavsiya qilamiz",
    about_card7_title: "Vaqt tejaladi",
    about_card7_desc: "Tez, qulay va ortiqcha savollarsiz",
    about_card8_title: "Safarda xotirjamlik",
    about_card8_desc: "Hammasini oldindan tekshiramiz, siz faqat dam olasiz",
    about_card9_title: "Jonli muloqot",
    about_card9_desc: "Har doim tushuntiramiz, maslahat beramiz va yordam beramiz",

    about_bottom: " — bu har bir sayohatda xotirjamlik, ishonch va qulaylik. Dam olishingiz siz tasavvur qilganingizdek bo‘lishi uchun har bosqichda yoningizdamiz.",

    map_title: "Manzilimiz",

    footer_address: "O‘zbekiston, Toshkent sh.<br>Amir Temur shoh ko‘chasi, 15<br>Mo‘ljal: TIFT university<br>",

    modal_title: "Tur tanlash",
    modal_subtitle: "Kontaktlaringizni qoldiring, siz bilan bog‘lanamiz",
    modal_name_label: "Ismingiz",
    modal_phone_label: "Telefon raqamingiz",
    modal_name_ph: "Ismingiz",
    modal_phone_ph: "+998 90 123 45 67",
    modal_submit: "Yuborish",

    modal_err_name: "Iltimos, ismni to‘g‘ri kiriting.",
    modal_err_phone: "Iltimos, telefon raqamini to‘g‘ri kiriting.",
    modal_sending: "Yuborilmoqda...",
    modal_send_error: "Yuborishda xatolik. Keyinroq urinib ko‘ring.",
    modal_success: "Tayyor! Tez orada siz bilan bog‘lanamiz ✅",
    modal_no_connection: "Ulanish yo‘q. Yana urinib ko‘ring."
  },

  en: {
    logo_tagline: "Travel <br>agency",

    aria_open_menu: "Open menu",
    aria_close: "Close",

    nav_home: "Home",
    nav_pick: "Choose a tour",
    nav_tours: "Tours",
    nav_about: "About",
    nav_address: "Address",
    nav_contacts: "Contacts",

    banner_title: "The whole world<br>is closer,<br>than it seems...",
    banner_offer: "Flights worldwide<br>Package tours: Asia | Europe <br> Cruises",

    popular_title: "POPULAR DESTINATIONS",

    card1_title: "Turkey",
    card1_desc: "Sun, sea, and all inclusive comfort\nA perfect choice for family vacations and romantic trips. Warm sea, great hotels, rich cuisine, and high service at an affordable price.",
    card2_title: "UAE",
    card2_desc: "Luxury, technology, and an eastern fairytale\nModern cities, desert safaris, beach time, and world class shopping. Great for those who want comfort and memorable experiences.",
    card3_title: "Egypt",
    card3_desc: "Ancient history and the Red Sea\nPyramids, temples, and stunning coral reefs. A great year round option with a rich excursion program.",
    card4_title: "Maldives",
    card4_desc: "Privacy, ocean, and pure relaxation\nWhite sand beaches, turquoise water, and overwater villas. Ideal for honeymoons and quiet escapes.",
    card5_title: "Thailand",
    card5_desc: "Exotic vibes, nature, and smiles\nTropical islands, delicious food, massages, and lively nightlife. Great for both active adventures and relaxed vacation.",
    card6_title: "Italy",
    card6_desc: "Culture, cuisine, and romance\nHistoric cities, the sea, fashion, and exquisite food. Perfect for combining vacation with cultural experiences.",

    about_title: "Why BI TOUR",
    about_lead: "We don’t just sell tours. We take care of your trip so you can enjoy it calmly from the first step until you return home.",

    about_card1_title: "Personal approach",
    about_card1_desc: "We tailor the tour for you, not “like everyone else”",
    about_card2_title: "Official company",
    about_card2_desc: "Transparent work, contract only",
    about_card3_title: "Best prices",
    about_card3_desc: "Direct partners and always up to date offers",
    about_card4_title: "24/7 support",
    about_card4_desc: "With you before, during, and after the trip",
    about_card5_title: "Full assistance",
    about_card5_desc: "From the first request to your return home",
    about_card6_title: "Trusted destinations",
    about_card6_desc: "We recommend routes we truly trust",
    about_card7_title: "Time saving",
    about_card7_desc: "Fast, convenient, no extra hassle",
    about_card8_title: "Peace of mind",
    about_card8_desc: "We check everything in advance so you can simply vacation",
    about_card9_title: "Real communication",
    about_card9_desc: "We explain, advise, and help anytime",

    about_bottom: " means peace of mind, confidence, and comfort in every journey. We’re with you at every step so your vacation matches the way you imagine it.",

    map_title: "Our Address",

    footer_address: "Uzbekistan, Tashkent<br>Amir Temur Avenue, 15<br>Landmark: TIFT university<br>",

    modal_title: "Choose a tour",
    modal_subtitle: "Leave your contact details, we’ll reach out",
    modal_name_label: "Name",
    modal_phone_label: "Phone",
    modal_name_ph: "Your name",
    modal_phone_ph: "+998 90 123 45 67",
    modal_submit: "Send",

    modal_err_name: "Please enter a valid name.",
    modal_err_phone: "Please enter a valid phone number.",
    modal_sending: "Sending...",
    modal_send_error: "Sending failed. Please try again later.",
    modal_success: "Done! We’ll contact you soon ✅",
    modal_no_connection: "No connection. Please try again."
  }
};

let currentLang = localStorage.getItem('lang') || 'ru';

function t(key) {
  const pack = translations[currentLang] || translations.ru;
  return (pack && pack[key]) ? pack[key] : (translations.ru[key] || "");
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // <html lang="...">
  document.documentElement.setAttribute('lang', lang);

  // Text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (val !== "") el.innerHTML = val;
  });

  // Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const val = t(key);
    if (val !== "") el.setAttribute('placeholder', val);
  });

  // aria-label
  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    const key = el.dataset.i18nAriaLabel;
    const val = t(key);
    if (val !== "") el.setAttribute('aria-label', val);
  });

  // Update dropdown label
  const currentBtn = document.querySelector('.lang__current');
  if (currentBtn) currentBtn.innerHTML = lang.toUpperCase() + " ▾";
}

/* ===== Language dropdown behavior ===== */
document.addEventListener('DOMContentLoaded', () => {
  const lang = document.querySelector('.lang');
  const btn = document.querySelector('.lang__current');
  const list = document.querySelector('.lang__list');

  if (lang && btn && list) {
    const close = () => {
      lang.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const opened = lang.classList.toggle('open');
      btn.setAttribute('aria-expanded', opened ? 'true' : 'false');
    });

    list.querySelectorAll('li[data-lang]').forEach(item => {
      item.addEventListener('click', () => {
        applyLanguage(item.dataset.lang);
        close();
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          applyLanguage(item.dataset.lang);
          close();
        }
      });
    });

    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  applyLanguage(currentLang);
});