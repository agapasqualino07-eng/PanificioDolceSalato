/* Dolce&Salato — interazioni (nessuna dipendenza) */
(function () {
  'use strict';

  // ===== DATI DA CONFERMARE CON IL TITOLARE =====
  var WA_NUMBER = '393515571151'; // 351 5571151 (numero del volantino) — verificare che sia attivo su WhatsApp
  // Orari: compilare per attivare il badge "Aperto/Chiuso ora" nell'hero. 0 = domenica … 6 = sabato.
  // Esempio: { 1: [['07:00','13:30'],['16:00','20:30']], 0: [] }
  var HOURS = null;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var wa = function (text) { return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text); };

  // ===== header =====
  var header = $('.header');
  var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 40); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ===== drawer mobile =====
  var drawer = $('#drawer'), burger = $('#burger');
  function setDrawer(open) {
    drawer.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { $('a, button', drawer).focus(); }
  }
  burger.addEventListener('click', function () { setDrawer(true); });
  $$('[data-close]', drawer).forEach(function (el) { el.addEventListener('click', function () { setDrawer(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setDrawer(false); });

  // ===== reveal on scroll =====
  var rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  // ===== nav attiva =====
  var links = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { so.observe(s); });
  }

  // ===== parallax leggero hero =====
  var heroImg = $('.hero__bg img');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroImg && !reduce) {
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        heroImg.style.transform = 'translate3d(0,' + (y * 0.22) + 'px,0) scale(1.08)';
        tick = false;
      });
    }, { passive: true });
  }

  // ===== menu a tab =====
  var tabs = $$('.tab'), panels = $$('.panel');
  function showTab(id, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(function (p) { p.hidden = p.id !== id; });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showTab(t.getAttribute('aria-controls')); t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); showTab(tabs[(i + d + tabs.length) % tabs.length].getAttribute('aria-controls'), true); }
    });
  });
  // link "vedi menu" dalle card
  $$('[data-tab]').forEach(function (a) {
    a.addEventListener('click', function () { showTab(a.getAttribute('data-tab')); });
  });

  // ===== toggle rotonda / teglia =====
  var pizze = $('.menu-pizze');
  $$('.toggle button').forEach(function (b) {
    b.addEventListener('click', function () {
      pizze.setAttribute('data-mode', b.dataset.mode);
      $$('.toggle button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    });
  });

  // ===== calcolatore eventi =====
  var ppl = $('#ppl'), kind = $('#kind');
  var FACTORS = { // kg a persona: [salato, dolce]
    bimbi:    [0.12, 0.12],
    aperitivo:[0.15, 0.06],
    buffet:   [0.22, 0.10],
    laurea:   [0.18, 0.14]
  };
  var PRICE = { salato: [12, 18], dolce: 14 }; // €/kg dal volantino (rustici 12–18, mignon 14)
  var last = '';
  function calc() {
    var n = +ppl.value, f = FACTORS[kind.value];
    var s = Math.max(1, Math.round(n * f[0] * 2) / 2), d = Math.max(1, Math.round(n * f[1] * 2) / 2);
    var lo = s * PRICE.salato[0] + d * PRICE.dolce, hi = s * PRICE.salato[1] + d * PRICE.dolce;
    $('#ppl-out').textContent = n + ' persone';
    $('#kg-s').textContent = s.toString().replace('.', ',') + ' kg';
    $('#kg-d').textContent = d.toString().replace('.', ',') + ' kg';
    $('#est').textContent = '€ ' + Math.round(lo) + ' – ' + Math.round(hi);
    last = 'Ciao Dolce&Salato! Vorrei un preventivo per un evento (' + kind.options[kind.selectedIndex].text + ') per circa ' + n +
      ' persone. Stima: ~' + s + ' kg di rusticheria mignon e ~' + d + ' kg di pasticceria mignon. Data: ';
    $('#calc-wa').href = wa(last);
  }
  if (ppl) { ppl.addEventListener('input', calc); kind.addEventListener('change', calc); calc(); }

  // ===== form ordine -> WhatsApp =====
  var form = $('#order');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var msg = 'Ciao Dolce&Salato! Sono ' + (d.get('nome') || '') + '.\n' +
        'Vorrei ordinare (' + d.get('tipo') + '):\n' + (d.get('cosa') || '') + '\n' +
        'Per il giorno: ' + (d.get('quando') || 'da concordare') + (d.get('ora') ? ' alle ' + d.get('ora') : '') +
        (d.get('note') ? '\nNote: ' + d.get('note') : '') + '\nGrazie!';
      window.open(wa(msg), '_blank', 'noopener');
    });
    var dt = $('#quando'); if (dt) { dt.min = new Date().toISOString().slice(0, 10); }
  }
  $$('.js-wa').forEach(function (a) { if (!a.dataset.msg) return; a.href = wa(a.dataset.msg); });

  // ===== download volantino: evento analytics-friendly =====
  $$('[data-download]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (window.gtag) gtag('event', 'file_download', { file_name: 'volantino-dolce-e-salato.pdf' });
    });
  });

  // ===== aperto / chiuso ora =====
  if (HOURS) {
    var now = new Date(), day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    var toM = function (t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; };
    var open = (HOURS[day] || []).some(function (r) { return mins >= toM(r[0]) && mins < toM(r[1]); });
    var b = $('#open-badge');
    if (b) { b.hidden = false; $('.dot', b).classList.toggle('on', open); $('span:last-child', b).textContent = open ? 'Aperto ora' : 'Chiuso ora'; }
  }

  $('#year').textContent = new Date().getFullYear();
})();
