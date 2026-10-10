/* Dealer locator. A directory of businesses, not a list of pins: a BoxDrop
   dealer sets the price, so every card carries their number, not the site's. */
(function () {
  'use strict';
  var BD = window.BoxDrop;
  var $ = function (s) { return document.querySelector(s); };

  /* The mattress every card is priced against, so the floor prices compare. */
  var REF = 'sap-grandbay';

  var STATES = { WV: 'West Virginia', OH: 'Ohio', KY: 'Kentucky', VA: 'Virginia' };
  var state = { radius: 9999, tier: 'all', listOnly: false, q: '' };

  /* ---------- selection ------------------------------------------------- */

  function origin() {
    var z = BD.zip();
    return z ? BD.zipPoint(z) : null;
  }

  function decorate() {
    var from = origin();
    return BD.dealers.map(function (d) {
      var o = Object.create(d);
      o.dist = from ? BD.milesBetween(from, d) : null;
      o.state_ = BD.openState(d);
      return o;
    });
  }

  function matchesQuery(d) {
    var q = state.q.trim().toLowerCase();
    if (!q) return true;
    if (/^\d{3,5}$/.test(q)) return true;          /* a ZIP sorts, it does not filter */
    return (d.name + ' ' + d.city + ' ' + d.state + ' ' + d.addr).toLowerCase().indexOf(q) > -1;
  }

  function visible() {
    return decorate()
      .filter(matchesQuery)
      .filter(function (d) { return state.tier === 'all' || d.tierKey === state.tier; })
      .filter(function (d) { return d.dist == null || d.dist <= state.radius; })
      .sort(function (a, b) {
        if (a.dist != null && b.dist != null) return a.dist - b.dist;
        return a.state === b.state ? a.city.localeCompare(b.city) : a.state.localeCompare(b.state);
      });
  }

  /* ---------- map ------------------------------------------------------- */

  function projector(list) {
    var W = 400, H = 300, pad = 34;
    var lats = list.map(function (d) { return d.lat; });
    var lngs = list.map(function (d) { return d.lng; });
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
    /* longitude shrinks with latitude, so the shape stays roughly true */
    var k = Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
    var spanX = Math.max(.01, (maxLng - minLng) * k), spanY = Math.max(.01, maxLat - minLat);
    var scale = Math.min((W - pad * 2) / spanX, (H - pad * 2) / spanY);
    var offX = (W - spanX * scale) / 2, offY = (H - spanY * scale) / 2;
    return function (d) {
      return {
        x: offX + (d.lng - minLng) * k * scale,
        y: offY + (maxLat - d.lat) * scale
      };
    };
  }

  function mapSVG(list) {
    var mine = BD.currentDealer();
    var shown = {};
    list.forEach(function (d) { shown[d.id] = 1; });
    var project = projector(BD.dealers);
    var out = ['<svg viewBox="0 0 400 300" role="img" aria-label="A map of ' + BD.dealers.length +
      ' BoxDrop stores across West Virginia, Ohio, Kentucky and Virginia. ' + list.length +
      ' match the current filters.">'];

    /* state labels, placed at the middle of each state's own stores */
    Object.keys(STATES).forEach(function (st) {
      var inSt = BD.dealers.filter(function (d) { return d.state === st; });
      if (!inSt.length) return;
      var pts = inSt.map(project);
      var cx = pts.reduce(function (a, p) { return a + p.x; }, 0) / pts.length;
      var cy = pts.reduce(function (a, p) { return a + p.y; }, 0) / pts.length;
      out.push('<text x="' + cx.toFixed(1) + '" y="' + (cy + 42).toFixed(1) + '" text-anchor="middle" ' +
        'font-family="IBM Plex Mono, monospace" font-size="9" letter-spacing="2" fill="#AEB4CE">' + st + '</text>');
    });

    BD.dealers.forEach(function (d) {
      var p = project(d);
      var on = !!shown[d.id];
      var isMine = mine && mine.id === d.id;
      var fill = isMine ? '#2DB84B' : (on ? '#111D6B' : '#C2C8E4');
      out.push('<g>');
      out.push('<title>' + BD.esc(d.name + ', ' + d.city + ', ' + d.state) + '</title>');
      if (isMine) out.push('<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="14" fill="#2DB84B" opacity=".18"/>');
      out.push('<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (isMine ? 6.5 : on ? 5 : 3.5) +
        '" fill="' + fill + '" stroke="#FFFFFF" stroke-width="1.6"/>');
      if (isMine) {
        out.push('<text x="' + p.x.toFixed(1) + '" y="' + (p.y - 13).toFixed(1) + '" text-anchor="middle" ' +
          'font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="600" fill="#0E1538">' +
          BD.esc(d.city) + '</text>');
      }
      out.push('</g>');
    });
    out.push('</svg>');
    return out.join('');
  }

  /* ---------- cards ----------------------------------------------------- */

  /* How much of the site this particular store actually has on its floor.
     Counted from the stock data, so it differs store to store instead of
     repeating the tier sentence the badge already carries. */
  function linesLine(d) {
    var all = window.BD_CATALOG || [];
    if (!all.length) return '';
    var held = all.filter(function (p) { return (p.stock || []).indexOf(d.id) > -1; }).length;
    if (!held) return 'Orders in from the warehouse, nothing of ours on the floor today.';
    return 'Holds ' + held + ' of the ' + all.length + ' lines on this site.';
  }

  function cardHTML(d) {
    var mine = BD.currentDealer();
    var isMine = mine && mine.id === d.id;
    var ref = BD.bySku(REF);
    var price = ref ? Math.round(ref.price * d.factor) : null;
    var save = ref ? ref.price - price : 0;

    return '<article class="dcard' + (isMine ? ' is-mine' : '') + '" id="dealer-' + BD.esc(d.id) + '">' +
      '<div class="dcard__media">' +
        '<img src="' + BD.esc(d.img) + '" alt="The ' + BD.esc(d.name) + ' showroom floor." loading="lazy" decoding="async">' +
        (d.dist != null ? '<span class="dcard__dist num">' +
          (d.dist < 1 ? 'Your town' : d.dist + ' mi') + '</span>' : '') +
        '<span class="dcard__tier dcard__tier--' + BD.esc(d.tierKey) + '">' + BD.esc(d.tier) + '</span>' +
      '</div>' +
      '<div class="dcard__body">' +
        (isMine ? '<span class="dcard__mine"><svg width="12" height="12" aria-hidden="true"><use href="#i-pin"></use></svg> Your dealer</span>' : '') +
        '<h3>' + BD.esc(d.name) + '</h3>' +
        '<address class="dcard__addr">' + BD.esc(d.addr) + '</address>' +
        '<p class="dcard__open">' +
          '<b class="' + (d.state_.open ? 'open' : 'shut') + '">' + BD.esc(d.state_.text) + '</b>' +
          '<span>' + BD.esc(BD.hoursLine(d)) + '</span>' +
        '</p>' +
        '<p class="dcard__note">' + BD.esc(linesLine(d)) +
          (d.tierKey === 'mattress' || d.tierKey === 'outlet'
            ? ' ' + BD.esc(d.tierNote) : '') + '</p>' +
        (price ? '<div class="dcard__price">' +
          '<span class="lbl">Their price, ' + BD.esc(ref.name) + ' queen</span>' +
          '<span class="amt num">' + BD.money(price) + '</span>' +
          '<span class="save">' + BD.money(save) + ' under this site</span>' +
        '</div>' : '') +
        '<div class="dcard__acts">' +
          '<a class="phone-link" href="tel:' + d.phone.replace(/[^0-9]/g, '') + '">' + BD.esc(d.phone) + '</a>' +
          (isMine
            ? '<span class="btn btn--local btn--sm" aria-disabled="true">Showing their prices</span>'
            : '<button type="button" class="btn btn--solid-local btn--sm" data-pick="' + BD.esc(d.id) + '">See their prices</button>') +
        '</div>' +
      '</div></article>';
  }

  /* Hästens splits its locator into named groups, each with its own count.
     With a ZIP we group by how far away a store is; without one, by state. */
  function groupsFor(list) {
    if (origin()) {
      var near = list.filter(function (d) { return d.dist <= 40; });
      var rest = list.filter(function (d) { return d.dist > 40; });
      var g = [];
      if (near.length) g.push({ key: 'Closest to you', note: 'Inside a comfortable drive', items: near });
      if (rest.length) g.push({ key: 'Further out', note: 'Still deliver to most of the region', items: rest });
      return g;
    }
    return Object.keys(STATES).map(function (st) {
      return { key: STATES[st], note: null, items: list.filter(function (d) { return d.state === st; }) };
    }).filter(function (g) { return g.items.length; });
  }

  function render() {
    var list = visible();
    var groups = groupsFor(list);

    $('#dsections').innerHTML = list.length
      ? groups.map(function (g) {
          return '<section class="dsection">' +
            '<header class="dsection__head">' +
              '<h2>' + BD.esc(g.key) + '</h2>' +
              '<span class="dsection__n">' + g.items.length + ' ' + (g.items.length === 1 ? 'store' : 'stores') + '</span>' +
              (g.note ? '<p>' + BD.esc(g.note) + '</p>' : '') +
            '</header>' +
            '<div class="dlist">' + g.items.map(cardHTML).join('') + '</div>' +
          '</section>';
        }).join('')
      : '<div class="empty"><h3>No stores match that</h3>' +
        '<p>Try a wider distance or clear the search. Dealers regularly deliver past their own ' +
        'radius when a run is already going that way.</p>' +
        '<p style="margin-top:20px"><button type="button" class="btn btn--ghost btn--sm" id="loc-clear">Clear filters</button></p></div>';

    $('#map').innerHTML = mapSVG(list);
    $('#loc-count').textContent = list.length;
    $('#loc-word').textContent = list.length === 1 ? 'store' : 'stores';
    var z = BD.zip();
    $('#loc-near').textContent = z ? 'near ' + z : 'across four states';
    var input = $('#zip-loc');
    if (z && !input.value) input.value = z;
  }

  /* ---------- events ---------------------------------------------------- */

  document.addEventListener('click', function (e) {
    var t = e.target;
    var pick = t.closest && t.closest('[data-pick]');
    if (pick) {
      var id = pick.getAttribute('data-pick');
      var d = BD.dealers.filter(function (x) { return x.id === id; })[0];
      if (d) {
        if (!BD.zip()) BD.store.set('bd.zip', String(d.zip));
        BD.setDealer(d);
      }
      return;
    }
    if (t.closest && t.closest('#use-loc')) {
      BD.store.set('bd.zip', '25143');
      BD.setDealer(BD.nearest('25143'));
      $('#zip-loc').value = '25143';
      BD.toast('Using Nitro, WV for this prototype. A live site would ask the browser.');
      render();
      return;
    }
    if (t.id === 'loc-clear') {
      state.q = ''; state.radius = 9999; state.tier = 'all';
      $('#zip-loc').value = ''; $('#radius').value = '9999'; $('#tier').value = 'all';
      render();
      return;
    }
    if (t.id === 'view-list' || t.id === 'view-both') {
      state.listOnly = t.id === 'view-list';
      $('#view-list').setAttribute('aria-pressed', String(state.listOnly));
      $('#view-both').setAttribute('aria-pressed', String(!state.listOnly));
      $('#mapwrap').hidden = state.listOnly;
      $('#locgrid').style.gridTemplateColumns = state.listOnly ? '1fr' : '';
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.id === 'radius') { state.radius = parseInt(e.target.value, 10); render(); }
    if (e.target.id === 'tier') { state.tier = e.target.value; render(); }
  });

  /* Typing filters by name or town as you go; a ZIP is left to the form so it
     can set the dealer rather than narrow the list. */
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'zip-loc') return;
    state.q = e.target.value;
    render();
  });

  document.addEventListener('bd:dealerchange', function () { state.q = ''; render(); });
  render();
})();
