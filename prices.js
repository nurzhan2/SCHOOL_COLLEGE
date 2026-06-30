// ============================================
// PRICES.JS — автоматическое применение цен из админки
// Подключается на всех страницах: <script src="prices.js"></script>
// ============================================
(function() {
  const STORAGE_KEY = 'shkolledge_prices';

  // Маппинг ключей → CSS-селекторы и форматы текста
  const PRICE_MAP = {
    // ШКОЛА
    school_prep: [
      { selector: '.amount', parent: '.price-card:has(h4)', text: v => v.toLocaleString('ru-RU'), h4match: 'Подготовительный класс' },
    ],

    // Универсальный подход — ищем по тексту в ближайших элементах
  };

  function formatNum(n) {
    return n.toLocaleString('ru-RU');
  }

  function applyPrices() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch(e) { return; }

    if(Object.keys(saved).length === 0) return;

    // Проходим по всему тексту страницы и заменяем цены
    const replacements = {
      // Школа
      school_prep:         { patterns: ['29 000', '29000'], newVal: null },
      school_primary:      { patterns: ['35 000', '35000'], newVal: null },
      school_middle:       { patterns: ['39 700', '39700'], newVal: null },
      // Колледж
      college_medicine:    { patterns: ['23 000 р/мес'], newVal: null, context: ['Лечебное', 'лечебн'] },
      college_nursing:     { patterns: ['23 000 р/мес'], newVal: null, context: ['Сестринск', 'сестринск'] },
      college_law:         { patterns: ['20 000 р/мес'], newVal: null },
      college_design:      { patterns: ['23 000 р/мес'], newVal: null, context: ['Дизайн', 'дизайн'] },
      college_teaching:    { patterns: ['23 000 р/мес'], newVal: null, context: ['Преподав', 'преподав'] },
      // Допобр
      extra_prep:          { patterns: ['10 500 р/мес'], newVal: null },
      extra_lang:          { patterns: ['8 000 р/мес (2 р/нед)'], newVal: null, context: ['язык', 'Язык'] },
      extra_chess:         { patterns: ['8 000 р/мес (2 р/нед)'], newVal: null, context: ['шахмат', 'Шахмат'] },
      extra_dance:         { patterns: ['8 000 р/мес'], newVal: null, context: ['танц', 'Танц'] },
      extra_music:         { patterns: ['1 000 р/занятие'], newVal: null },
      extra_vocal:         { patterns: ['900 р/занятие'], newVal: null, context: ['вокал', 'Вокал'] },
      extra_exam:          { patterns: ['1 500 р/занятие'], newVal: null },
      extra_mult:          { patterns: ['700 р/занятие'], newVal: null },
      extra_theatre:       { patterns: ['900 р/занятие'], newVal: null, context: ['Сценич', 'сценич', 'театр'] },
      extra_izo1:          { patterns: ['3 600 р/мес (2 р/нед)'], newVal: null, context: ['Общеразв', 'общеразв'] },
      extra_izo2:          { patterns: ['12 000 р/мес (2 р/нед)'], newVal: null },
      extra_calli:         { patterns: ['3 600 р/мес (2 р/нед)'], newVal: null, context: ['каллигр', 'Каллигр'] },
      summer_shift:        { patterns: ['10 500'], newVal: null, context: ['смен', 'Смен'] },
    };

    // Заполняем newVal из saved
    Object.keys(replacements).forEach(key => {
      if(saved[key] !== undefined) {
        replacements[key].newVal = saved[key];
      }
    });

    // Применяем к .course-detail-price, .price-card .amount, .price-badge, .hf-row
    const priceElements = document.querySelectorAll(
      '.course-detail-price, .amount, .price-badge, .hf-row b, .price-card .amount, [class*="price"]'
    );

    priceElements.forEach(el => {
      const text = el.textContent;

      Object.entries(replacements).forEach(([key, cfg]) => {
        if(cfg.newVal === null) return;

        cfg.patterns.forEach(pattern => {
          if(text.includes(pattern)) {
            // Проверяем контекст если нужно
            if(cfg.context) {
              const parentText = el.closest('section, .course-detail-card, .price-card, .hf-box, [class*="card"]')?.textContent || '';
              const matches = cfg.context.some(ctx => parentText.includes(ctx));
              if(!matches) return;
            }
            // Заменяем
            const formatted = formatNum(cfg.newVal);
            el.textContent = el.textContent.replace(
              new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
              formatted + (pattern.includes('р/') ? ' ' + pattern.split(' ').slice(-1)[0] : '')
            );
          }
        });
      });
    });

    // Специально для price-card .amount (числа без р/мес)
    document.querySelectorAll('.price-card').forEach(card => {
      const h4 = card.querySelector('h4')?.textContent || '';
      const amountEl = card.querySelector('.amount');
      if(!amountEl) return;

      if(h4.includes('Подготовительный') && saved.school_prep)
        amountEl.textContent = formatNum(saved.school_prep);
      else if(h4.includes('Начальная') && saved.school_primary)
        amountEl.textContent = formatNum(saved.school_primary);
      else if(h4.includes('Средняя') && saved.school_middle)
        amountEl.textContent = formatNum(saved.school_middle);
    });

    // ДПО таблица
    if(document.querySelector('.dpo-table')) {
      const dpoMap = {
        'хореографии': 'dpo_choreo',
        'аптеки': 'dpo_pharmacy',
        'Косметик': 'dpo_cosmet',
        'косметологии': 'dpo_nursing_cosmet',
        'Нутрициологи': 'dpo_nutri',
        'косметологии» (2': 'dpo_nursing_cosmet2',
        'диетологии': 'dpo_diet',
        'массаж': 'dpo_massage',
        'психиатри': 'dpo_psych',
        'Санитар': 'dpo_sanitar',
        'регистрат': 'dpo_registrar',
        'уходу': 'dpo_junior',
      };

      document.querySelectorAll('.dpo-table tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if(cells.length < 4) return;
        const nameCell = cells[0].textContent;
        const priceCell = cells[3];

        Object.entries(dpoMap).forEach(([match, key]) => {
          if(nameCell.includes(match) && saved[key]) {
            priceCell.textContent = formatNum(saved[key]);
          }
        });
      });
    }
  }

  // Запускаем после загрузки DOM
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPrices);
  } else {
    applyPrices();
  }

  // Слушаем изменения localStorage (если другая вкладка обновила)
  window.addEventListener('storage', e => {
    if(e.key === STORAGE_KEY) applyPrices();
  });
})();
