/* Dealer locator. A directory of businesses, not a list of pins. */
(function () {
  'use strict';
  var BD = window.BoxDrop;
  var $ = function (s) { return document.querySelector(s); };

  /* Rough map positions for the sample network, drawn as a schematic
     rather than a real projection. Keyed by dealer id. */
  var PLOT = {
    d890: { x: 118, y: 52,  label: 'Parkersburg' },
    d731: { x: 56,  y: 214, label: 'Huntington' },
    d604: { x: 132, y: 204, label: 'Teays Valley' },
    d478: { x: 186, y: 190, label: 'Nitro' },
    d512: { x: 244, y: 196, label: 'Charleston' }
  };

  var state = { radius: 100, listOnly: false };

  function distance(d) {
    var z = parseInt(BD.zip(), 10);
    if (!z || isNaN(z)) return parseInt(d.miles, 10) || 0;
    return Math.max(2, Math.round(Math.abs(d.zip - z) * 0.055));
  }

  function visible() {
    return BD.dealers
      .map(function (d) { var o = Object.create(d); o.dist = distance(d); return o; })
      .filter(function (d) { return d.dist <= state.radius; })
      .sort(function (a, b) { return a.dist - b.dist; });
  }

  function mapSVG(list) {
    var mine = BD.currentDealer();
    var shown = {};
    list.forEach(function (d) { shown[d.id] = d; });
    var out = ['<svg viewBox="0 0 400 290" role="img" aria-label="A schematic map of the sample BoxDrop network along the Kanawha and Ohio valleys, with ' +
      list.length + ' stores marked.">'];
    out.push('<rect width="400" height="290" fill="none"/>');
    // river
    out.push('<path d="M112 18 C 96 90, 70 150, 54 206 C 90 230, 150 222, 196 208 C 250 196, 320 188, 392 170" ' +
             'fill="none" stroke="#C9CEEA" stroke-width="7" stroke-linecap="round" opacity=".85"/>');
    // interstates
    out.push('<path d="M40 222 L 250 198" fill="none" stroke="#DDD6C8" stroke-width="3" stroke-dasharray="1 0"/>');
    out.push('<path d="M244 196 L 118 52" fill="none" stroke="#DDD6C8" stroke-width="3"/>');
    out.push('<text x="92" y="238" font-family="IBM Plex Mono, monospace" font-size="9" fill="#7B8199">I 64</text>');
    out.push('<text x="196" y="120" font-family="IBM Plex Mono, monospace" font-size="9" fill="#7B8199">I 77</text>');
    out.push('<text x="60" y="110" font-family="IBM Plex Mono, monospace" font-size="9" fill="#8E98D4" transform="rotate(-70 60 110)">OHIO RIVER</text>');

    BD.dealers.forEach(function (d) {
      var p = PLOT[d.id]; if (!p) return;
      var on = !!shown[d.id];
      var isMine = mine && mine.id === d.id;
      var fill = isMine ? '#2DB84B' : '#111D6B';
      out.push('<g opacity="' + (on ? 1 : .22) + '">');
      if (isMine) out.push('<circle cx="' + p.x + '" cy="' + p.y + '" r="16" fill="#2DB84B" opacity=".2"/>');
      out.push('<circle cx="' + p.x + '" cy="' + p.y + '" r="7" fill="' + fill + '" stroke="#F4F1EA" stroke-width="2"/>');
      out.push('<text x="' + p.x + '" y="' + (p.y - 14) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" ' +
               'font-size="10" font-weight="' + (isMine ? 600 : 400) + '" fill="#0E1538">' + BD.esc(p.label) + '</text>');
      out.push('</g>');
    });
    out.push('</svg>');
    return out.join('');
  }

  function cardHTML(d) {
    var mine = BD.currentDealer();
    var isMine = mine && mine.id === d.id;
    var open = d.open.indexOf('Closes') === 0;
    return '<article class="dcard' + (isMine ? ' is-mine' : '') + '">' +
      '<div class="dcard__media">' +
        '<span class="dcard__badge">' + BD.esc(d.tier) + '</span>' +
        '<span class="dcard__dist num">' + d.dist + ' mi</span>' +
        '<img src="' + BD.esc(d.img) + '" alt="The ' + BD.esc(d.name) + ' showroom floor." loading="lazy" decoding="async">' +
      '</div>' +
      '<div class="dcard__body">' +
        (isMine ? '<span class="dcard__mine"><svg width="12" height="12" aria-hidden="true"><use href="#i-pin"></use></svg> Your dealer</span>' : '') +
        '<h3>' + BD.esc(d.name) + '</h3>' +
        '<address class="dcard__addr">' + BD.esc(d.addr) + '</address>' +
        '<div class="dcard__rows">' +
          '<span class="' + (open ? 'shut' : 'open') + '">' + BD.esc(d.open) + '</span>' +
          '<span>' + BD.esc(d.hours) + '</span>' +
          '<span>Floor price about ' + Math.round((1 - d.factor) * 100) + '% under this site</span>' +
        '</div>' +
        '<div class="dcard__acts">' +
          '<a class="phone-link" href="tel:' + d.phone.replace(/[^0-9]/g, '') + '">' + BD.esc(d.phone) + '</a>' +
          (isMine
            ? '<span class="btn btn--local btn--sm" aria-disabled="true">Showing their prices</span>'
            : '<button type="button" class="btn btn--solid-local btn--sm" data-pick="' + d.id + '">See this dealer’s pricing</button>') +
        '</div>' +
      '</div></article>';
  }

  function render() {
    var list = visible();
    $('#dlist').innerHTML = list.length
      ? list.map(cardHTML).join('')
      : '<div class="empty"><h3>No dealers inside that radius</h3>' +
        '<p>Widen the distance filter, or call the nearest store. Dealers regularly deliver past their ' +
        'own radius when a run is already going that way.</p></div>';
    $('#map').innerHTML = mapSVG(list);
    $('#loc-count').textContent = list.length;
    var z = BD.zip();
    $('#loc-near').textContent = z ? 'near ' + z : 'in the sample network';
    var input = $('#zip-loc');
    if (z && !input.value) input.value = z;
  }

  document.addEventListener('click', function (e) {
    var pick = e.target.closest && e.target.closest('[data-pick]');
    if (pick) {
      var id = pick.getAttribute('data-pick');
      var d = BD.dealers.filter(function (x) { return x.id === id; })[0];
      if (d) {
        if (!BD.zip()) BD.store.set('bd.zip', String(d.zip));
        BD.setDealer(d);
      }
      return;
    }
    if (e.target.id === 'use-loc') {
      BD.store.set('bd.zip', '25143');
      BD.setDealer(BD.dealers[0]);
      BD.toast('Using Nitro, WV for this prototype. A live site would ask the browser.');
      return;
    }
    if (e.target.id === 'view-list' || e.target.id === 'view-both') {
      state.listOnly = e.target.id === 'view-list';
      $('#view-list').setAttribute('aria-pressed', String(state.listOnly));
      $('#view-both').setAttribute('aria-pressed', String(!state.listOnly));
      $('#mapwrap').hidden = state.listOnly;
      $('#locgrid').style.gridTemplateColumns = state.listOnly ? '1fr' : '';
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.id === 'radius') { state.radius = parseInt(e.target.value, 10); render(); }
  });

  document.addEventListener('bd:dealerchange', render);
  render();
})();
