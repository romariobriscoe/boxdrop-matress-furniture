/* Dealer locator. The whole BoxDrop network, counted from the data rather
   than written down, so the copy cannot drift from the store list.
   A BoxDrop dealer sets their own price, so every card carries their number
   rather than the site's. */
(function () {
  'use strict';
  var BD = window.BoxDrop;
  var $ = function (s) { return document.querySelector(s); };
  var REF = 'sap-grandbay';          /* one mattress every floor is priced against */

  var state = { q: '', st: 'all', tier: 'all', mapOpen: false };

  function all() { return BD.dealers; }

  function counts() {
    var c = {};
    all().forEach(function (d) { c[d.state] = (c[d.state] || 0) + 1; });
    return c;
  }

  /* Store names spell the brand one way now, but shoppers type it both ways,
     so the brand token is collapsed on each side before comparing. */
  function brandFold(s) { return s.toLowerCase().replace(/\bbox\s+drop\b/g, 'boxdrop'); }

  /* A five digit ZIP in the box is a proximity question, not a filter: it
     orders every store by how near its ZIP is, rather than cutting the list
     down to one state. */
  function searchZip() {
    var q = state.q.trim();
    return /^\d{5}$/.test(q) ? q : null;
  }

  function sortZip() { return searchZip() || BD.zip(); }

  function matches(d) {
    if (state.st !== 'all' && d.state !== state.st) return false;
    if (state.tier !== 'all' && BD.dealerTier(d).key !== state.tier) return false;
    var q = brandFold(state.q.trim());
    if (!q || searchZip()) return true;
    var full = BD.states[d.state] ? BD.states[d.state].name : d.state;
    return brandFold(d.name + ' ' + d.city + ' ' + d.state + ' ' + full + ' ' + d.addr).indexOf(q) > -1;
  }

  function visible() {
    var z = sortZip();
    return all().filter(matches).sort(function (a, b) {
      if (z) {
        var r = BD.compareRank(BD.zipRank(a, z), BD.zipRank(b, z));
        if (r) return r;
      }
      if (a.state !== b.state) return a.state.localeCompare(b.state);
      return a.city.localeCompare(b.city);
    });
  }

  /* ---------- the national map --------------------------------------------
     Real state outlines, from the Census Bureau's boundary files projected
     once into assets/js/usmap.js. Shaded by how many stores a state holds,
     so coverage reads at a glance; a count sits on the states with room for
     one, and every state carries its figure on hover. */

  function shade(n, max) {
    if (!n) return '#EDEFF6';
    var t = Math.sqrt(n) / Math.sqrt(max || 1);          /* sqrt: 22 must not drown 1 */
    return ['#CBD2EC', '#9AA6DA', '#6675C0', '#3A4A9E', '#111D6B'][
      Math.min(4, Math.floor(t * 5))];
  }

  function mapSVG(list) {
    var paths = window.BD_US_PATHS, anchors = window.BD_US_ANCHORS;
    if (!paths) return '';
    var total = counts(), shown = {};
    list.forEach(function (d) { shown[d.state] = (shown[d.state] || 0) + 1; });
    var mine = BD.currentDealer();
    var max = Math.max.apply(null, Object.keys(total).map(function (k) { return total[k]; }));
    var filtering = list.length !== all().length;

    var out = ['<svg viewBox="' + (window.BD_US_VIEWBOX || '0 0 960 600') + '" role="img" ' +
      'aria-label="A map of the contiguous United States shaded by how many BoxDrop stores ' +
      'each state has. ' + all().length + ' stores across ' + Object.keys(total).length + ' states.">'];

    Object.keys(paths).forEach(function (st) {
      var n = total[st] || 0;
      var inResults = (shown[st] || 0) > 0;
      var isMine = mine && mine.state === st;
      var fill = isMine ? '#2DB84B'
        : (filtering && !inResults && n) ? '#D3D8EC'
        : shade(n, max);
      var nm = BD.states[st] ? BD.states[st].name : st;
      out.push('<path class="mapst' + (n ? '' : ' is-off') + '" data-state="' + st + '"' +
        (n ? ' tabindex="0" role="button"' : '') + ' fill="' + fill + '" d="' + paths[st] + '">' +
        '<title>' + BD.esc(nm) + ': ' + (n ? n + ' store' + (n === 1 ? '' : 's') : 'no stores yet') +
        '</title></path>');
    });

    /* Counts only where the shape can hold one without crowding its neighbours. */
    Object.keys(anchors || {}).forEach(function (st) {
      var n = total[st] || 0, a = anchors[st];
      if (!n || a[2] < 2600) return;
      var isMine = mine && mine.state === st;
      var pale = !isMine && (!(shown[st] > 0) && filtering || Math.sqrt(n) / Math.sqrt(max) < 0.45);
      out.push('<text x="' + a[0] + '" y="' + (a[1] + 4) + '" text-anchor="middle" ' +
        'font-family="IBM Plex Mono, monospace" font-size="15" font-weight="600" ' +
        'fill="' + (pale ? '#2A3570' : '#FFFFFF') + '" pointer-events="none">' + n + '</text>');
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
        (isMine ? '<span class="dcard__mine"><svg width="12" height="12" aria-hidden="true"><use href="#i-pin"></use></svg> Your store</span>' : '') +
        '<h3>' + BD.esc(d.name) + '</h3>' +
        '<address class="dcard__addr">' + BD.esc(d.addr) + '</address>' +
        '<p class="dcard__open"><b class="' + (open.open ? 'open' : 'shut') + '">' +
          BD.esc(open.text) + '</b></p>' +
        (price ? '<p class="dcard__price"><span class="amt num">' + BD.money(price) + '</span>' +
          '<span class="was num">' + BD.money(ref.price) + ' online</span></p>' : '') +
        '<a class="btn btn--online btn--sm dcard__visit" href="dealer.html#' + BD.esc(d.id) + '">Visit local page</a>' +
        (d.phone
          ? '<a class="phone-link" href="tel:' + d.phone.replace(/[^0-9]/g, '') + '">' + BD.esc(d.phone) + '</a>'
          : '<span class="phone-link" aria-disabled="true">No number listed</span>') +
      '</div></article>';
  }

  /* Named groups with their own counts, the way the reference locator splits
     its stores from its resellers. Here the natural split is the state. */
  function setMap(open) {
    state.mapOpen = open;
    $('#mapwrap').hidden = !open;
    $('#view-map').setAttribute('aria-expanded', String(open));
    $('#view-map-label').textContent = open ? 'Hide map' : 'View map';
    try { BD.store.set('bd.locmap', open ? '1' : '0'); } catch (e) {}
  }

  /* In proximity mode the list is one run ordered by ZIP, so state headings
     would hide the very ordering that was asked for. */
  function renderNearest(list, zip) {
    var near = list.slice(0, 9), rest = list.slice(9);
    function block(title, note, items, id) {
      if (!items.length) return '';
      return '<section class="dsection"' + (id ? ' id="' + id + '"' : '') + '>' +
        '<header class="dsection__head"><h2>' + BD.esc(title) + '</h2>' +
        '<span class="dsection__n">' + items.length + ' ' + (items.length === 1 ? 'store' : 'stores') + '</span>' +
        (note ? '<p>' + BD.esc(note) + '</p>' : '') + '</header>' +
        '<div class="dlist">' + items.map(cardHTML).join('') + '</div></section>';
    }
    return block('Closest to ' + zip, 'Ordered by how near each store\u2019s ZIP is to yours.', near, 'nearest') +
           block('The rest of the network', null, rest);
  }

  function render() {
    var list = visible();
    var zq = searchZip();
    if (zq) {
      $('#dsections').innerHTML = list.length
        ? renderNearest(list, zq)
        : '<div class="empty"><h3>No stores match that</h3><p>Clear the floor or state filter and try again.</p>' +
          '<p style="margin-top:20px"><button type="button" class="btn btn--ghost btn--sm" id="loc-clear">Clear search</button></p></div>';
      $('#map').innerHTML = mapSVG(list);
      $('#loc-count').textContent = list.length;
      $('#loc-word').textContent = list.length === 1 ? 'store' : 'stores';
      $('#loc-near').textContent = 'nearest ' + zq + ' first';
      return;
    }
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
        '<p>Try a state, a town or a five digit ZIP. BoxDrop has ' + all().length +
        ' stores but not one in every county yet.</p>' +
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
    var dot = t.closest && t.closest('.mapst');
    if (dot) {
      state.st = dot.getAttribute('data-state');
      $('#state-sel').value = state.st;
      render();
      setMap(false);
      var sec = $('#state-' + state.st);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (t.closest && t.closest('#use-loc')) {
      BD.toast('A live site would ask your browser for this. Type a ZIP for now.');
      $('#zip-loc').focus();
      return;
    }
    if (t.closest && t.closest('#view-map')) { setMap(!state.mapOpen); return; }
    if (t.id === 'loc-clear') {
      state.q = ''; state.st = 'all'; state.tier = 'all';
      $('#zip-loc').value = ''; $('#state-sel').value = 'all'; $('#tier').value = 'all';
      render();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var dot = e.target.closest && e.target.closest('.mapst');
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

  document.addEventListener('bd:dealerchange', function () {
    var box = $('#zip-loc');
    state.q = box && /^\d{5}$/.test(box.value.trim()) ? box.value.trim() : '';
    render();
  });

  fillStateSelect();
  setMap(BD.store.get('bd.locmap', '0') === '1');
  render();
})();
