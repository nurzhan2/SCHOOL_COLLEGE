// ============================================================
//  EVENTS.JS — выводит события (раздел «События») с сервера.
//  Если API недоступно (статический хостинг) или событий нет —
//  показывает запасной блок со ссылкой на ВКонтакте.
// ============================================================
(function () {
  const grid = document.getElementById('events-grid');
  const fallback = document.getElementById('events-fallback');
  if (!grid) return;

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function card(ev) {
    const photo = ev.photo
      ? `<div class="event-photo" style="background-image:url('${esc(ev.photo)}')">${ev.date ? `<span class="event-date">${esc(ev.date)}</span>` : ''}</div>`
      : '';
    const more = ev.link
      ? `<a href="${esc(ev.link)}" target="_blank" class="event-more">Подробнее →</a>`
      : '';
    return `<article class="event-card">
      ${photo}
      <div class="event-body">
        ${!ev.photo && ev.date ? `<span class="event-date-inline">${esc(ev.date)}</span>` : ''}
        <h4>${esc(ev.title)}</h4>
        ${ev.text ? `<p>${esc(ev.text)}</p>` : ''}
        ${more}
      </div>
    </article>`;
  }

  fetch('/api/events')
    .then(r => { if (!r.ok) throw new Error('no api'); return r.json(); })
    .then(list => {
      if (!Array.isArray(list) || list.length === 0) return; // оставляем запасной блок
      grid.innerHTML = list.map(card).join('');
      grid.hidden = false;
      if (fallback) fallback.style.display = 'none';
    })
    .catch(() => { /* API нет — оставляем запасной блок с ВК */ });
})();
