/* Dealer locator. 252 stores in 44 states, from the BoxDrop Direct network.
   A BoxDrop dealer sets their own price, so every card carries their number
   rather than the site's. */
(function () {
  'use strict';
  var BD = window.BoxDrop;
  var $ = function (s) { return document.querySelector(s); };
  var REF = 'sap-grandbay';          /* one mattress every floor is priced against */

  var state = { q: '', st: 'all', tier: 'all' };

  function all() { return BD.dealers; }

  function counts() {
    var c = {};
    all().forEach(function (d) { c[d.state] = (c[d.state] || 0) + 1; });
    return c;
  }

  /* Store names spell the brand one way now, but shoppers type it both ways,
     so the brand token is collapsed on each side before comparing. */
  function brandFold(s) { return s.toLowerCase().replace(/\bbox\s+drop\b/g, 'boxdrop'); }

  function matches(d) {
    if (state.st !== 'all' && d.state !== state.st) return false;
    if (state.tier !== 'all' && BD.dealerTier(d).key !== state.tier) return false;
    var q = brandFold(state.q.trim());
    if (!q) return true;
    if (/^\d{5}$/.test(q)) return d.zip === q || d.state === BD.stateForZip(q);
    var full = BD.states[d.state] ? BD.states[d.state].name : d.state;
    return brandFold(d.name + ' ' + d.city + ' ' + d.state + ' ' + full + ' ' + d.addr).indexOf(q) > -1;
  }

  function visible() {
    var z = BD.zip();
    return all().filter(matches).sort(function (a, b) {
      if (z) {
        var ga = BD.zipGap(a.zip, z), gb = BD.zipGap(b.zip, z);
        if (ga !== gb) return ga - gb;
      }
      if (a.state !== b.state) return a.state.localeCompare(b.state);
      return a.city.localeCompare(b.city);
    });
  }

  /* ---------- the national map --------------------------------------------
     The sheet carries no store coordinates, so this plots one bubble per
     state at the state's own centre, sized by how many stores are really
     there. It is a count map, and says so. */

  function mapSVG(list) {
    var W = 420, H = 265, pad = 16;
    var S = BD.states, keys = Object.keys(S);
    var lats = keys.map(function (k) { return S[k].lat; });
    var lngs = keys.map(function (k) { return S[k].lng; });
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
    var k0 = Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
    var sx = (W - pad * 2) / ((maxLng - minLng) * k0), sy = (H - pad * 2) / (maxLat - minLat);
    var sc = Math.min(sx, sy);
    var offX = (W - (maxLng - minLng) * k0 * sc) / 2, offY = (H - (maxLat - minLat) * sc) / 2;
    function at(st) {
      return { x: offX + (S[st].lng - minLng) * k0 * sc, y: offY + (maxLat - S[st].lat) * sc };
    }

    var total = counts(), shown = {};
    list.forEach(function (d) { shown[d.state] = (shown[d.state] || 0) + 1; });
    var mine = BD.currentDealer();
    var out = ['<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="A map of the lower 48 ' +
      'with one bubble per state, sized by how many BoxDrop stores it has. ' + all().length +
      ' stores in ' + Object.keys(total).length + ' states.">'];

    Object.keys(total).sort(function (a, b) { return total[b] - total[a]; }).forEach(function (st) {
      var p = at(st), n = shown[st] || 0;
      var r = 4 + Math.sqrt(total[st]) * 2.6;
      var isMine = mine && mine.state === st;
      var live = n > 0;
      out.push('<g class="mapdot' + (live ? '' : ' is-off') + '" data-state="' + st + '" tabindex="0" role="button">');
      out.push('<title>' + BD.esc(S[st].name) + ': ' + total[st] + ' store' + (total[st] === 1 ? '' : 's') + '</title>');
      if (isMine) out.push('<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (r + 7).toFixed(1) + '" fill="#2DB84B" opacity=".18"/>');
      out.push('<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r.toFixed(1) + '" ' +
        'fill="' + (isMine ? '#2DB84B' : live ? '#111D6B' : '#D3D8EC') + '" opacity="' + (live ? .88 : 1) + '"/>');
      if (total[st] >= 7 || isMine) {
        out.push('<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 3.2).toFixed(1) + '" text-anchor="middle" ' +
          'font-family="IBM Plex Mono, monospace" font-size="8.5" font-weight="600" fill="#FFFFFF">' + total[st] + '</text>');
      }
      out.push('</g>');
    });
    out.push('</svg>');
    return out.join('');
  }

  /* ---------- cards -------------------------------------------------------- */

  function cardHTML(d) {
    var mine = BD.currentDealer();
    var isMine = mine && mine.id === d.id;
    var ref = BD.bySku(REF);
    var price = ref ? Math.round(ref.price * d.factor) : null;
    var tier = BD.dealerTier(d);
    var open = BD.openState(d);

    return '<article class="dcard' + (isMine ? ' is-mine' : '') + '" id="store-' + BD.esc(d.id) + '">' +
      '<div class="dcard__media">' +
        '<img src="' + BD.esc(BD.dealerImg(d)) + '" alt="A BoxDrop showroom floor." loading="lazy" decoding="async">' +
        '<span class="dcard__tier dcard__tier--' + tier.key + '">' + BD.esc(tier.label) + '</span>' +
      '</div>' +
      '<div class="dcard__body">' +
        (isMine ? '<span class="dcard__mine"><svg width="12" height="12" aria-hidden="true"><use href="#i-pin"></use></svg> Your dealer</span>' : '') +
        '<h3>' + BD.esc(d.name) + '</h3>' +
        '<address class="dcard__addr">' + BD.esc(d.addr) + '</address>' +
        '<p class="dcard__open">' +
          '<b class="' + (open.open ? 'open' : 'shut') + '">' + BD.esc(open.text) + '</b>' +
          '<span>' + BD.hoursLine(d) + '</span>' +
        '</p>' +
        (price ? '<div class="dcard__price">' +
          '<span class="lbl">Their price, ' + BD.esc(ref.name) + ' queen</span>' +
          '<span class="amt num">' + BD.money(price) + '</span>' +
          '<span class="save">' + BD.money(ref.price - price) + ' under this site</span>' +
        '</div>' : '') +
        '<div class="dcard__acts">' +
          (d.phone
            ? '<a class="phone-link" href="tel:' + d.phone.replace(/[^0-9]/g, '') + '">' + BD.esc(d.phone) + '</a>'
            : '<span class="phone-link" aria-disabled="true">No number listed</span>') +
          (isMine
            ? '<span class="btn btn--local btn--sm" aria-disabled="true">Showing their prices</span>'
            : '<button type="button" class="btn btn--solid-local btn--sm" data-pick="' + BD.esc(d.id) + '">See their prices</button>') +
        '</div>' +
        '<a class="dcard__page" href="dealer.html#' + BD.esc(d.id) + '">About this store</a>' +
      '</div></article>';
  }

  /* Named groups with their own counts, the way the reference locator splits
     its stores from its resellers. Here the natural split is the state. */
  function render() {
    var list = visible();
    var byState = {};
    list.forEach(function (d) { (byState[d.state] = byState[d.state] || []).push(d); });
    var order = Object.keys(byState);
    var z = BD.zip(), home = z ? BD.stateForZip(z) : null;
    order.sort(function (a, b) {
      if (home && a === home) return -1;
      if (home && b === home) return 1;
      return (BD.states[a] ? BD.states[a].name : a).localeCompare(BD.states[b] ? BD.states[b].name : b);
    });

    $('#dsections').innerHTML = list.length
      ? order.map(function (st) {
          var items = byState[st];
          var nm = BD.states[st] ? BD.states[st].name : st;
          return '<section class="dsection" id="state-' + st + '">' +
            '<header class="dsection__head">' +
              '<h2>' + BD.esc(nm) + '</h2>' +
              '<span class="dsection__n">' + items.length + ' ' + (items.length === 1 ? 'store' : 'stores') + '</span>' +
              (home === st ? '<p>Your ZIP puts you here.</p>' : '') +
            '</header>' +
            '<div class="dlist">' + items.map(cardHTML).join('') + '</div>' +
          '</section>';
        }).join('')
      : '<div class="empty"><h3>No stores match that</h3>' +
        '<p>Try a state, a town or a five digit ZIP. BoxDrop has 252 stores but not one in every county yet.</p>' +
        '<p style="margin-top:20px"><button type="button" class="btn btn--ghost btn--sm" id="loc-clear">Clear search</button></p></div>';

    $('#map').innerHTML = mapSVG(list);
    $('#loc-count').textContent = list.length;
    $('#loc-word').textContent = list.length === 1 ? 'store' : 'stores';
    $('#loc-near').textContent = state.st !== 'all'
      ? 'in ' + (BD.states[state.st] ? BD.states[state.st].name : state.st)
      : (z ? 'nearest ' + z + ' first' : 'in ' + Object.keys(counts()).length + ' states');
    var input = $('#zip-loc');
    if (z && !input.value && !state.q) input.value = z;
  }

  function fillStateSelect() {
    var c = counts();
    var opts = ['<option value="all">Every state</option>'];
    Object.keys(c).sort(function (a, b) {
      return (BD.states[a] ? BD.states[a].name : a).localeCompare(BD.states[b] ? BD.states[b].name : b);
    }).forEach(function (st) {
      opts.push('<option value="' + st + '">' + BD.esc(BD.states[st] ? BD.states[st].name : st) +
        ' (' + c[st] + ')</option>');
    });
    $('#state-sel').innerHTML = opts.join('');
  }

  /* ---------- events -------------------------------------------------------- */

  document.addEventListener('click', function (e) {
    var t = e.target;
    var pick = t.closest && t.closest('[data-pick]');
    if (pick) {
      var d = BD.dealers.filter(function (x) { return x.id === pick.getAttribute('data-pick'); })[0];
      if (d) {
        if (d.zip) BD.store.set('bd.zip', String(d.zip));
        BD.setDealer(d);
      }
      return;
    }
    var dot = t.closest && t.closest('.mapdot');
    if (dot) {
      state.st = dot.getAttribute('data-state');
      $('#state-sel').value = state.st;
      render();
      var sec = $('#state-' + state.st);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (t.closest && t.closest('#use-loc')) {
      BD.toast('A live site would ask your browser for this. Type a ZIP for now.');
      $('#zip-loc').focus();
      return;
    }
    if (t.id === 'loc-clear') {
      state.q = ''; state.st = 'all'; state.tier = 'all';
      $('#zip-loc').value = ''; $('#state-sel').value = 'all'; $('#tier').value = 'all';
      render();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var dot = e.target.closest && e.target.closest('.mapdot');
    if (dot) { e.preventDefault(); dot.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });

  document.addEventListener('change', function (e) {
    if (e.target.id === 'state-sel') { state.st = e.target.value; render(); }
    if (e.target.id === 'tier') { state.tier = e.target.value; render(); }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id !== 'zip-loc') return;
    state.q = e.target.value;
    render();
  });

  document.addEventListener('bd:dealerchange', function () { state.q = ''; render(); });

  fillStateSelect();
  render();
})();
