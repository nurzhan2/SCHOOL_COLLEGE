// ============================================
// ПЕРВЫЙ ШКОЛЛЕДЖ — интерактивность
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Header shadow on scroll ---------- */
  const header = document.querySelector('header');
  if(header){
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  /* ---------- Mobile menu ---------- */
  const burger = document.querySelector('.nav-burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mclose = document.querySelector('.mclose');
  if(burger && mobileMenu){
    burger.addEventListener('click', () => mobileMenu.classList.add('open'));
    if(mclose) mclose.addEventListener('click', () => mobileMenu.classList.remove('open'));
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));
  }

  /* ---------- Touch support for hover program cards ---------- */
  const isTouchDevice = window.matchMedia('(hover: none)').matches;
  if(isTouchDevice){
    document.querySelectorAll('.prog-hover-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if(!card.classList.contains('touch-open')){
          e.preventDefault();
          document.querySelectorAll('.prog-hover-card.touch-open').forEach(c => { if(c !== card) c.classList.remove('touch-open'); });
          card.classList.add('touch-open');
        }
      });
    });
  }

  /* ---------- Pill tabs ---------- */
  document.querySelectorAll('[data-tabs]').forEach(group => {
    const tabs = group.querySelectorAll('.pill-tab');
    const targetSelector = group.getAttribute('data-tabs');
    const panels = document.querySelectorAll(targetSelector + ' [data-tab-panel]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const key = tab.getAttribute('data-tab');
        panels.forEach(p => { const match = key === 'all' || p.getAttribute('data-tab-panel') === key; p.style.display = match ? '' : 'none'; });
      });
    });
  });

  /* ---------- Accordion ---------- */
  document.querySelectorAll('.accordion-item').forEach(item => {
    const head = item.querySelector('.accordion-head');
    const body = item.querySelector('.accordion-body');
    if(!head || !body) return;
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      const parent = item.closest('[data-accordion-group]');
      if(parent) parent.querySelectorAll('.accordion-item.open').forEach(other => { if(other !== item){ other.classList.remove('open'); other.querySelector('.accordion-body').style.maxHeight = null; } });
      item.classList.toggle('open', !isOpen);
      body.style.maxHeight = !isOpen ? body.scrollHeight + 'px' : null;
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('shown'); io.unobserve(entry.target); } });
    }, {threshold:0.1, rootMargin:'0px 0px -40px 0px'});
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('shown'));
  }

  /* ---------- Flight stepper (5 шагов) ---------- */
  document.querySelectorAll('.flight-stepper').forEach(stepper => {
    const wrap = stepper.querySelector('.flight-track-wrap');
    const svg = stepper.querySelector('.flight-track-svg');
    const pathBg = stepper.querySelector('.flight-path');
    const pathProgress = stepper.querySelector('.flight-path-progress');
    const plane = stepper.querySelector('.flight-plane');
    const points = Array.from(stepper.querySelectorAll('.flight-point'));
    if(!wrap || !svg || points.length === 0) return;

    let pathLength = 0;
    let pointDistances = [];

    const buildPath = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if(w === 0) return;
      const n = points.length;
      const zigzagY = [0.72, 0.22, 0.72, 0.22, 0.72];
      const waypoints = points.map((_, i) => ({ x: (w / n) * (i + 0.5), y: h * zigzagY[i % zigzagY.length] }));
      let d = `M ${waypoints[0].x} ${waypoints[0].y}`;
      for(let i = 1; i < waypoints.length; i++){
        const prev = waypoints[i-1], cur = waypoints[i], midX = (prev.x + cur.x) / 2;
        d += ` C ${midX} ${prev.y}, ${midX} ${cur.y}, ${cur.x} ${cur.y}`;
      }
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      pathBg.setAttribute('d', d);
      pathProgress.setAttribute('d', d);
      pathLength = pathProgress.getTotalLength();
      pathProgress.style.strokeDasharray = `0 ${pathLength}`;
      pointDistances = waypoints.map((_, i) => n > 1 ? i / (n - 1) : 0);
    };

    buildPath();
    requestAnimationFrame(buildPath);
    window.addEventListener('resize', buildPath, {passive:true});

    const setPlaneAt = (progress) => {
      if(!pathLength) return;
      const dist = Math.max(0, Math.min(1, progress)) * pathLength;
      const pt = pathProgress.getPointAtLength(dist);
      plane.style.left = pt.x + 'px';
      plane.style.top = pt.y + 'px';
      pathProgress.style.strokeDasharray = `${dist} ${pathLength}`;
    };

    const activatePoint = (idx) => points.forEach((p, i) => p.classList.toggle('active', i === idx));

    const onScroll = () => {
      const rect = stepper.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh * 0.6;
      const traveled = vh * 0.85 - rect.top;
      let progress = Math.max(0, Math.min(1, traveled / total));
      setPlaneAt(progress);
      let idx = 0;
      for(let i = 0; i < pointDistances.length; i++){ if(progress >= pointDistances[i] - 0.06) idx = i; }
      activatePoint(idx);
    };

    if(wrap.offsetParent !== null){
      window.addEventListener('scroll', onScroll, {passive:true});
      window.addEventListener('resize', onScroll, {passive:true});
      onScroll();
    }

    points.forEach((p, i) => {
      p.addEventListener('click', () => {
        const willOpen = !p.classList.contains('active');
        points.forEach(pt => pt.classList.remove('active'));
        if(willOpen) p.classList.add('active');
        if(wrap.offsetParent !== null && willOpen && pointDistances[i] !== undefined) setPlaneAt(pointDistances[i]);
      });
    });
  });

  /* ---------- Animated counters ---------- */
  document.querySelectorAll('[data-count-to]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count-to'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    let started = false;
    const run = () => {
      if(started) return; started = true;
      const startTime = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - startTime) / 1200, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if(progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if('IntersectionObserver' in window){
      const cio = new IntersectionObserver((entries) => { entries.forEach(e => { if(e.isIntersecting) run(); }); }, {threshold:0.6});
      cio.observe(el);
    } else { run(); }
  });

  /* ---------- Consultant FAB ---------- */
  const fab = document.querySelector('.consultant-fab');
  if(fab){
    fab.addEventListener('click', () => {
      const target = document.querySelector('#apply') || document.querySelector('#contacts');
      if(target) target.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }

  /* ---------- Fake form submit ---------- */
  document.querySelectorAll('form[data-fake-submit]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if(!btn) return;
      const original = btn.textContent;
      btn.textContent = 'Заявка отправлена ✓';
      btn.style.background = 'var(--brand-dark)';
      setTimeout(() => { btn.textContent = original; btn.style.background = ''; form.reset(); }, 2400);
    });
  });

  /* ---------- Active nav link ---------- */
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if(href === currentFile) a.classList.add('active');
  });

});
