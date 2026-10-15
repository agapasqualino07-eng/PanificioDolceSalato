/* Dolce&Salato — interazioni (nessuna dipendenza) */
(function () {
  'use strict';

  // ===== DATI DA CONFERMARE CON IL TITOLARE =====
  var WA_NUMBER = '393515571151'; // 351 5571151 (numero del volantino)
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
    ['main', '.header', 'footer', '.bar', '#cartbar'].forEach(function (s) { $$(s).forEach(function (el) { el.inert = open; }); });
    if (open) { $('a, button', drawer).focus(); } else { burger.focus({ preventScroll: true }); }
  }
  burger.addEventListener('click', function () { setDrawer(true); });
  $$('[data-close]', drawer).forEach(function (el) { el.addEventListener('click', function () { setDrawer(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-open')) setDrawer(false); });

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
        if (window.scrollY > window.innerHeight) { tick = false; return; }
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
      if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); showTab(tabs[e.key === 'Home' ? 0 : tabs.length - 1].getAttribute('aria-controls'), true); return; }
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); showTab(tabs[(i + d + tabs.length) % tabs.length].getAttribute('aria-controls'), true); }
    });
  });
  // link "vedi menu" dalle card
  $$('[data-tab]').forEach(function (a) {
    a.addEventListener('click', function () { showTab(a.getAttribute('data-tab')); setTimeout(function () { var t = $('.tabs'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); });
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

  // ===== download volantino: evento analytics-friendly =====
  $$('[data-download]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (window.gtag) gtag('event', 'file_download', { file_name: 'volantino-dolce-e-salato.pdf' });
    });
  });


  // ===== carrello ordine =====
  var KEY = 'ds-cart-v1', LAST = 'ds-last-v1', PROF = 'ds-profile-v1';
  function load(k, d) { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  var cart = load(KEY, {});
  // eventi interni (ultimi 200 in localStorage) + gtag se presente; con ?debug=1 stampa in console
  function track(name, props) {
    var rec = function () { var ev = load('ds-events', []); ev.push({ t: Date.now(), n: name, p: props || {} }); store('ds-events', ev.slice(-200)); };
    if (window.requestIdleCallback) window.requestIdleCallback(rec); else setTimeout(rec, 0);
    if (window.gtag) window.gtag('event', name, props || {});
    if (/[?&]debug=1/.test(location.search) && window.console) console.log('[track]', name, props || {});
  }
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); };
  var euro = function (n) { return '€ ' + n.toFixed(2).replace('.', ','); };
  var pizzaMode = function () { var m = $('.menu-pizze'); return m ? m.getAttribute('data-mode') : 'r'; };
  function qtyFmt(q, unit) { return unit === 'kg' ? (q + '').replace('.', ',') + ' kg' : q + ''; }
  function describe(el) {
    var id = el.dataset.id, name = el.dataset.name, price, unit = el.dataset.unit || 'pz', from = el.dataset.from === '1', tbd = el.dataset.tbd === '1';
    if (el.dataset.r) { var t = pizzaMode() === 't'; id += ':' + (t ? 't' : 'r'); name += t ? ' (teglia)' : ' (rotonda)'; price = parseFloat(el.dataset[t ? 't' : 'r']); }
    else price = parseFloat(el.dataset.price);
    return { id: id, name: name, price: tbd ? 0 : price, unit: unit, from: from, tbd: tbd, step: unit === 'kg' ? 0.5 : 1 };
  }
  function setQty(d, q) {
    q = Math.max(0, d.unit === 'kg' ? Math.round(q * 10) / 10 : Math.round(q));
    var before = cart[d.id] ? cart[d.id].qty : 0;
    if (q <= 0) delete cart[d.id]; else cart[d.id] = { name: d.name, price: d.price, unit: d.unit, from: d.from, tbd: !!d.tbd, step: d.step, qty: q };
    if (q > before) { track('add_to_cart', { item: d.name }); bump(); }
    store(KEY, cart); refresh(d.id);
  }
  function totals() { var n = 0, tot = 0, tbd = 0; Object.keys(cart).forEach(function (k) { n += 1; if (cart[k].tbd) tbd += 1; else tot += cart[k].qty * cart[k].price; }); return { n: n, tot: tot, tbd: tbd }; }
  function totTxt(t) { return euro(t.tot) + (t.tbd ? ' + da concordare' : ''); }
  function bump() { var c = $('#cart-count'); if (!c) return; c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  // dopo un re-render riporta il focus sul bottone che l'utente stava usando
  function keepFocus(fn) {
    var a = document.activeElement, row = a && a.closest && a.closest('[data-id],[data-k]');
    var key = row && (row.dataset.k || describe(row).id), dir = a && a.dataset ? a.dataset.d : null, isAdd = a && a.classList && a.classList.contains('add'), isIn = a && a.classList && a.classList.contains('qty-in');
    fn();
    if (!key) return;
    var n = null; $$('[data-id],[data-k]').forEach(function (r) { if (!n && (r.dataset.k || describe(r).id) === key && r.offsetParent !== null) n = r; });
    if (!n) return;
    var t = (dir && n.querySelector('button[data-d="' + dir + '"]')) || n.querySelector('button.add, .step button');
    if (isAdd && !dir) t = n.querySelector('.step button[data-d="1"]') || t;
    if (isIn) t = n.querySelector('.qty-in') || t;
    if (t) t.focus({ preventScroll: true });
  }
  function qtyCtl(name, q, unit) {
    var mid = unit === 'kg'
      ? '<label class="qty"><input class="qty-in" type="text" inputmode="decimal" value="' + (q + '').replace('.', ',') + '" aria-label="Chili di ' + name + '"><span>kg</span></label>'
      : '<output>' + q + '</output>';
    return '<span class="step" role="group" aria-label="Quantità ' + name + '"><button type="button" data-d="-1" aria-label="Meno ' + name + '">−</button>' + mid + '<button type="button" data-d="1" aria-label="Più ' + name + '">+</button></span>';
  }
  function parseQty(v) { var n = parseFloat((v + '').replace(',', '.')); return isNaN(n) ? null : n; }
  function buyHTML(d, q) {
    if (!q) return '<button type="button" class="add" aria-label="Aggiungi ' + d.name + '">+ Aggiungi</button>';
    return qtyCtl(d.name, q, d.unit);
  }
  var rows = $$('[data-id]');
  rows.forEach(function (el) {
    el.classList.add('has-step'); if (el.tagName === 'LI' && !el.classList.contains('item')) el.classList.add('line');
    var box = document.createElement('div'); box.className = 'buy'; el.appendChild(box);
    box.addEventListener('change', function (ev) {
      var i = ev.target.closest('.qty-in'); if (!i) return;
      var q = parseQty(i.value); if (q === null) { refresh(); return; }
      setQty(describe(el), q);
    });
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var d = describe(el), cur = cart[d.id] ? cart[d.id].qty : 0;
      setQty(d, b.classList.contains('add') ? d.step : cur + (+b.dataset.d) * d.step);
    });
  });
  var dlg = $('#order-dialog');
  function refresh(only) {
    keepFocus(function () {
      rows.forEach(function (el) { var d = describe(el); if (only && d.id !== only) return; var q = cart[d.id] ? cart[d.id].qty : 0, box = el.querySelector('.buy'); box.innerHTML = buyHTML(d, q); box.classList.toggle('on', q > 0); });
      var t = totals(), bar = $('#cartbar');
      if (bar) {
        bar.hidden = t.n === 0;
        $('#cart-count').textContent = t.n; $('#cart-total').textContent = 'Stima ' + totTxt(t);
        $('#cart-open').setAttribute('aria-label', 'Il tuo ordine: ' + t.n + (t.n === 1 ? ' prodotto' : ' prodotti') + ', stima ' + totTxt(t) + '. Rivedi e invia');
        var live = $('#cart-live'); if (live) live.textContent = t.n ? t.n + (t.n === 1 ? ' prodotto' : ' prodotti') + ' nell\'ordine, stima ' + totTxt(t) : 'Ordine vuoto';
      }
      document.body.classList.toggle('has-cart', t.n > 0);
      if (dlg && dlg.open) renderDialog();
      renderReorder();
    });
  }
  // suggerimenti "aggiungi anche": prezzi reali del listino, nessuno sconto
  var CAT = {
    pizzette: { id: 'tc-pizzette', name: 'Pizzette', price: 0.8, unit: 'pz', from: false, step: 1, qty: 2, label: '2 pizzette' },
    mignon: { id: 'ps-pasticceria-mignon-di-nostra-produzione', name: 'Pasticceria mignon di nostra produzione', price: 14, unit: 'kg', from: false, step: 0.5, qty: 0.5, label: 'mezzo kg di pasticceria mignon' },
    margherita: { id: 'pz-margherita:r', name: 'Margherita (rotonda)', price: 5, unit: 'pz', from: false, step: 1, qty: 1, label: 'una margherita rotonda, lattina inclusa' }
  };
  function suggestions() {
    var k = Object.keys(cart), has = function (re) { return k.some(function (x) { return re.test(x); }); }, out = [];
    if (has(/^pz-/) && !cart[CAT.pizzette.id]) out.push('pizzette');
    if (has(/^(pz|tc|rk|cz|pala)/) && !has(/^ps-/)) out.push('mignon');
    if (!has(/^pz-/)) out.push('margherita');
    return out.slice(0, 2);
  }
  function drinkNote(k) { return /^pz-.*:r$/.test(k) ? 'Con la rotonda: lattina da 15 cl inclusa' : /^pz-.*:t$/.test(k) ? 'Con la teglia: bibita Tomarchio in bottiglia inclusa' : ''; }
  function renderDialog() {
    var ul = $('#od-lines'), keys = Object.keys(cart);
    if (!keys.length) { dlg.close(); return; }
    ul.innerHTML = keys.map(function (k) {
      var c = cart[k], from = c.from ? 'da ' : '', note = drinkNote(k);
      return '<li data-k="' + esc(k) + '"><span class="nm">' + esc(c.name) + (note ? '<small>' + note + '</small>' : '') + '</span><span class="pr">' + (c.tbd ? 'da concordare' : from + euro(c.qty * c.price)) + '</span>' + qtyCtl(esc(c.name), c.qty, c.unit) + '</li>';
    }).join('');
    $('#od-total').textContent = totTxt(totals());
    var iw = $('#impasto-wrap'); if (iw) iw.hidden = !keys.some(function (k) { return /^pz-/.test(k); });
    var sg = suggestions(), box = $('#od-sugg');
    box.hidden = !sg.length;
    box.innerHTML = sg.length ? '<p>Aggiungi anche</p>' + sg.map(function (s) { var c = CAT[s]; return '<button type="button" class="sugg" data-s="' + s + '">+ ' + c.label + ' · ' + euro(c.qty * c.price) + '</button>'; }).join('') : '';
  }
  function openDialog() {
    if (!dlg || !Object.keys(cart).length) return;
    var p = load(PROF, {}); var n = $('#order-form input[name=nome]'); if (n && !n.value && p.nome) n.value = p.nome;
    renderDialog(); if (!dlg.open) { dlg.showModal(); var h = $('#od-title'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } } track('cart_open', { items: totals().n });
  }
  function renderReorder() {
    var box = $('#reorder'); if (!box) return;
    var last = load(LAST, null), empty = !Object.keys(cart).length;
    if (!last || !empty) { box.hidden = true; return; }
    var n = Object.keys(last).length; box.hidden = false;
    box.innerHTML = '<button type="button" class="btn btn--line" id="reorder-btn">Rifai l\'ultimo ordine (' + n + (n === 1 ? ' prodotto' : ' prodotti') + ')</button>';
  }
  function reorder() {
    var last = load(LAST, {}), added = 0;
    Object.keys(last).forEach(function (k) {
      var base = k.split(':')[0], el = $('[data-id="' + base + '"]'); if (!el) return;
      var t = /:t$/.test(k), price = el.dataset.r ? parseFloat(el.dataset[t ? 't' : 'r']) : parseFloat(el.dataset.price);
      cart[k] = { name: last[k].name, price: el.dataset.tbd === '1' ? 0 : price, unit: last[k].unit, from: el.dataset.from === '1', tbd: el.dataset.tbd === '1', step: last[k].step, qty: last[k].qty }; added++;
    });
    if (added) { track('reorder', { items: added }); store(KEY, cart); refresh(); openDialog(); }
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('#reorder-btn'); if (b) { reorder(); return; }
    if (ev.target.closest('.toggle button')) setTimeout(refresh, 0);
  });
  if (dlg) {
    $('#cart-open').addEventListener('click', openDialog);
    $('#od-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (ev) { if (ev.target === dlg) dlg.close(); });
    $('#od-clear').addEventListener('click', function () { cart = {}; store(KEY, cart); refresh(); if (dlg.open) dlg.close(); });
    $('#od-lines').addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var k = b.closest('li').dataset.k, c = cart[k]; if (!c) return;
      var q = Math.round((c.qty + (+b.dataset.d) * c.step) * 10) / 10;
      if (q <= 0) delete cart[k]; else c.qty = q;
      store(KEY, cart); refresh();
    });
    $('#od-lines').addEventListener('change', function (ev) {
      var i = ev.target.closest('.qty-in'); if (!i) return;
      var k = i.closest('li').dataset.k, c = cart[k], q = parseQty(i.value); if (!c) return;
      if (q === null) { refresh(); return; }
      q = Math.round(q * 10) / 10; if (q <= 0) delete cart[k]; else c.qty = q;
      store(KEY, cart); refresh();
    });
    $('#od-sugg').addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-s]'); if (!b) return;
      var c = CAT[b.dataset.s]; track('suggest_click', { item: c.name });
      setQty({ id: c.id, name: c.name, price: c.price, unit: c.unit, from: c.from, step: c.step }, (cart[c.id] ? cart[c.id].qty : 0) + c.qty);
    });
    $$('.chipq', dlg).forEach(function (c) { c.addEventListener('click', function () { $('#order-form input[name=quando]').value = c.textContent; }); });
    $('#order-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = new FormData(ev.target), keys = Object.keys(cart);
      var lines = keys.map(function (k) { var c = cart[k]; return '• ' + qtyFmt(c.qty, c.unit) + (c.unit === 'kg' ? ' di ' : ' × ') + c.name + ' (' + (c.tbd ? 'prezzo da concordare' : (c.from ? 'da ' : '') + euro(c.qty * c.price)) + ')'; });
      var msg = 'Ciao Dolce&Salato! Sono ' + d.get('nome') + ', vorrei ordinare:\n' + lines.join('\n') + '\nTotale stimato: ' + totTxt(totals()) +
        (d.get('impasto') ? '\nImpasto speciale per le pizze: ' + d.get('impasto') + ' (da prenotare 24 ore prima)' : '') +
        '\nRitiro: ' + (d.get('quando') || 'da concordare') + (d.get('note') ? '\nNote: ' + d.get('note') : '') + '\nGrazie!';
      store(PROF, { nome: d.get('nome') }); store(LAST, cart); track('wa_submit', { items: keys.length, total: Math.round(totals().tot * 100) / 100 });
      var url = wa(msg), a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
      var s = $('#od-status'); s.innerHTML = 'Si è aperto WhatsApp con il messaggio già scritto. Non è partito? <a href="' + url + '" target="_blank" rel="noopener">Riprova</a> oppure chiama il 351 5571151.';
    });
  }
  // preset dal calcolatore feste
  var calcBtn = $('#calc-cart');
  if (calcBtn) calcBtn.addEventListener('click', function () {
    var r = $('#kg-s').textContent, dd = $('#kg-d').textContent;
    var s = parseFloat(r.replace(',', '.')), d = parseFloat(dd.replace(',', '.'));
    setQty({ id: 'rk-rustici-classici-vari-tipi', name: 'Rustici classici, vari tipi', price: 12, unit: 'kg', from: true, step: 0.5 }, s);
    setQty({ id: 'ps-pasticceria-mignon-di-nostra-produzione', name: 'Pasticceria mignon di nostra produzione', price: 14, unit: 'kg', from: false, step: 0.5 }, d);
    track('preset_apply', { rustici: s, dolci: d }); openDialog();
  });
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
