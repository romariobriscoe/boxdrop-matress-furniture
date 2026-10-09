/* Category page. One template for every category, chosen by the URL hash.
   Filters live in a slide over and apply as you tick them, so the grid keeps
   the full width of the page. */
(function () {
  'use strict';
  var BD = window.BoxDrop, CAT = window.BD_CATEGORIES, ALL = window.BD_CATALOG;
  var $ = function (s) { return document.querySelector(s); };
  var FREE_OVER = 599;

  var VALID = Object.keys(CAT);
  var state = { cat: 'mattresses', sort: 'featured', stock: false, free: false, f: {}, lo: null, hi: null };

  var FIRMNESS_BANDS = [
    { name: 'Plush',  test: function (p) { return p.firmness <= 4; } },
    { name: 'Medium', test: function (p) { return p.firmness >= 5 && p.firmness <= 6; } },
    { name: 'Firm',   test: function (p) { return p.firmness >= 7; } }
  ];

  function readHash() {
    var h = (location.hash || '').replace('#', '').toLowerCase();
    state.cat = VALID.indexOf(h) > -1 ? h : 'mattresses';
  }
  function inCat() { return ALL.filter(function (p) { return p.cat === state.cat; }); }

  function bounds() {
    var items = inCat();
    if (!items.length) return { min: 0, max: 1000 };
    var lo = Math.min.apply(null, items.map(function (p) { return p.price; }));
    var hi = Math.max.apply(null, items.map(function (p) { return p.price; }));
    return { min: Math.floor(lo / 100) * 100, max: Math.ceil(hi / 100) * 100 };
  }

  function uniq(list, fn) {
    var seen = [], out = [];
    list.forEach(function (p) { var v = fn(p); if (v && seen.indexOf(v) === -1) { seen.push(v); out.push(v); } });
    return out.sort();
  }

  /* One filter group per option label actually present in the category.
     Pooling them under the category's own label put bed sizes inside a
     Finish filter, and leather colours inside a Fabric one. */
  function optionGroups() {
    var map = {}, order = [];
    inCat().forEach(function (p) {
      var o = p.options; if (!o) return;
      if (!map[o.label]) { map[o.label] = []; order.push(o.label); }
      o.values.forEach(function (v) { if (map[o.label].indexOf(v.name) === -1) map[o.label].push(v.name); });
    });
    return order
      .map(function (l) { return { key: 'opt:' + l, label: l, values: map[l].slice().sort() }; })
      .filter(function (g) { return g.values.length > 1; });
  }

  function groups() {
    var items = inCat(), g = optionGroups();
    if (items.some(function (p) { return typeof p.firmness === 'number'; })) {
      g.push({ key: 'firm', label: 'Firmness', values: FIRMNESS_BANDS.map(function (b) { return b.name; }) });
    }
    var types = uniq(items, function (p) { return p.type; });
    if (types.length > 1) g.push({ key: 'type', label: 'Type', values: types });
    var brands = uniq(items, function (p) { return p.brand; });
    if (brands.length > 1) g.push({ key: 'brand', label: 'Brand', values: brands });
    return g;
  }

  function matches(p) {
    var f = state.f, optFail = false;
    Object.keys(f).forEach(function (k) {
      if (k.indexOf('opt:') !== 0 || !f[k].length) return;
      var label = k.slice(4), o = p.options;
      if (!o || o.label !== label || !o.values.some(function (v) { return f[k].indexOf(v.name) > -1; })) optFail = true;
    });
    if (optFail) return false;
    if (f.firm && f.firm.length) {
      var hit = FIRMNESS_BANDS.some(function (b) { return f.firm.indexOf(b.name) > -1 && typeof p.firmness === 'number' && b.test(p); });
      if (!hit) return false;
    }
    if (f.type && f.type.length && f.type.indexOf(p.type) === -1) return false;
    if (f.brand && f.brand.length && f.brand.indexOf(p.brand) === -1) return false;
    if (state.lo != null && p.price < state.lo) return false;
    if (state.hi != null && p.price > state.hi) return false;
    if (state.free && p.price < FREE_OVER) return false;
    if (state.stock) {
      var d = BD.currentDealer();
      if (d && (p.stock || []).indexOf(d.id) === -1) return false;
    }
    return true;
  }

  function sorted(list) {
    var s = state.sort, out = list.slice();
    if (s === 'price-asc')  out.sort(function (a, b) { return a.price - b.price; });
    if (s === 'price-desc') out.sort(function (a, b) { return b.price - a.price; });
    if (s === 'rating')     out.sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; });
    if (s === 'firm-asc')   out.sort(function (a, b) { return (a.firmness || 99) - (b.firmness || 99); });
    if (s === 'firm-desc')  out.sort(function (a, b) { return (b.firmness || 0) - (a.firmness || 0); });
    return out;
  }

  function activeCount() {
    var n = 0;
    Object.keys(state.f).forEach(function (k) { n += (state.f[k] || []).length; });
    if (state.stock) n++;
    if (state.free) n++;
    var b = bounds();
    if ((state.lo != null && state.lo > b.min) || (state.hi != null && state.hi < b.max)) n++;
    return n;
  }

  /* ---------- render ---------- */
  function renderFilters() {
    var b = bounds();
    if (state.lo == null) state.lo = b.min;
    if (state.hi == null) state.hi = b.max;

    var html = groups().map(function (g) {
      var picked = (state.f[g.key] || []).length;
      return '<details class="fgroup"' + (picked ? ' open' : '') + '>' +
        '<summary>' + BD.esc(g.label) +
          (picked ? '<span class="picked">' + picked + '</span>' : '') + '</summary>' +
        '<div class="fgroup__body"><div class="fchips">' +
        g.values.map(function (v) {
          var on = (state.f[g.key] || []).indexOf(v) > -1;
          return '<label class="fchip"><input type="checkbox" data-fkey="' + g.key + '" value="' + BD.esc(v) + '"' +
            (on ? ' checked' : '') + '><span>' + BD.esc(v) + '</span></label>';
        }).join('') + '</div></div></details>';
    }).join('');

    html += '<details class="fgroup" open><summary>Price</summary><div class="fgroup__body">' +
      '<div class="range">' +
        '<div class="range__read"><span id="r-lo">' + BD.money(state.lo) + '</span>' +
        '<span id="r-hi">' + BD.money(state.hi) + '</span></div>' +
        '<div class="range__track"><span class="range__fill" id="r-fill"></span>' +
          '<input type="range" id="r-min" min="' + b.min + '" max="' + b.max + '" step="50" value="' + state.lo + '" aria-label="Minimum price">' +
          '<input type="range" id="r-max" min="' + b.min + '" max="' + b.max + '" step="50" value="' + state.hi + '" aria-label="Maximum price">' +
        '</div>' +
      '</div></div></details>';

    $('#filter-groups').innerHTML = html;
    paintRange();
  }

  function paintRange() {
    var b = bounds(), fill = $('#r-fill');
    if (!fill) return;
    var span = Math.max(1, b.max - b.min);
    fill.style.left = ((state.lo - b.min) / span * 100) + '%';
    fill.style.right = ((b.max - state.hi) / span * 100) + '%';
    $('#r-lo').textContent = BD.money(state.lo);
    $('#r-hi').textContent = BD.money(state.hi);
  }

  function renderApplied() {
    var out = [], b = bounds();
    Object.keys(state.f).forEach(function (k) {
      (state.f[k] || []).forEach(function (v) {
        out.push(pill(k + '|' + v, v));
      });
    });
    if (state.stock) out.push(pill('stock|1', 'At my dealer'));
    if (state.free)  out.push(pill('free|1', 'Delivered free'));
    if (state.lo > b.min || state.hi < b.max) out.push(pill('price|1', BD.money(state.lo) + ' to ' + BD.money(state.hi)));
    $('#applied').innerHTML = out.join('');
  }
  function pill(data, label) {
    return '<button type="button" class="pill" data-drop="' + BD.esc(data) + '">' + BD.esc(label) +
      '<svg aria-hidden="true"><use href="#i-close"></use></svg>' +
      '<span class="vis-hidden">Remove this filter</span></button>';
  }

  /* an editorial cell in the grid, the way their lifestyle tiles sit among products */
  function editorialTile() {
    var d = BD.currentDealer();
    return '<a class="gridtile" href="dealers.html">' +
      '<img src="assets/img/s-showroom-1.jpg" alt="" aria-hidden="true" loading="lazy">' +
      '<p class="eyebrow">Every price here has a second one</p>' +
      '<h3>' + (d ? BD.esc(d.name) + ' prices lower' : 'Your dealer prices lower') + '</h3>' +
      '<p>' + (d
        ? 'You are seeing their floor price on every card. They deliver it too.'
        : 'Set your location and every price on this page switches from a range to one dealer’s number.') +
      '</p><span class="go">' + (d ? 'See their store' : 'Find your dealer') +
      '<svg width="14" height="14" aria-hidden="true"><use href="#i-arrow"></use></svg></span></a>';
  }

  function renderGrid() {
    var list = sorted(inCat().filter(matches));
    var cells = list.map(BD.cardHTML);
    if (cells.length >= 6) cells.splice(5, 0, editorialTile());
    $('#grid').innerHTML = cells.join('');
    $('#count').textContent = list.length;
    $('#count-word').textContent = list.length === 1 ? 'product' : 'products';
    $('#done-n').textContent = list.length;
    $('#empty').hidden = list.length > 0;
    $('#grid').hidden = list.length === 0;
    var n = activeCount();
    $('#filter-n').textContent = n;
    $('#filter-n').hidden = n === 0;
    BD.paintLedgers();
  }

  function renderHead() {
    var c = CAT[state.cat];
    document.title = c.title + ' · BoxDrop';
    $('#cat-title').textContent = c.title;
    $('#crumb-cat').textContent = c.title;
    $('#cat-lede').textContent = c.lede;
    var dealerOnly = !!c.dealerOnly;
    $('#dealer-only').hidden = !dealerOnly;
    $('#shop').hidden = dealerOnly;
    document.querySelectorAll('.nav__list a, .drawer__list a').forEach(function (a) {
      if (a.getAttribute('href') === 'category.html#' + state.cat) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function syncStockSwitch() {
    var d = BD.currentDealer();
    $('#f-stock').disabled = !d;
    $('#stock-switch').setAttribute('aria-disabled', String(!d));
    $('#stock-note').textContent = d ? 'Showing what ' + d.name + ' has on the floor' : 'Set your location to use this';
    if (!d) { $('#f-stock').checked = false; state.stock = false; }
  }

  function renderAll() {
    renderHead();
    if (CAT[state.cat].dealerOnly) return;
    syncStockSwitch(); renderFilters(); renderApplied(); renderGrid();
  }

  function clearAll() {
    var b = bounds();
    state.f = {}; state.stock = false; state.free = false; state.lo = b.min; state.hi = b.max;
    $('#f-stock').checked = false; $('#f-free').checked = false;
    renderFilters(); renderApplied(); renderGrid();
  }

  /* ---------- the slide over ---------- */
  var lastFocus = null;
  function openPanel() {
    lastFocus = document.activeElement;
    $('#fscrim').hidden = false; $('#filters').hidden = false;
    requestAnimationFrame(function () {
      $('#fscrim').classList.add('is-open'); $('#filters').classList.add('is-open');
    });
    document.body.style.overflow = 'hidden';
    $('#filter-open').setAttribute('aria-expanded', 'true');
    $('#filter-close').focus();
  }
  function closePanel() {
    $('#fscrim').classList.remove('is-open'); $('#filters').classList.remove('is-open');
    $('#filter-open').setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(function () { $('#fscrim').hidden = true; $('#filters').hidden = true; }, 240);
    if (lastFocus) lastFocus.focus();
  }
  function panelOpen() { return !$('#filters').hidden; }

  /* ---------- events ---------- */
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'sort')    { state.sort = t.value; renderGrid(); return; }
    if (t.id === 'f-stock') { state.stock = t.checked; renderApplied(); renderGrid(); return; }
    if (t.id === 'f-free')  { state.free  = t.checked; renderApplied(); renderGrid(); return; }
    if (t.dataset && t.dataset.fkey) {
      var k = t.dataset.fkey;
      state.f[k] = state.f[k] || [];
      var i = state.f[k].indexOf(t.value);
      if (t.checked && i === -1) state.f[k].push(t.value);
      if (!t.checked && i > -1) state.f[k].splice(i, 1);
      var sum = t.closest('.fgroup') && t.closest('.fgroup').querySelector('.picked');
      renderApplied(); renderGrid();
      if (sum) sum.textContent = state.f[k].length || '';
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id !== 'r-min' && e.target.id !== 'r-max') return;
    var lo = parseInt($('#r-min').value, 10), hi = parseInt($('#r-max').value, 10);
    if (e.target.id === 'r-min' && lo > hi) { lo = hi; $('#r-min').value = lo; }
    if (e.target.id === 'r-max' && hi < lo) { hi = lo; $('#r-max').value = hi; }
    state.lo = lo; state.hi = hi;
    paintRange(); renderApplied(); renderGrid();
  });

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest && t.closest('#filter-open')) { openPanel(); return; }
    if (t.closest && (t.closest('#filter-close') || t.closest('#filter-done') || t.id === 'fscrim')) { closePanel(); return; }
    if (t.id === 'clear-all' || t.id === 'clear-empty') { clearAll(); return; }

    var drop = t.closest && t.closest('[data-drop]');
    if (drop) {
      var parts = drop.getAttribute('data-drop').split('|'), b = bounds();
      if (parts[0] === 'stock') { state.stock = false; $('#f-stock').checked = false; }
      else if (parts[0] === 'free') { state.free = false; $('#f-free').checked = false; }
      else if (parts[0] === 'price') { state.lo = b.min; state.hi = b.max; }
      else {
        var arr = state.f[parts[0]] || [], j = arr.indexOf(parts[1]);
        if (j > -1) arr.splice(j, 1);
      }
      renderFilters(); renderApplied(); renderGrid();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panelOpen()) closePanel();
    if (e.key === 'Tab' && panelOpen()) {
      var f = $('#filters').querySelectorAll('button, input, select, a[href], summary');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  window.addEventListener('hashchange', function () {
    readHash(); state.f = {}; state.lo = null; state.hi = null;
    renderAll(); window.scrollTo({ top: 0, behavior: 'auto' });
  });
  document.addEventListener('bd:dealerchange', function () { syncStockSwitch(); renderGrid(); });

  readHash();
  renderAll();
})();
