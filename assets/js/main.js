/* Dolce&Salato — interazioni (nessuna dipendenza) */
(function () {
  'use strict';

  // ===== DATI DA CONFERMARE CON IL TITOLARE =====
  var WA_NUMBER = '393515571151'; // 351 5571151 (numero del volantino) — verificare che sia attivo su WhatsApp
  // Orari (0 = domenica … 6 = sabato) per il badge "Aperto/Chiuso ora" e per evidenziare il giorno di oggi. Più fasce: [['07:00','13:00'],['16:00','20:00']]
  var HOURS = { 0: [['06:30', '13:30']], 1: [['06:30', '21:30']], 2: [['06:30', '21:30']], 3: [['06:30', '21:30']], 4: [['06:30', '21:30']], 5: [['06:30', '21:30']], 6: [['06:30', '21:30']] };

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
  drawer.setAttribute('aria-hidden', 'true');
  function setDrawer(open) {
    drawer.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    drawer.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { $('a, button', drawer).focus(); } else { burger.focus({ preventScroll: true }); }
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
          links.forEach(function (a) { var on = a.getAttribute('href') === '#' + e.target.id; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
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


  // ===== carrello ordine =====
  var KEY = 'ds-cart-v1';
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { cart = {}; }
  var euro = function (n) { return '€ ' + n.toFixed(2).replace('.', ','); };
  var pizzaMode = function () { var m = $('.menu-pizze'); return m ? m.getAttribute('data-mode') : 'r'; };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ } }
  function qtyFmt(q, unit) { return unit === 'kg' ? (q + '').replace('.', ',') + ' kg' : q + ''; }
  function describe(el) { // dati della riga in base al formato scelto
    var id = el.dataset.id, name = el.dataset.name, price, unit = el.dataset.unit || 'pz', from = el.dataset.from === '1';
    if (el.dataset.r) { var t = pizzaMode() === 't'; id += ':' + (t ? 't' : 'r'); name += t ? ' (teglia)' : ' (rotonda)'; price = parseFloat(el.dataset[t ? 't' : 'r']); }
    else price = parseFloat(el.dataset.price);
    return { id: id, name: name, price: price, unit: unit, from: from, step: unit === 'kg' ? 0.5 : 1 };
  }
  function setQty(d, q) {
    q = Math.max(0, Math.round(q * 2) / 2);
    if (q <= 0) delete cart[d.id]; else cart[d.id] = { name: d.name, price: d.price, unit: d.unit, from: d.from, step: d.step, qty: q };
    save(); refresh();
  }
  function totals() {
    var n = 0, tot = 0; Object.keys(cart).forEach(function (k) { n += 1; tot += cart[k].qty * cart[k].price; });
    return { n: n, tot: tot };
  }
  function buyHTML(d, q) {
    if (!q) return '<button type="button" class="add" aria-label="Aggiungi ' + d.name + '">+ Aggiungi</button>';
    return '<span class="step" role="group" aria-label="Quantità ' + d.name + '"><button type="button" data-d="-1" aria-label="Meno">−</button><output>' + qtyFmt(q, d.unit) + '</output><button type="button" data-d="1" aria-label="Più">+</button></span>';
  }
  var rows = $$('[data-id]');
  rows.forEach(function (el) {
    el.classList.add('has-step'); if (el.tagName === 'LI' && !el.classList.contains('item')) el.classList.add('line');
    var box = document.createElement('div'); box.className = 'buy'; el.appendChild(box);
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var d = describe(el), cur = cart[d.id] ? cart[d.id].qty : 0;
      setQty(d, b.classList.contains('add') ? d.step : cur + (+b.dataset.d) * d.step);
    });
  });
  function refresh() {
    rows.forEach(function (el) { var d = describe(el); el.querySelector('.buy').innerHTML = buyHTML(d, cart[d.id] ? cart[d.id].qty : 0); });
    var t = totals(), bar = $('#cartbar');
    if (!bar) return;
    bar.hidden = t.n === 0;
    $('#cart-count').textContent = t.n; $('#cart-total').textContent = 'Stima ' + euro(t.tot);
    document.body.classList.toggle('has-cart', t.n > 0);
    if (dlg && dlg.open) renderDialog();
  }
  var dlg = $('#order-dialog');
  function renderDialog() {
    var ul = $('#od-lines'), keys = Object.keys(cart);
    if (!keys.length) { dlg.close(); return; }
    ul.innerHTML = keys.map(function (k) {
      var c = cart[k], from = c.from ? 'da ' : '';
      return '<li data-k="' + k + '"><span class="nm">' + c.name + '</span><span class="pr">' + from + euro(c.qty * c.price) + '</span><span class="step"><button type="button" data-d="-1" aria-label="Meno ' + c.name + '">−</button><output>' + qtyFmt(c.qty, c.unit) + '</output><button type="button" data-d="1" aria-label="Più ' + c.name + '">+</button></span></li>';
    }).join('');
    $('#od-total').textContent = euro(totals().tot);
  }
  if (dlg) {
    $('#cart-open').addEventListener('click', function () { renderDialog(); if (Object.keys(cart).length) dlg.showModal(); });
    $('#od-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (ev) { if (ev.target === dlg) dlg.close(); });
    $('#od-clear').addEventListener('click', function () { cart = {}; save(); refresh(); if (dlg.open) dlg.close(); });
    $('#od-lines').addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var k = b.closest('li').dataset.k, c = cart[k]; if (!c) return;
      var q = c.qty + (+b.dataset.d) * c.step;
      if (q <= 0) delete cart[k]; else c.qty = q;
      save(); refresh(); renderDialog();
    });
    $('#order-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = new FormData(ev.target), keys = Object.keys(cart);
      var lines = keys.map(function (k) { var c = cart[k]; return '• ' + qtyFmt(c.qty, c.unit) + (c.unit === 'kg' ? ' di ' : ' × ') + c.name + ' (' + (c.from ? 'da ' : '') + euro(c.qty * c.price) + ')'; });
      var msg = 'Ciao Dolce&Salato! Sono ' + d.get('nome') + ', vorrei ordinare:\n' + lines.join('\n') + '\nTotale stimato: ' + euro(totals().tot) +
        '\nRitiro: ' + (d.get('quando') || 'da concordare') + (d.get('note') ? '\nNote: ' + d.get('note') : '') + '\nGrazie!';
      window.open(wa(msg), '_blank', 'noopener');
    });
  }
  document.addEventListener('click', function (ev) { if (ev.target.closest('.toggle button')) setTimeout(refresh, 0); });
  refresh();

  // ===== aperto / chiuso ora =====
  if (HOURS) {
    var now = new Date(), day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    var toM = function (t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; };
    var cur = (HOURS[day] || []).filter(function (r) { return mins >= toM(r[0]) && mins < toM(r[1]); })[0];
    var open = !!cur, label = 'Chiuso ora';
    if (open) { label = 'Aperto ora · fino alle ' + cur[1].replace(/^0/, ''); }
    else {
      for (var i = 0; i < 7 && label === 'Chiuso ora'; i++) {
        var d = (day + i) % 7, slots = HOURS[d] || [];
        for (var k = 0; k < slots.length; k++) {
          if (i > 0 || toM(slots[k][0]) > mins) { label = 'Chiuso · apre ' + (i === 0 ? 'oggi' : i === 1 ? 'domani' : 'tra ' + i + ' giorni') + ' alle ' + slots[k][0].replace(/^0/, ''); break; }
        }
      }
    }
    var tr = $('.hours tr[data-day="' + day + '"]'); if (tr) tr.classList.add('today');
    var b = $('#open-badge');
    if (b) { b.hidden = false; $('.dot', b).classList.toggle('on', open); $('span:last-child', b).textContent = label; }
  }

  $('#year').textContent = new Date().getFullYear();
})();
