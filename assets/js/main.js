/* =========================================================
   Dinglun (Dylan) Zhang — Portfolio interactions
   Vanilla JS, zero dependencies.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EMAIL = 'dinglunz@usc.edu';
  const RESUME = 'Dinglun_Zhang_Resume.pdf';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  // Run a callback once an element scrolls into view
  const onVisible = (el, cb, opts = { threshold: 0.25 }) => {
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); } });
    }, opts);
    io.observe(el);
  };

  // Track whether an element is on screen (for pausing animations)
  const watchVisibility = (el, cb) => {
    if (!el) return;
    new IntersectionObserver((entries) => entries.forEach((e) => cb(e.isIntersecting)), { threshold: 0 }).observe(el);
  };

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = EMAIL; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      ta.remove();
    }
    toast('📋 Email copied — talk soon!');
  };

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state + active section ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const navLinks = $$('.nav-links a');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = '#' + e.target.id;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => sectionIO.observe(s));

  /* ---------- Reveal on scroll (with sibling stagger) ---------- */
  const reveals = $$('.reveal');
  const groups = new Map();
  reveals.forEach((el) => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    el.style.setProperty('--d', Math.min(i * 0.07, 0.42) + 's');
    groups.set(p, i + 1);
  });
  if (reduceMotion) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const rio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => rio.observe(el));
  }

  /* ---------- Card spotlight (delegated) ---------- */
  if (canHover) {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest && e.target.closest('.spot');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    }, { passive: true });
  }

  /* ---------- Interactive dot-grid background ---------- */
  (function bgGrid() {
    const c = $('#bg-canvas');
    const ctx = c.getContext('2d');
    const GAP = 32, R = 170;
    let w, h, dpr;
    const target = { x: -9999, y: -9999 };
    const cur = { x: -9999, y: -9999 };
    let raf = null;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const ox = (w % GAP) / 2, oy = (h % GAP) / 2;
      for (let x = ox; x <= w; x += GAP) {
        for (let y = oy; y <= h; y += GAP) {
          const dx = x - cur.x, dy = y - cur.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          let px = x, py = y, a = 0.09, s = 1;
          if (d < R) {
            const f = 1 - d / R;
            const push = f * f * 16;
            px += (dx / (d || 1)) * push;
            py += (dy / (d || 1)) * push;
            a = 0.09 + f * 0.55;
            s = 1 + f * 0.9;
            ctx.fillStyle = `rgba(200,255,62,${a})`;
          } else {
            ctx.fillStyle = `rgba(255,255,255,${a})`;
          }
          ctx.fillRect(px - s / 2, py - s / 2, s, s);
        }
      }
    };

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.16;
      cur.y += (target.y - cur.y) * 0.16;
      draw();
      if (Math.abs(target.x - cur.x) > 0.5 || Math.abs(target.y - cur.y) > 0.5) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    if (canHover && !reduceMotion) {
      window.addEventListener('pointermove', (e) => {
        if (cur.x < -1000) { cur.x = e.clientX; cur.y = e.clientY; }
        target.x = e.clientX; target.y = e.clientY;
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
      document.addEventListener('pointerleave', () => {
        target.x = target.y = -9999; cur.x = cur.y = -9999;
        draw();
      });
    }
  })();

  /* ---------- Role rotator ---------- */
  (function rotator() {
    const el = $('#rotator');
    const roles = ['Frontend Engineer', 'Full-Stack Engineer', 'AI Engineer', 'React Native Developer', 'Game Developer'];
    if (reduceMotion) return;
    let i = 0, j = roles[0].length, deleting = true;
    const step = () => {
      const word = roles[i];
      if (deleting) {
        j--;
        el.textContent = word.slice(0, j);
        if (j <= 0) { deleting = false; i = (i + 1) % roles.length; return setTimeout(step, 260); }
        return setTimeout(step, 34);
      }
      j++;
      el.textContent = roles[i].slice(0, j);
      if (j >= roles[i].length) { deleting = true; return setTimeout(step, 2200); }
      setTimeout(step, 62);
    };
    setTimeout(step, 2600);
  })();

  /* ---------- Hero parallax tilt ---------- */
  (function heroTilt() {
    const hero = $('.hero');
    const scene = $('#scene');
    const layers = $$('.layer', scene);
    if (!canHover || reduceMotion) return;
    let raf = null, nx = 0, ny = 0;
    const apply = () => {
      raf = null;
      scene.style.transform = `rotateY(${nx * 5}deg) rotateX(${-ny * 5}deg)`;
      layers.forEach((l) => {
        const d = +l.dataset.depth || 0;
        l.style.transform = `translate3d(${nx * d * 0.45}px, ${ny * d * 0.45}px, 0)`;
      });
    };
    hero.addEventListener('pointermove', (e) => {
      const r = scene.getBoundingClientRect();
      nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width)));
      ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height)));
      if (!raf) raf = requestAnimationFrame(apply);
    });
    hero.addEventListener('pointerleave', () => { nx = ny = 0; if (!raf) raf = requestAnimationFrame(apply); });
    scene.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
  })();

  /* ---------- Shared i18n strings ---------- */
  const I18N = [
    { code: 'en', title: 'Live market prices', hero: "Trade the world's markets" },
    { code: 'zh', title: '实时市场行情', hero: '交易全球市场' },
    { code: 'ja', title: 'リアルタイム相場', hero: '世界の市場で取引しよう' },
    { code: 'ko', title: '실시간 시세', hero: '전 세계 시장을 거래하세요' },
    { code: 'es', title: 'Precios en vivo', hero: 'Opera en los mercados del mundo' },
    { code: 'pt', title: 'Preços ao vivo', hero: 'Negocie nos mercados globais' },
    { code: 'fr', title: 'Cours en direct', hero: 'Tradez les marchés mondiaux' },
    { code: 'vi', title: 'Giá thị trường trực tiếp', hero: 'Giao dịch thị trường toàn cầu' },
    { code: 'th', title: 'ราคาตลาดสด', hero: 'เทรดตลาดทั่วโลก' },
    { code: 'ar', title: 'أسعار السوق المباشرة', hero: 'تداول في أسواق العالم', rtl: true },
  ];

  /* ---------- Hero: simulated market data ---------- */
  (function marketSim() {
    const table = $('#ticker-table');
    const hero = $('.hero');
    const rows = [
      { sym: 'XAU/USD', p: 2384.2, dec: 2, vol: 0.0006, ico: 'Au', c: '#f5c542' },
      { sym: 'EUR/USD', p: 1.0862, dec: 4, vol: 0.0004, ico: '€', c: '#6b9bff' },
      { sym: 'BTC/USD', p: 67420, dec: 0, vol: 0.0012, ico: '₿', c: '#ff9f2e' },
      { sym: 'NAS100', p: 19842.5, dec: 1, vol: 0.0007, ico: 'N', c: '#c8ff3e' },
    ].map((r) => ({ ...r, open: r.p, hist: Array.from({ length: 24 }, () => r.p) }));

    const fmt = (n, d) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    const pct = (v) => (v > -0.005 ? '+' + Math.abs(v).toFixed(2) : v.toFixed(2)) + '%';

    table.innerHTML = rows.map((r, i) => `
      <div class="tk-row" data-i="${i}">
        <span class="tk-sym"><span class="tk-ico" style="background:${r.c}">${r.ico}</span>${r.sym}</span>
        <span class="tk-price">${fmt(r.p, r.dec)}</span>
        <span class="tk-chg up">+0.00%</span>
        <svg class="tk-spark" viewBox="0 0 60 18" preserveAspectRatio="none"><polyline fill="none" stroke-width="1.4" points=""/></svg>
      </div>`).join('');
    const rowEls = $$('.tk-row', table);

    // seed history
    rows.forEach((r) => {
      for (let k = 0; k < 24; k++) { r.p *= 1 + (Math.random() - 0.5) * r.vol * 2; r.hist[k] = r.p; }
      r.open = r.hist[0];
    });

    const renderRow = (r, i, flash) => {
      const el = rowEls[i];
      const chg = ((r.p - r.open) / r.open) * 100;
      el.children[1].textContent = fmt(r.p, r.dec);
      el.children[2].textContent = pct(chg);
      el.children[2].className = 'tk-chg ' + (chg >= 0 ? 'up' : 'down');
      const min = Math.min(...r.hist), max = Math.max(...r.hist);
      const pts = r.hist.map((v, k) => `${(k / (r.hist.length - 1)) * 60},${16 - ((v - min) / (max - min || 1)) * 14}`).join(' ');
      const pl = el.querySelector('polyline');
      pl.setAttribute('points', pts);
      pl.setAttribute('stroke', chg >= 0 ? 'var(--up)' : 'var(--down)');
      if (flash) {
        el.classList.remove('flash-up', 'flash-down');
        void el.offsetWidth;
        el.classList.add(flash);
        setTimeout(() => el.classList.remove(flash), 450);
      }
    };
    rows.forEach((r, i) => renderRow(r, i));

    // Phone candlestick chart
    const cv = $('#ph-chart');
    const ctx = cv.getContext('2d');
    const priceEl = $('#ph-price');
    const chgEl = $('#ph-chg');
    const gold = rows[0];
    const candles = [];
    let last = gold.p;
    for (let k = 0; k < 26; k++) {
      const o = last;
      const c = o + (Math.random() - 0.48) * 3.2;
      candles.push({ o, c, h: Math.max(o, c) + Math.random() * 1.4, l: Math.min(o, c) - Math.random() * 1.4 });
      last = c;
    }
    gold.p = last;
    let cw = 0, ch = 0, cdpr = 1;
    const sizeChart = () => {
      cdpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = cv.clientWidth; ch = cv.clientHeight;
      cv.width = cw * cdpr; cv.height = ch * cdpr;
      ctx.setTransform(cdpr, 0, 0, cdpr, 0, 0);
    };
    const drawChart = () => {
      if (!cw) sizeChart();
      ctx.clearRect(0, 0, cw, ch);
      const max = Math.max(...candles.map((k) => k.h));
      const min = Math.min(...candles.map((k) => k.l));
      const pad = 6;
      const y = (v) => pad + (1 - (v - min) / (max - min || 1)) * (ch - pad * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let g = 1; g < 4; g++) { const gy = (ch / 4) * g; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke(); }
      const step = cw / candles.length;
      const bw = Math.max(2, step * 0.56);
      candles.forEach((k, idx) => {
        const x = idx * step + step / 2;
        const up = k.c >= k.o;
        ctx.strokeStyle = ctx.fillStyle = up ? '#2fe6a7' : '#ff5c7a';
        ctx.beginPath(); ctx.moveTo(x, y(k.h)); ctx.lineTo(x, y(k.l)); ctx.stroke();
        const top = y(Math.max(k.o, k.c)), bot = y(Math.min(k.o, k.c));
        ctx.fillRect(x - bw / 2, top, bw, Math.max(1, bot - top));
      });
      const lp = candles[candles.length - 1].c;
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(200,255,62,0.7)';
      ctx.beginPath(); ctx.moveTo(0, y(lp)); ctx.lineTo(cw, y(lp)); ctx.stroke();
      ctx.setLineDash([]);
    };
    window.addEventListener('resize', () => { sizeChart(); drawChart(); });

    let tickCount = 0, running = false, timer = null, langTimer = null;
    const tick = () => {
      tickCount++;
      // gold drives the phone chart, mean-reverting around its open
      const k = candles[candles.length - 1];
      const drift = (gold.open - k.c) * 0.004;
      k.c += (Math.random() - 0.5) * 1.3 + drift;
      k.h = Math.max(k.h, k.c); k.l = Math.min(k.l, k.c);
      if (tickCount % 7 === 0) {
        candles.push({ o: k.c, c: k.c, h: k.c, l: k.c });
        candles.shift();
      }
      const prev = gold.p;
      gold.p = k.c;
      gold.hist.push(gold.p); gold.hist.shift();
      renderRow(gold, 0, tickCount % 3 === 0 ? (gold.p >= prev ? 'flash-up' : 'flash-down') : null);
      const chg = ((gold.p - gold.open) / gold.open) * 100;
      priceEl.textContent = fmt(gold.p, 2);
      priceEl.style.color = gold.p >= prev ? 'var(--up)' : 'var(--down)';
      chgEl.textContent = pct(chg);
      chgEl.className = 'ph-chg ' + (chg >= 0 ? 'up' : 'down');
      drawChart();

      // random other instrument
      if (Math.random() < 0.7) {
        const i = 1 + Math.floor(Math.random() * 3);
        const r = rows[i];
        const pp = r.p;
        r.p *= 1 + (Math.random() - 0.5) * r.vol * 2 + (r.open - r.p) / r.open * 0.02;
        r.hist.push(r.p); r.hist.shift();
        renderRow(r, i, r.p >= pp ? 'flash-up' : 'flash-down');
      }
    };

    // Browser title cycles through locales
    const titleEl = $('#bb-title');
    const locEl = $('#url-locale');
    let li = 0;
    const cycleLang = () => {
      li = (li + 1) % I18N.length;
      titleEl.style.opacity = 0;
      setTimeout(() => {
        titleEl.textContent = I18N[li].title;
        titleEl.dir = I18N[li].rtl ? 'rtl' : 'ltr';
        locEl.textContent = I18N[li].code;
        titleEl.style.opacity = 1;
      }, 220);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      timer = setInterval(tick, 520);
      langTimer = setInterval(cycleLang, 2600);
    };
    const stop = () => { running = false; clearInterval(timer); clearInterval(langTimer); };

    sizeChart(); drawChart();
    let heroVisible = true;
    watchVisibility(hero, (v) => { heroVisible = v; v && !document.hidden ? start() : stop(); });
    document.addEventListener('visibilitychange', () => (document.hidden || !heroVisible ? stop() : start()));
  })();

  /* ---------- Stats count-up ---------- */
  $$('.count').forEach((el) => {
    const to = +el.dataset.to;
    const pre = el.dataset.prefix || '';
    const suf = el.dataset.suffix || '';
    const set = (v) => { el.textContent = pre + v + suf; };
    if (reduceMotion) return set(to);
    set(0);
    onVisible(el, () => {
      const t0 = performance.now(), dur = 1500;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        set(Math.round(to * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
  });

  /* ---------- Demo: theme tokens ---------- */
  (function tokens() {
    const wrap = $('.demo-tokens');
    const hex = $('#dt-hex');
    const themes = {
      lime: { t: '#c8ff3e', ink: '#0b0d02' },
      violet: { t: '#8b6cff', ink: '#ffffff' },
      amber: { t: '#ffb547', ink: '#1a1000' },
    };
    $$('.dt-switch button', wrap).forEach((b) => {
      b.addEventListener('click', () => {
        $$('.dt-switch button', wrap).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        const th = themes[b.dataset.theme];
        wrap.style.setProperty('--t', th.t);
        wrap.style.setProperty('--t-ink', th.ink);
        hex.textContent = th.t;
      });
    });
  })();

  /* ---------- Demo: TP/SL slider ---------- */
  (function tpsl() {
    const range = $('#tp-range');
    const val = $('#tp-val');
    const pl = $('#tp-pl');
    const rr = $('#tp-rr');
    const phoneTp = $('.ph-row b.up');
    const ENTRY = 2384.2, SL = 2361.5, OZ = 50; // 0.50 lot × 100 oz
    const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const update = () => {
      const tp = +range.value;
      const profit = (tp - ENTRY) * OZ;
      const risk = (ENTRY - SL) * OZ;
      val.textContent = fmt(tp);
      pl.textContent = '+$' + fmt(profit);
      rr.textContent = '1 : ' + (profit / risk).toFixed(2);
      if (phoneTp) phoneTp.textContent = fmt(tp);
      const pct = ((tp - range.min) / (range.max - range.min)) * 100;
      range.style.setProperty('--p', pct + '%');
    };
    range.addEventListener('input', update);
    update();
  })();

  /* ---------- Demo: Next.js i18n ---------- */
  (function i18nDemo() {
    const text = $('#i18n-text');
    const code = $('#i18n-code');
    const bar = $('#i18n-progress');
    const langs = $('#i18n-langs');
    const card = $('#card-next');
    const DUR = 2200;
    let idx = 0, timer = null, visible = false;

    langs.innerHTML = I18N.map((l, i) => `<button type="button" data-i="${i}" aria-label="Show ${l.code}">${l.code}</button>`).join('');
    const btns = $$('button', langs);

    const show = (i) => {
      idx = i;
      btns.forEach((b, k) => b.classList.toggle('on', k === i));
      text.classList.add('out');
      setTimeout(() => {
        text.textContent = I18N[i].hero;
        text.dir = I18N[i].rtl ? 'rtl' : 'ltr';
        code.textContent = I18N[i].code;
        text.classList.remove('out');
      }, 200);
      if (!reduceMotion) {
        bar.style.transition = 'none';
        bar.style.width = '0';
        void bar.offsetWidth;
        bar.style.transition = `width ${DUR}ms linear`;
        bar.style.width = '100%';
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      if (!visible || reduceMotion) return;
      timer = setTimeout(() => { show((idx + 1) % I18N.length); schedule(); }, DUR);
    };
    btns.forEach((b) => b.addEventListener('click', () => { show(+b.dataset.i); schedule(); }));
    show(0);
    watchVisibility(card, (v) => { visible = v; schedule(); });
  })();

  /* ---------- AI terminal ---------- */
  (function terminal() {
    const body = $('#term-body');
    const term = $('#terminal');
    const replay = $('#term-replay');
    // Each line: [delayBeforeMs, segments[], typed?]
    const S = (cls, t) => [cls, t];
    const script = [
      [200, [S('t-prompt', '~/trading-app ❯ '), S('t-user', 'claude')], true],
      [350, [S('t-dim', '✻ Agent ready · project skills loaded: design-tokens, testing, rn-conventions')]],
      [500, [S('t-prompt', '> '), S('t-user', 'Add TP/SL editing to the position sheet. Reuse our theme tokens and the 2FA guard, and add tests.')], true],
      [500, [S('t-info', '● '), S('', 'Reading codebase… '), S('t-dim', '18 files · positions/, theme/tokens, auth/TwoFactorGuard')]],
      [600, [S('t-info', '● '), S('', 'Plan')]],
      [180, [S('t-dim', '  1. Extend <PositionSheet/> with a TP/SL editor (Reanimated)')]],
      [160, [S('t-dim', '  2. Validate against live quote + min stop distance')]],
      [160, [S('t-dim', '  3. Gate submit behind <TwoFactorGuard/>')]],
      [160, [S('t-dim', '  4. Unit + integration tests')]],
      [500, [S('t-warn', '? '), S('', 'Proceed with this plan? '), S('t-prompt', '❯ '), S('t-user', 'yes — but use our useQuote() hook for prices')], true],
      [500, [S('t-info', '● '), S('', 'Edit  positions/PositionSheet.tsx  '), S('t-add', '+86 '), S('t-del', '−12')]],
      [300, [S('t-info', '● '), S('', 'Edit  positions/useTpSl.ts         '), S('t-add', '+41')]],
      [300, [S('t-info', '● '), S('', 'Write __tests__/tpsl.test.ts        '), S('t-add', '+64')]],
      [450, [S('t-info', '● '), S('', 'Running tests…')]],
      [900, [S('t-ok', '  ✓ 37 passed '), S('t-dim', '· 0 failed · 2.1s')]],
      [400, [S('t-ok', '✔ '), S('', 'Ready for review — 3 files changed.')]],
      [600, [S('t-prompt', '~/trading-app ❯ '), S('t-user', 'git diff')], true],
      [300, [S('t-dim', '# Human in the loop: I review every line before it ships.')]],
    ];

    let runId = 0;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const run = async () => {
      const id = ++runId;
      body.innerHTML = '';
      const cursor = document.createElement('span');
      cursor.className = 't-cursor';
      for (const [delay, segs, typed] of script) {
        if (id !== runId) return;
        body.appendChild(cursor);
        await wait(reduceMotion ? 0 : delay);
        if (id !== runId) return;
        const line = document.createElement('div');
        body.insertBefore(line, cursor);
        for (const [cls, txt] of segs) {
          const span = document.createElement('span');
          if (cls) span.className = cls;
          line.appendChild(span);
          const isUserText = typed && cls === 't-user';
          if (isUserText && !reduceMotion) {
            line.appendChild(cursor);
            for (let c = 0; c < txt.length; c++) {
              if (id !== runId) return;
              span.textContent += txt[c];
              await wait(14 + Math.random() * 22);
            }
          } else {
            span.textContent = txt;
          }
        }
        body.appendChild(cursor);
        body.scrollTop = body.scrollHeight;
      }
    };
    replay.addEventListener('click', run);
    onVisible(term, run, { threshold: 0.35 });
  })();

  /* ---------- Games filter ---------- */
  (function filters() {
    const btns = $$('.filter');
    const cards = $$('.game-card');
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', String(x === b)); });
      const f = b.dataset.filter;
      cards.forEach((c) => c.classList.toggle('hidden', f !== 'all' && c.dataset.cat !== f));
    }));
  })();

  /* ---------- Bug Blaster mini-game ---------- */
  const game = (function bugBlaster() {
    const cv = $('#game');
    const ctx = cv.getContext('2d');
    // Landscape playfield on desktop, portrait on phones so text stays legible
    const compact = cv.parentElement.clientWidth < 560;
    const W = compact ? 400 : 720, H = compact ? 500 : 450;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.aspectRatio = `${W} / ${H}`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const startHint = matchMedia('(hover: none)').matches ? '▶  TAP TO START' : '▶  CLICK OR PRESS ENTER TO START';

    const LABELS = ['undefined', 'NaN', 'null', 'CORS', '404', 'race condition', 'memory leak', 'z-index', 'flaky test',
      'hydration error', 'merge conflict', 'off-by-one', 'stale cache', 'infinite loop', 'timeout', '500', 'layout shift', 'N+1 query'];
    const ACC = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c8ff3e';

    let state = 'idle';
    let player, bullets, bugs, particles, powerups, floaters, score, lives, elapsed, spawnT, fireT, powerT, tripleUntil, shake, flash;
    let best = +store.get('bugblaster-best') || 0;
    const keys = { left: false, right: false };
    let visible = false, raf = null, lastT = 0;
    const stars = Array.from({ length: 80 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.4 + 0.3, v: Math.random() * 20 + 8 }));

    const reset = () => {
      player = { x: W / 2, y: H - 40, tx: W / 2 };
      bullets = []; bugs = []; particles = []; powerups = []; floaters = [];
      score = 0; lives = 3; elapsed = 0; spawnT = 0.4; fireT = 0; powerT = 9; tripleUntil = 0; shake = 0; flash = 0;
    };
    reset();

    ctx.font = '600 12px "JetBrains Mono", monospace';
    const spawnBug = () => {
      const label = LABELS[Math.floor(Math.random() * LABELS.length)];
      ctx.font = '600 12px "JetBrains Mono", monospace';
      const w = ctx.measureText(label).width + 40;
      bugs.push({
        label, w, h: 26,
        x: 10 + Math.random() * (W - w - 20), y: -30,
        vy: 34 + Math.min(elapsed * 1.7, 90) + Math.random() * 26,
        ph: Math.random() * Math.PI * 2, hp: label.length > 10 ? 2 : 1,
      });
    };
    const burst = (x, y, color, n = 14) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 220;
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.4, t: 0, color });
      }
    };
    const floatText = (x, y, text, color) => floaters.push({ x, y, text, color, t: 0 });

    const start = () => {
      reset(); state = 'play';
      cv.focus({ preventScroll: true });
      loop();
    };
    const togglePause = () => {
      if (state === 'play') { state = 'pause'; render(); }
      else if (state === 'pause') { state = 'play'; loop(); }
    };

    const update = (dt) => {
      elapsed += dt;
      // movement
      if (keys.left) player.tx -= 520 * dt;
      if (keys.right) player.tx += 520 * dt;
      player.tx = Math.max(20, Math.min(W - 20, player.tx));
      player.x += (player.tx - player.x) * Math.min(1, dt * 14);

      // fire
      const triple = elapsed < tripleUntil;
      fireT -= dt;
      if (fireT <= 0) {
        fireT = triple ? 0.12 : 0.17;
        const angles = triple ? [-0.2, 0, 0.2] : [0];
        angles.forEach((a) => bullets.push({ x: player.x, y: player.y - 18, vx: Math.sin(a) * 560, vy: -Math.cos(a) * 560 }));
      }

      // spawn
      spawnT -= dt;
      if (spawnT <= 0) { spawnBug(); spawnT = Math.max(0.42, 1.25 - elapsed * 0.02) * (0.7 + Math.random() * 0.6); }
      powerT -= dt;
      if (powerT <= 0) { powerups.push({ x: 40 + Math.random() * (W - 80), y: -20, vy: 70 }); powerT = 13 + Math.random() * 6; }

      bullets.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; });
      bullets = bullets.filter((b) => b.y > -20 && b.x > -20 && b.x < W + 20);

      bugs.forEach((g) => { g.y += g.vy * dt; g.ph += dt * 3; g.x += Math.sin(g.ph) * 18 * dt; });
      powerups.forEach((p) => { p.y += p.vy * dt; });

      // collisions
      for (const b of bullets) {
        for (const g of bugs) {
          if (g.dead) continue;
          if (b.x > g.x && b.x < g.x + g.w && b.y > g.y && b.y < g.y + g.h) {
            b.dead = true; g.hp--;
            if (g.hp <= 0) {
              g.dead = true;
              const pts = 10 + Math.floor(elapsed / 10) * 5;
              score += pts;
              burst(g.x + g.w / 2, g.y + g.h / 2, '#ff5c7a');
              floatText(g.x + g.w / 2, g.y, '+' + pts, '#ffffff');
            } else {
              burst(b.x, b.y, '#ffcf5c', 5);
            }
            break;
          }
        }
        for (const p of powerups) {
          if (!p.dead && Math.hypot(b.x - p.x, b.y - p.y) < 22) { b.dead = true; p.dead = true; grantPower(p); }
        }
      }
      powerups.forEach((p) => { if (!p.dead && Math.hypot(player.x - p.x, player.y - p.y) < 30) { p.dead = true; grantPower(p); } });

      for (const g of bugs) {
        if (!g.dead && g.y + g.h > H - 12) {
          g.dead = true; lives--; shake = 0.35; flash = 0.3;
          burst(g.x + g.w / 2, H - 14, '#ff5c7a', 22);
          floatText(g.x + g.w / 2, H - 40, 'shipped to prod!', '#ff5c7a');
        }
      }
      bullets = bullets.filter((b) => !b.dead);
      bugs = bugs.filter((g) => !g.dead);
      powerups = powerups.filter((p) => !p.dead && p.y < H + 20);

      particles.forEach((p) => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; });
      particles = particles.filter((p) => p.t < p.life);
      floaters.forEach((f) => { f.t += dt; f.y -= 40 * dt; });
      floaters = floaters.filter((f) => f.t < 0.9);
      shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);

      if (lives <= 0) {
        state = 'over';
        if (score > best) { best = score; store.set('bugblaster-best', String(best)); }
      }
    };

    const grantPower = (p) => {
      tripleUntil = elapsed + 6;
      burst(p.x, p.y, ACC(), 20);
      floatText(p.x, p.y, 'AI COPILOT · 3× FIRE', ACC());
    };

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };

    const drawBugIcon = (x, y) => {
      ctx.strokeStyle = '#ff5c7a'; ctx.fillStyle = '#ff5c7a'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(x, y, 4, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      for (const s of [-1, 1]) {
        for (const dy of [-3, 0, 3]) { ctx.beginPath(); ctx.moveTo(x + s * 3, y + dy); ctx.lineTo(x + s * 7, y + dy + (dy > 0 ? 2 : dy < 0 ? -2 : 0)); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(x + s * 1.5, y - 5); ctx.lineTo(x + s * 4, y - 8.5); ctx.stroke();
      }
    };

    const drawShip = (x, y, t) => {
      const acc = ACC();
      // flame
      ctx.fillStyle = `rgba(255,${150 + Math.random() * 80},60,0.9)`;
      ctx.beginPath(); ctx.moveTo(x - 6, y + 12); ctx.lineTo(x, y + 20 + Math.random() * 8); ctx.lineTo(x + 6, y + 12); ctx.fill();
      ctx.save();
      ctx.shadowColor = acc; ctx.shadowBlur = 18;
      ctx.fillStyle = acc;
      ctx.beginPath();
      ctx.moveTo(x, y - 20); ctx.lineTo(x + 8, y - 2); ctx.lineTo(x + 18, y + 10); ctx.lineTo(x + 6, y + 8);
      ctx.lineTo(x, y + 13); ctx.lineTo(x - 6, y + 8); ctx.lineTo(x - 18, y + 10); ctx.lineTo(x - 8, y - 2); ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#0b0d02';
      ctx.beginPath(); ctx.ellipse(x, y - 4, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
      if (t) {
        ctx.strokeStyle = acc; ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 90) * 0.2;
        ctx.beginPath(); ctx.arc(x, y, 28, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      }
    };

    const drawStars = (dt) => {
      stars.forEach((s) => {
        s.y += s.v * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
        ctx.fillStyle = `rgba(255,255,255,${0.25 + s.s * 0.3})`;
        ctx.fillRect(s.x, s.y, s.s, s.s);
      });
    };

    const centerText = (txt, y, size, color, weight = 800, font = 'Inter') => {
      ctx.font = `${weight} ${size}px ${font}, sans-serif`;
      ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, W / 2, y);
    };

    const render = (dt = 0) => {
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, W, H);
      if (shake > 0) ctx.translate((Math.random() - 0.5) * 10 * shake * 3, (Math.random() - 0.5) * 10 * shake * 3);
      drawStars(state === 'play' ? dt : dt * 0.4);

      // "production" line
      ctx.strokeStyle = 'rgba(255,92,122,0.35)'; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(0, H - 12); ctx.lineTo(W, H - 12); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '600 9px "JetBrains Mono", monospace'; ctx.fillStyle = 'rgba(255,92,122,0.55)'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('PRODUCTION', W - 8, H - 16);

      if (state === 'idle') {
        ctx.save(); ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = 30;
        centerText('BUG BLASTER', H / 2 - 50, Math.min(54, W * 0.11), '#ffffff', 800);
        ctx.restore();
        centerText('Stop the bugs before they hit production.', H / 2 + 4, compact ? 13 : 15, '#a1a1ad', 500);
        const blink = Math.floor(performance.now() / 500) % 2;
        if (blink) centerText(startHint, H / 2 + 54, 13, ACC(), 700, '"JetBrains Mono"');
        if (best) centerText('BEST ' + best, H / 2 + 88, 11, '#6c6c78', 600, '"JetBrains Mono"');
        drawShip(W / 2, H - 50, false);
      } else {
        // entities
        bullets.forEach((b) => {
          ctx.fillStyle = ACC();
          ctx.fillRect(b.x - 1.5, b.y - 7, 3, 12);
        });
        bugs.forEach((g) => {
          roundRect(g.x, g.y, g.w, g.h, 8);
          ctx.fillStyle = g.hp > 1 ? 'rgba(255,92,122,0.22)' : 'rgba(255,92,122,0.12)';
          ctx.fill(); ctx.strokeStyle = '#ff5c7a'; ctx.lineWidth = 1; ctx.stroke();
          drawBugIcon(g.x + 14, g.y + g.h / 2);
          ctx.font = '600 12px "JetBrains Mono", monospace'; ctx.fillStyle = '#ffd5dd'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(g.label, g.x + 26, g.y + g.h / 2 + 1);
        });
        powerups.forEach((p) => {
          ctx.save(); ctx.shadowColor = ACC(); ctx.shadowBlur = 16;
          roundRect(p.x - 24, p.y - 12, 48, 24, 12); ctx.fillStyle = ACC(); ctx.fill(); ctx.restore();
          ctx.font = '800 12px Inter, sans-serif'; ctx.fillStyle = '#0b0d02'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('✦ AI', p.x, p.y + 1);
        });
        particles.forEach((p) => {
          ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        });
        ctx.globalAlpha = 1;
        floaters.forEach((f) => {
          ctx.globalAlpha = 1 - f.t / 0.9;
          ctx.font = '700 12px "JetBrains Mono", monospace'; ctx.fillStyle = f.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(f.text, f.x, f.y);
        });
        ctx.globalAlpha = 1;
        drawShip(player.x, player.y, elapsed < tripleUntil);

        // HUD
        ctx.font = '700 14px "JetBrains Mono", monospace'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff'; ctx.fillText('SCORE ' + String(score).padStart(5, '0'), 14, 12);
        ctx.fillStyle = '#6c6c78'; ctx.font = '600 11px "JetBrains Mono", monospace'; ctx.fillText('BEST ' + Math.max(best, score), 14, 32);
        ctx.textAlign = 'right'; ctx.font = '16px sans-serif'; ctx.fillStyle = '#ff5c7a';
        ctx.fillText('♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives)), W - 14, 10);
        if (elapsed < tripleUntil) {
          ctx.font = '700 11px "JetBrains Mono", monospace'; ctx.fillStyle = ACC();
          ctx.fillText('✦ AI 3× ' + (tripleUntil - elapsed).toFixed(1) + 's', W - 14, 34);
        }

        if (flash > 0) { ctx.fillStyle = `rgba(255,92,122,${flash * 0.5})`; ctx.fillRect(0, 0, W, H); }

        if (state === 'pause') {
          ctx.fillStyle = 'rgba(5,5,8,0.7)'; ctx.fillRect(0, 0, W, H);
          centerText('PAUSED', H / 2 - 10, 40, '#ffffff');
          centerText('Click or press P to resume', H / 2 + 30, 13, '#a1a1ad', 500, '"JetBrains Mono"');
        }
        if (state === 'over') {
          ctx.fillStyle = 'rgba(5,5,8,0.78)'; ctx.fillRect(0, 0, W, H);
          ctx.save(); ctx.shadowColor = '#ff5c7a'; ctx.shadowBlur = 24;
          centerText('BUGS REACHED PRODUCTION', H / 2 - 60, Math.min(30, W * 0.058), '#ff5c7a');
          ctx.restore();
          centerText(String(score), H / 2 - 4, 56, '#ffffff');
          centerText(score >= best && score > 0 ? '★ NEW BEST' : 'BEST ' + best, H / 2 + 40, 12, ACC(), 700, '"JetBrains Mono"');
          centerText(compact ? 'Tap to hotfix & retry' : 'Click or press Enter to hotfix & retry', H / 2 + 76, 13, '#a1a1ad', 500, '"JetBrains Mono"');
        }
      }
      ctx.restore();
    };

    const loop = () => {
      if (raf) return;
      lastT = performance.now();
      const frame = (t) => {
        const dt = Math.min(0.033, (t - lastT) / 1000);
        lastT = t;
        if (state === 'play') update(dt);
        render(dt);
        // keep animating while on screen (idle screen blinks) or while playing
        if (visible && (state === 'play' || state === 'idle')) raf = requestAnimationFrame(frame);
        else raf = null;
      };
      raf = requestAnimationFrame(frame);
    };

    const toGame = (e) => {
      const r = cv.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * W;
    };
    cv.addEventListener('pointermove', (e) => { if (state === 'play') player.tx = toGame(e); });
    cv.addEventListener('pointerdown', (e) => {
      if (state === 'idle' || state === 'over') { start(); player.tx = toGame(e); }
      else if (state === 'pause') togglePause();
      else player.tx = toGame(e);
    });
    cv.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') { keys.left = true; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd') { keys.right = true; e.preventDefault(); }
      if ((e.key === 'Enter' || e.key === ' ') && (state === 'idle' || state === 'over')) { e.preventDefault(); start(); }
      else if (e.key === 'p' || e.key === 'P' || e.key === ' ') { e.preventDefault(); togglePause(); }
    });
    cv.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    });
    cv.addEventListener('blur', () => { keys.left = keys.right = false; });

    watchVisibility(cv, (v) => {
      visible = v;
      if (!v && state === 'play') { state = 'pause'; render(); }
      if (v) { render(); loop(); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') { state = 'pause'; render(); } });
    document.fonts && document.fonts.ready.then(() => render());
    render();

    return {
      focus() {
        $('#arcade').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        setTimeout(() => cv.focus({ preventScroll: true }), 600);
      },
    };
  })();

  /* ---------- Modals: TL;DR ---------- */
  let lastFocus = null;
  const openOverlay = (el, focusEl) => {
    lastFocus = document.activeElement;
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    (focusEl || el.querySelector('button, a, input'))?.focus();
  };
  const closeOverlay = (el) => {
    if (el.hidden) return;
    el.hidden = true;
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  };

  const tldr = $('#tldr');
  $$('[data-open-tldr]').forEach((b) => b.addEventListener('click', () => openOverlay(tldr)));
  tldr.addEventListener('click', (e) => { if (e.target === tldr || e.target.closest('[data-close]')) closeOverlay(tldr); });

  /* ---------- Command palette ---------- */
  const palette = $('#palette');
  const pInput = $('#palette-input');
  const pList = $('#palette-list');
  const go = (sel) => $(sel).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  const open = (url) => window.open(url, '_blank', 'noopener');
  const COMMANDS = [
    { g: 'Navigate', ico: '⚛', label: 'Core stack — React, React Native, Next.js, Flutter', k: 'skills frameworks', run: () => go('#stack') },
    { g: 'Navigate', ico: '✦', label: 'AI-native engineering', k: 'agents claude llm langchain gemini', run: () => go('#ai') },
    { g: 'Navigate', ico: '◷', label: 'Experience', k: 'work jobs bcr career', run: () => go('#experience') },
    { g: 'Navigate', ico: '🎮', label: 'Games — built before AI', k: 'unity portfolio game dev', run: () => go('#games') },
    { g: 'Navigate', ico: '◫', label: 'AI & web projects', k: 'github side projects', run: () => go('#projects') },
    { g: 'Navigate', ico: '◉', label: 'About & education', k: 'usc rutgers school degree', run: () => go('#about') },
    { g: 'Navigate', ico: '✉', label: 'Contact', k: 'hire email reach', run: () => go('#contact') },
    { g: 'Actions', ico: '⚡', label: 'Show 30-second summary', k: 'recruiter tldr overview', run: () => openOverlay(tldr) },
    { g: 'Actions', ico: '@', label: 'Copy email address', hint: EMAIL, k: 'mail contact', run: copyEmail },
    { g: 'Actions', ico: '↗', label: 'Email Dylan', k: 'mail hire', run: () => { location.href = 'mailto:' + EMAIL + '?subject=Opportunity%20for%20Dylan'; } },
    { g: 'Actions', ico: '⎙', label: 'Open résumé (PDF)', k: 'cv resume download', run: () => open(RESUME) },
    { g: 'Actions', ico: 'in', label: 'Open LinkedIn', k: 'social profile', run: () => open('https://www.linkedin.com/in/dinglun-zhang') },
    { g: 'Actions', ico: '⌥', label: 'Open GitHub', k: 'code repos source', run: () => open('https://github.com/dinglunz') },
    { g: 'Fun', ico: '▶', label: 'Play Bug Blaster', k: 'game arcade mini', run: () => game.focus() },
    { g: 'Fun', ico: '◐', label: 'Swap accent color (or try the Konami code)', k: 'theme easter egg', run: () => toggleAccent() },
  ];
  let filtered = COMMANDS, sel = 0;

  const renderPalette = () => {
    const q = pInput.value.trim().toLowerCase();
    filtered = COMMANDS.filter((c) => !q || (c.label + ' ' + c.k + ' ' + c.g).toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, filtered.length - 1));
    if (!filtered.length) { pList.innerHTML = `<li class="palette-empty">No results for “${q.replace(/</g, '&lt;')}”</li>`; return; }
    let html = '', lastG = '';
    filtered.forEach((c, i) => {
      if (c.g !== lastG) { html += `<li class="palette-group" role="presentation">${c.g}</li>`; lastG = c.g; }
      html += `<li class="palette-item" role="option" id="pi-${i}" data-i="${i}" aria-selected="${i === sel}">
        <span class="pi-ico">${c.ico}</span><span>${c.label}</span>${c.hint ? `<span class="pi-hint">${c.hint}</span>` : ''}</li>`;
    });
    pList.innerHTML = html;
    pInput.setAttribute('aria-activedescendant', 'pi-' + sel);
  };
  const moveSel = (d) => {
    if (!filtered.length) return;
    sel = (sel + d + filtered.length) % filtered.length;
    $$('.palette-item', pList).forEach((el) => el.setAttribute('aria-selected', String(+el.dataset.i === sel)));
    const cur = $(`#pi-${sel}`);
    cur && cur.scrollIntoView({ block: 'nearest' });
    pInput.setAttribute('aria-activedescendant', 'pi-' + sel);
  };
  const runSel = (i = sel) => {
    const c = filtered[i];
    if (!c) return;
    closeOverlay(palette);
    setTimeout(c.run, 30);
  };
  const openPalette = () => { pInput.value = ''; sel = 0; renderPalette(); openOverlay(palette, pInput); };

  $$('[data-open-palette]').forEach((b) => b.addEventListener('click', openPalette));
  pInput.addEventListener('input', () => { sel = 0; renderPalette(); });
  pInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); runSel(); }
  });
  pList.addEventListener('click', (e) => { const it = e.target.closest('.palette-item'); if (it) runSel(+it.dataset.i); });
  pList.addEventListener('pointermove', (e) => {
    const it = e.target.closest('.palette-item');
    if (it && +it.dataset.i !== sel) { sel = +it.dataset.i; moveSel(0); }
  });
  palette.addEventListener('click', (e) => { if (e.target === palette) closeOverlay(palette); });

  /* ---------- Global keys ---------- */
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.hidden ? openPalette() : closeOverlay(palette);
      return;
    }
    if (e.key === 'Escape') { closeOverlay(palette); closeOverlay(tldr); return; }
    if (e.key === '/' && !typing && palette.hidden && document.activeElement !== $('#game')) { e.preventDefault(); openPalette(); }
    // simple focus trap for open overlays
    if (e.key === 'Tab') {
      const ov = !palette.hidden ? palette : !tldr.hidden ? tldr : null;
      if (!ov) return;
      const f = $$('button, a[href], input', ov).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- Copy email ---------- */
  $('#copy-email').addEventListener('click', copyEmail);

  /* ---------- Easter egg: Konami code ---------- */
  const toggleAccent = () => {
    const on = document.documentElement.classList.toggle('alt-accent');
    toast(on ? '🎮 Cheat code accepted — Game Dev mode on' : 'Back to lime ✦');
  };
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kIdx = 0;
  document.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kIdx = k === KONAMI[kIdx] ? kIdx + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kIdx === KONAMI.length) { kIdx = 0; toggleAccent(); }
  });

  /* ---------- Hello, fellow developer ---------- */
  console.log(
    '%c DZ %c Hey, fellow dev 👋  Like what you see? → ' + EMAIL,
    'background:#c8ff3e;color:#0b0d02;font-weight:800;padding:4px 6px;border-radius:4px',
    'color:#a1a1ad;padding:4px'
  );
  console.log('%cPsst — try ⌘K, or the Konami code ↑↑↓↓←→←→BA', 'color:#6c6c78');
})();
