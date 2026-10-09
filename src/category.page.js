/* Category page. One template for every category, chosen by the URL hash. */
(function () {
  'use strict';
  var BD = window.BoxDrop, CAT = window.BD_CATEGORIES, ALL = window.BD_CATALOG;
  var $ = function (s) { return document.querySelector(s); };

  var VALID = Object.keys(CAT);
  var state = { cat: 'mattresses', sort: 'featured', stock: false, f: {} };

  var FIRMNESS_BANDS = [
    { name: 'Plush',  test: function (p) { return p.firmness <= 4; } },
    { name: 'Medium', test: function (p) { return p.firmness >= 5 && p.firmness <= 6; } },
    { name: 'Firm',   test: function (p) { return p.firmness >= 7; } }
  ];

  function readHash() {
    var h = (location.hash || '').replace('#', '').toLowerCase();
    state.cat = VALID.indexOf(h) > -1 ? h : 'mattresses';
  }

  function inCat() {
    return ALL.filter(function (p) { return p.cat === state.cat; });
  }

  /* ---------- filter definitions, derived from what is actually in stock ---------- */
  function uniq(list, fn) {
    var seen = [], out = [];
    list.forEach(function (p) {
      var v = fn(p);
      if (v && seen.indexOf(v) === -1) { seen.push(v); out.push(v); }
    });
    return out.sort();
  }

  function groups() {
    var items = inCat(), g = [];
    var brands = uniq(items, function (p) { return p.brand; });
    var types  = uniq(items, function (p) { return p.type; });
    var sizes  = [];
    items.forEach(function (p) {
      (p.options ? p.options.values : []).forEach(function (v) {
        if (sizes.indexOf(v.name) === -1) sizes.push(v.name);
      });
    });
    var label = CAT[state.cat].optionLabel || 'Size';

    if (sizes.length > 1) g.push({ key: 'size', label: label, values: sizes });
    if (items.some(function (p) { return typeof p.firmness === 'number'; })) {
      g.push({ key: 'firm', label: 'Firmness', values: FIRMNESS_BANDS.map(function (b) { return b.name; }), local: true });
    }
    if (types.length > 1)  g.push({ key: 'type',  label: 'Type',  values: types });
    if (brands.length > 1) g.push({ key: 'brand', label: 'Brand', values: brands });
    g.push({ key: 'price', label: 'Price', values: ['Under $800', '$800 to $1,500', '$1,500 to $2,500', 'Over $2,500'] });
    return g;
  }

  function priceOK(p, band) {
    if (band === 'Under $800') return p.price < 800;
    if (band === '$800 to $1,500') return p.price >= 800 && p.price < 1500;
    if (band === '$1,500 to $2,500') return p.price >= 1500 && p.price < 2500;
    return p.price >= 2500;
  }

  function matches(p) {
    var f = state.f;
    if (f.size && f.size.length && !(p.options || { values: [] }).values.some(function (v) { return f.size.indexOf(v.name) > -1; })) return false;
    if (f.firm && f.firm.length) {
      var hit = FIRMNESS_BANDS.some(function (b) { return f.firm.indexOf(b.name) > -1 && typeof p.firmness === 'number' && b.test(p); });
      if (!hit) return false;
    }
    if (f.type  && f.type.length  && f.type.indexOf(p.type) === -1) return false;
    if (f.brand && f.brand.length && f.brand.indexOf(p.brand) === -1) return false;
    if (f.price && f.price.length && !f.price.some(function (b) { return priceOK(p, b); })) return false;
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

  /* ---------- render ---------- */
  function renderFilters() {
    $('#filter-groups').innerHTML = groups().map(function (g) {
      return '<fieldset class="fgroup"><legend>' + BD.esc(g.label) + '</legend><div class="fchips">' +
        g.values.map(function (v) {
          var on = (state.f[g.key] || []).indexOf(v) > -1;
          return '<label class="fchip' + (g.local ? ' fchip--local' : '') + '">' +
            '<input type="checkbox" data-fkey="' + g.key + '" value="' + BD.esc(v) + '"' + (on ? ' checked' : '') + '>' +
            '<span>' + BD.esc(v) + '</span></label>';
        }).join('') + '</div></fieldset>';
    }).join('');
  }

  function renderApplied() {
    var out = [];
    Object.keys(state.f).forEach(function (k) {
      (state.f[k] || []).forEach(function (v) {
        out.push('<button type="button" class="pill" data-drop="' + k + '|' + BD.esc(v) + '">' +
          BD.esc(v) + '<svg aria-hidden="true"><use href="#i-close"></use></svg>' +
          '<span class="vis-hidden">Remove this filter</span></button>');
      });
    });
    if (state.stock) out.push('<button type="button" class="pill" data-drop="stock|1">At my dealer' +
      '<svg aria-hidden="true"><use href="#i-close"></use></svg><span class="vis-hidden">Remove this filter</span></button>');
    $('#applied').innerHTML = out.join('');
  }

  function renderGrid() {
    var list = sorted(inCat().filter(matches));
    $('#grid').innerHTML = list.map(BD.cardHTML).join('');
    $('#count').textContent = list.length;
    $('#count-word').textContent = list.length === 1 ? 'product' : 'products';
    $('#empty').hidden = list.length > 0;
    $('#grid').hidden = list.length === 0;
    BD.paintLedgers();
  }

  function renderHead() {
    var c = CAT[state.cat];
    document.title = c.title + ' · BoxDrop';
    $('#cat-title').textContent = c.title;
    $('#crumb-cat').textContent = c.title;
    $('#cat-lede').textContent = c.lede;
    $('#cat-eyebrow').textContent = state.cat === 'outlet' ? 'One of each, sold once' : 'Shop the floor';

    var dealerOnly = !!c.dealerOnly;
    $('#dealer-only').hidden = !dealerOnly;
    $('#shop').hidden = dealerOnly;

    document.querySelectorAll('.nav__list a, .drawer__list a').forEach(function (a) {
      var on = a.getAttribute('href') === 'category.html#' + state.cat;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
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
    syncStockSwitch();
    renderFilters();
    renderApplied();
    renderGrid();
  }

  /* ---------- events ---------- */
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'sort')    { state.sort = t.value; renderGrid(); return; }
    if (t.id === 'f-stock') { state.stock = t.checked; renderApplied(); renderGrid(); return; }
    if (t.dataset && t.dataset.fkey) {
      var k = t.dataset.fkey;
      state.f[k] = state.f[k] || [];
      var i = state.f[k].indexOf(t.value);
      if (t.checked && i === -1) state.f[k].push(t.value);
      if (!t.checked && i > -1) state.f[k].splice(i, 1);
      renderApplied(); renderGrid();
    }
  });

  document.addEventListener('click', function (e) {
    var pill = e.target.closest && e.target.closest('[data-drop]');
    if (pill) {
      var parts = pill.getAttribute('data-drop').split('|');
      if (parts[0] === 'stock') { state.stock = false; $('#f-stock').checked = false; }
      else {
        var arr = state.f[parts[0]] || [];
        var j = arr.indexOf(parts[1]);
        if (j > -1) arr.splice(j, 1);
      }
      renderFilters(); renderApplied(); renderGrid();
      return;
    }
    if (e.target.id === 'clear-all' || e.target.id === 'clear-empty') {
      state.f = {}; state.stock = false;
      var sw = document.getElementById('f-stock'); if (sw) sw.checked = false;
      renderFilters(); renderApplied(); renderGrid();
      return;
    }
    if (e.target.id === 'filter-open') {
      var fs = document.getElementById('filters');
      var open = fs.classList.toggle('is-open');
      e.target.setAttribute('aria-expanded', String(open));
      e.target.textContent = open ? 'Hide filters' : 'Filters';
    }
  });

  window.addEventListener('hashchange', function () {
    readHash(); state.f = {}; renderAll();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
  document.addEventListener('bd:dealerchange', function () { syncStockSwitch(); renderGrid(); });

  readHash();
  renderAll();
})();
